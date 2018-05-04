/**
 * UI for an Audio Message
 *
 * > TODO: Progress Bars
 * > TODO: Broken Play Button
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
import Constants from '../../constants';
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
    <div layer-id="poster" class="layer-audio-images"></div>
    <div class="layer-audio-progress-container">
    <div layer-id="bufferBar" class="layer-audio-buffer-bar"></div>
    <div layer-id="progressBar" class="layer-audio-progress-bar"></div>
    </div>
  `,
  properties: {
    // See parent class
    widthType: {
      value: Constants.WIDTH.FLEX,
    },

    /**
     * Use a Standard Display Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-standard-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-standard-message-view-container',
    },

    audio: {},
    playing: {
      noGetterFromSetter: true,
      set(value) {
        if (value) {
          const result = this.properties.audio.play();
          if (typeof Promise !== 'undefined' && result instanceof Promise) {
            result.catch((err) => {
              logger.error('Play failed: ', err);
              this.properties.playButton.classList.add('layer-play-button');
              this.properties.playButton.classList.remove('layer-pause-button');
            });
          }
          this.properties.playButton.classList.remove('layer-play-button');
          this.properties.playButton.classList.add('layer-pause-button');
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
    maxWidth: {
      value: 450,
    },
    // for poster, not inclusive of the progress bars
    maxHeight: {
      value: 250,
    },
  },
  methods: {

    resetAudio() {
      this.properties.audio.pause();
      this.properties.audio.currentTime = 0;
      this.properties.audio.load(); // chrome needs this for ogg; safari needs this for mp3. Wierd.
      this.playing = false;
      this.renderCurrentTime();
      this.renderBufferBar();
    },
    onCreate() {
      this.properties.audio = new Audio();
      this.properties.audio.preload = 'metadata';
      this.properties.audio.addEventListener('ended', this.resetAudio.bind(this));
      this.properties.audio.addEventListener('error', this.handleError.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.renderCurrentTime.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.renderBufferBar.bind(this));
      this.properties.audio.addEventListener('progress', this.renderBufferBar.bind(this));
    },
    _setupPoster() {
      if ((this.model.preview || this.model.previewUrl) && (this.model.previewWidth && this.model.previewHeight)) {
        this.classList.add('layer-audio-poster');
        this.model.getPreviewUrl(url => (this.nodes.poster.style.backgroundImage = 'url(' + url + ')'));
        const sizes = this._getBestDimensions();
        this.nodes.poster.style.width = sizes.width + 'px';
        this.nodes.poster.style.height = sizes.height + 'px';
        if (sizes.width >= this.preferredMinWidth) {
          this.parentComponent.style.width = this.style.width;
        }
      } else {
        this.classList.add('layer-file-audio');
      }
    },
    _setupPlayButton() {
      const playButton = this.properties.playButton = document.createElement('div');
      playButton.classList.add('layer-play-button');
      this.parentComponent.customControls = playButton;
      this.addClickHandler('play-button', playButton, this.onPlayClick.bind(this));
    },
    onAfterCreate() {
      this.model.getSourceUrl(url => (this.properties.audio.src = url));

      this._setupPlayButton();
      this._setupPoster();
    },

    onPlayClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.playing = !this.playing;
    },

    // User has tapped on the message rather than the play button
    runAction() {
      this.playing = false;
      this.model.currentTime = this.properties.audio.currentTime;
    },

    handleError(evt) {
      logger.error(evt);
      this.properties.playButton.className = 'layer-not-playable-button';
    },

    renderCurrentTime() {
      this.nodes.progressBar.style.width = (100 * this.properties.audio.currentTime / this.properties.audio.duration) + '%';
    },

    renderBufferBar() {
      const buffered = this.properties.audio.buffered;
      const bufferBar = this.nodes.bufferBar;
      if (!buffered.length) {
        bufferBar.style.width = '0%';
      } else {
        const duration = this.properties.audio.duration;
        let sum = 0;
        for (let i = 0; i < buffered.length; i++) sum = sum + buffered.end(i) - buffered.start(i) ;
        bufferBar.style.width = (100 * sum / duration) + '%';
      }
    },

    /**
     *
     * @method onRerender
     */
    onRerender(evt) {
      if (evt && evt.hasProperty('currentTime') && this.properties.audio.currentTime !== this.model.currentTime) {
        this.properties.audio.currentTime = this.model.currentTime;
        this.renderBufferBar();
        this.playing = true;
      }
    },


    _getBestDimensions() {
      let height = this.model.previewHeight;
      let width = this.model.previewWidth;

      const maxWidthAvailable = this.getMessageListWidth() * 0.85;
      const maxWidth = Math.min(this.maxWidth, maxWidthAvailable);
      let ratio;

      if (width && height) {
        ratio = width / height;
      } else {
        ratio = 1;
      }

      if (width > maxWidth) {
        width = maxWidth;
        height = width / ratio;
      }
      if (height > this.maxHeight) {
        height = this.maxHeight;
        width = height * ratio;
      }

      return { width, height };
    },

    onDetach() {
      if (this.properties.audio) {
        this.properties.audio.pause();
      }
    },
    onDestroy() {
      if (this.properties.audio) {
        this.properties.audio.pause();
        delete this.properties.audio;
      }
    },
  },
});
