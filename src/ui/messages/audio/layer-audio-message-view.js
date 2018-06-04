/**
 * UI for an Audio Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-view';
 * ```
 *
 * @class Layer.UI.messages.AudioMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import './layer-audio-message-model';
import './layer-audio-message-large-view';
import Clickable from '../../mixins/clickable';
import { logger } from '../../../utils';

registerComponent('layer-audio-message-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
    layer-audio-message-view {
      display: flex;
      width: 100%;
      flex-direction: column;
      justify-content: flex-end;
    }
  `,
  template: `
    <div layer-id="preview" class="layer-audio-images"></div>
    <div class="layer-audio-progress-container">
      <div layer-id="bufferBar" class="layer-audio-buffer-bar"></div>
      <div layer-id="progressBar" class="layer-audio-progress-bar"></div>
    </div>
  `,
  properties: {
    /**
     * Use a Standard Message Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-standard-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-standard-message-view-container',
    },

    /**
     * An `<audio />` node that is used to play the content but which is not inserted into the DOM
     *
     * @property {HTMLElement} audio
     */
    audio: {},

    /**
     * Get/Set whether the player is playing its content.
     *
     * You can toggle playback on/off with:
     * ```
     * view.playing = !view.playing;
     * ```
     *
     * @property {Boolean} playing
     */
    playing: {
      noGetterFromSetter: true,
      set(value) {
        if (value) {
          const result = this.properties.audio.play();
          if (typeof Promise !== 'undefined' && result instanceof Promise) {
            result.catch((err) => {
              logger.error('LAYER-AUDIO-MESSAGE-VIEW: Play failed: ', err);
              this.properties.playButton.classList.add('layer-play-button');
              this.properties.playButton.classList.remove('layer-pause-button');
            });
          }
          this.properties.playButton.classList.remove('layer-play-button');
          this.properties.playButton.classList.add('layer-pause-button');

          const players = document.querySelectorAll('audio');
          for (let i = 0; i < players.length; i++) players[i].pause();
          const audioMessages = document.querySelectorAll('layer-audio-message-view');
          for (let i = 0; i < audioMessages.length; i++) {
            if (audioMessages[i] !== this) audioMessages[i].playing = false;
          }
        } else {
          this.properties.audio.pause();
          this.properties.playButton.classList.add('layer-play-button');
          this.properties.playButton.classList.remove('layer-pause-button');
        }
      },
      get() {
        return !this.properties.audio.paused;
      },
    },

    /**
     * Maximum width allowed for a preview image in px.
     *
     * @property {Number} [maxWidth=450]
     */
    maxWidth: {
      value: 450,
    },

    /**
     * Minimum width allowed for a preview image in px
     *
     * @property {Number} [minWidth=192]
     */
    minWidth: {
      get() {
        if (this._hasValidPreview()) {
          return this.properties.minWidth;
        } else {
          return 192;
        }
      },
    },

    /**
     * Maximum height allowed for a preview image in px.
     *
     * @property {Number} [maxHeight=250]
     */
    maxHeight: {
      value: 250,
    },
  },
  methods: {
    /**
     * Reset the audio player.
     *
     * This is typically needed after it has finished playing to the end.
     *
     * @method resetAudio
     */
    resetAudio() {
      this.properties.audio.pause();
      this.properties.audio.currentTime = 0;
      this.properties.audio.load(); // chrome needs this for ogg; safari needs this for mp3. Wierd.
      this.playing = false;
      this.renderProgressBar();
      this.renderBufferBar();
    },
    onCreate() {
      this.isHeightAllocated = false;
      this.properties.audio = new Audio();
      this.properties.audio.preload = 'metadata';
      this.properties.audio.addEventListener('ended', this.resetAudio.bind(this));
      this.properties.audio.addEventListener('error', this.handleError.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.renderProgressBar.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.renderBufferBar.bind(this));
      this.properties.audio.addEventListener('progress', this.renderBufferBar.bind(this));
    },

    /**
     * Does this message model hava a valid preview image?
     *
     * Its only valid if there is a preview/previewUrl and width/height
     *
     * @method _hasValidPreview
     * @return {Boolean}
     * @private
     */
    _hasValidPreview() {
      return (this.model.preview || this.model.previewUrl) && (this.model.previewWidth && this.model.previewHeight);
    },

    /**
     * Setup the preview image or the file icon if there is no preview image.
     *
     * @method _setupPreview
     * @private
     */
    _setupPreview() {
      if (this._hasValidPreview()) {
        this.classList.add('layer-audio-preview');
        this.model.getPreviewUrl(url => (this.nodes.preview.style.backgroundImage = 'url(' + url + ')'));
      } else {
        // Use the file icon instead of a preview image
        this.classList.add('layer-file-audio');
      }
    },

    /**
     * Setup the play button that will play/pause the audio player.
     *
     * @method _setupPlayButton
     * @private
     */
    _setupPlayButton() {
      const playButton = this.properties.playButton = document.createElement('div');
      playButton.classList.add('layer-play-button');
      this.parentComponent.customControls = playButton;
      this.addClickHandler('play-button', playButton, this.onPlayClick.bind(this));
    },
    onAfterCreate() {
      this.model.getSourceUrl(url => (this.properties.audio.src = url));
      this._setupPlayButton();
      this._setupPreview();
      this._resizeContent();
    },

    /**
     * Setup the message size based on the previewWidth/previewHeight.
     *
     * @method _resizeContent
     * @private
     */
    _resizeContent() {
      const width = this.getAvailableMessageWidth();
      if (width) {
        if ((this.model.preview || this.model.previewUrl) && (this.model.previewWidth && this.model.previewHeight)) {
          // Setup sizes for this node and the parent node
          const sizes = this.getBestDimensions({
            contentWidth: this.model.previewWidth,
            contentHeight: this.model.previewHeight,
            maxHeight: this.maxHeight,
            maxWidth: this.maxWidth,
            minWidth: this.minWidth,
          });

          this.nodes.preview.style.width = sizes.width + 'px';
          this.nodes.preview.style.height = sizes.height + 'px';
          if (sizes.width >= this.minWidth) {
            this.messageViewer.style.width = this.nodes.preview.style.width;
          }
        }
        // If it needed to be allocated, its now allocated
        this.isHeightAllocated = true;
      }
    },

    // See parent method
    onAttach() {
      // resizeContent should already have triggered, but if onAfterCreate was called when the parent
      // was not yet added to the DOM, then it will need to be resolved here.
      if (!this.isHeightAllocated) this._resizeContent();
    },

    /**
     * When the play button is clicked, toggle playback... and make sure that the Action Handler is not triggered.
     *
     * Insure that any other audio players have stopped
     *
     * You may add a mixin to customize this behavior.
     *
     * @method onPlayClick
     * @param {Event} evt
     * @protected
     */
    onPlayClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.playing = !this.playing;
    },

    /**
     * When the user clicks on the Message (but not the Play Button), do some setup before running the default action.
     *
     * Preparation for opening the Large Message View includes:
     *
     * 1. Stop playing the audio (further playing will be handled by the large message view)
     * 2. Report what time we have played up to so that the Large Message View can resume from there.
     *
     * @method runAction
     * @protected
     */
    runAction() {
      this.playing = false;
      this.model.currentTime = this.properties.audio.currentTime;
    },

    /**
     * If the Audio File has problems loading (or is not a proper audio file) render the playButton as an unplayable button.
     *
     * @method handleError
     * @param {Event} evt
     * @protected
     */
    handleError(evt) {
      logger.error('LAYER-AUDIO-MESSAGE-VIEW: ', evt);
      this.properties.playButton.className = 'layer-not-playable-button';
    },

    /**
     * Render our current progress in the playback.
     *
     * Add mixins to customize this rendering.
     *
     * @method renderProgressBar
     * @protected
     */
    renderProgressBar() {
      this.nodes.progressBar.style.width =
        Math.round(100 * this.properties.audio.currentTime / this.properties.audio.duration) + '%';
    },

    /**
     * Render to indicate how much of the audio file has been buffered.
     *
     * Add mixins to customize this rendering.
     *
     * @method renderBufferBar
     * @protected
     */
    renderBufferBar() {
      const buffered = this.properties.audio.buffered;
      const bufferBar = this.nodes.bufferBar;
      if (!buffered.length) {
        bufferBar.style.width = '0%';
      } else {
        const duration = this.properties.audio.duration;
        let sum = 0;
        for (let i = 0; i < buffered.length; i++) sum = sum + buffered.end(i) - buffered.start(i);
        bufferBar.style.width = Math.round(100 * sum / duration) + '%';
      }
    },

    /**
     * Any time the model changes with a new `currentTime` property, rerender and update the progress/buffered bars.
     *
     * Also resume playback on the assumption that this value has been shared so that other players may pick up where the
     * viewer that is dismissed left off.
     *
     * @method onRerender
     */
    onRerender(evt) {
      if (evt && evt.hasProperty('currentTime') && this.properties.audio.currentTime !== this.model.currentTime) {
        // Restoring currentTime seems to fail based on unknown browser state
        this.properties.audio.currentTime = this.model.currentTime;
        this.renderBufferBar();
        this.renderProgressBar();
        this.playing = true;
      }
    },

    /**
     * When this view is removed from the DOM, pause the playback.
     *
     * This should never be called directly.
     *
     * @method onDetach
     * @protected
     */
    onDetach() {
      if (this.properties.audio) {
        this.properties.audio.pause();

        // This helps deallocate any memory/processing this thing is consuming
        this.properties.audio.src = '';
      }
    },

    /**
     * Called when this widget is being deallocated; insure that the audio player is paused.
     *
     * @method onDestroy
     */
    onDestroy() {
      if (this.properties.audio) {
        this.properties.audio.pause();
        delete this.properties.audio;
      }
    },
  },
});
