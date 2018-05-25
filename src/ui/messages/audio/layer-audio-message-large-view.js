/**
 * UI for a Large Audio Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-view';
 * ```
 *
 * @class Layer.UI.messages.AudioMessageLargeView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import AudioModel from './layer-audio-message-model';
import Clickable from '../../mixins/clickable';

registerComponent('layer-audio-message-large-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
    layer-audio-message-large-view {
      display: flex;
      flex-direction: column;
    }
    layer-audio-message-large-view audio {
      width: 100%;
    }
    layer-audio-message-large-view .layer-audio-inner {
      overflow-y: auto;
    }
    layer-audio-message-large-view .layer-audio-preview {
      display: inline-block;
      background-repeat: no-repeat;
    }
  `,
  /* eslint-disable */
  template: `
    <div class='layer-vertical-spacer'></div>
    <div class="layer-audio-inner">
      <div layer-id="preview" class="layer-audio-preview"></div>
      <div layer-id="fileIcon" class="layer-file-audio"></div>
      <div class="layer-card-body">
        <div layer-id="title" class="layer-standard-card-container-title"></div>
        <div layer-id="description1" class="layer-standard-card-container-description"></div>
        <div layer-id="description2" class="layer-standard-card-container-description"></div>
        <div layer-id="description3" class="layer-standard-card-container-description"></div>
        <div layer-id="footer1" class="layer-standard-card-container-footer"></div>
        <div layer-id="footer2" class="layer-standard-card-container-footer"></div>
      </div>
    </div>
    <div class='layer-vertical-spacer'></div>
    <audio layer-id="player" preload="auto" controls="controls"></audio>
  `,
  /* eslint-enable */
  properties: {

    /**
     * Maximum width allowed for a preview image in px.
     *
     * @property {Number} [maxPreviewWidth=250]
     */
    maxPreviewWidth: {
      value: 250,
    },

    /**
     * Maximum height allowed for a preview image in px.
     *
     * @property {Number} [maxPreviewHeight=250]
     */
    maxPreviewHeight: {
      value: 250,
    },

    /**
     * Specifiees whether the player should automatically play or not when this view is shown
     *
     * @property {Boolean} [autoplay=true]
     */
    autoplay: {
      value: true,
      type: Boolean,
    },
  },
  methods: {
    onCreate() {
      this.isHeightAllocated = false;
    },

    /**
     * Returns a title for use in a titlebar.
     *
     * @method getTitle
     * @return {String}
     */
    getTitle() {
      return AudioModel.LabelSingular;
    },

    // Setup the player and poster once properties are available.
    onAfterCreate() {
      this.nodes.player.autoplay = this.autoplay;

      // If the model indicates we left off somewhere when previously playing this,
      // resume playback once the data is loaded.
      this.nodes.player.addEventListener('loadeddata', () => {
        if (this.model.currentTime) {
          this.nodes.player.currentTime = this.model.currentTime;
        }
      });

      this.nodes.player.addEventListener('playing', this.onPlay.bind(this));
      this.nodes.player.addEventListener('pause', () => (this.properties.playing = false));
      this.nodes.player.addEventListener('ended', () => (this.properties.playing = false));

      // Setup the player's source url
      this.model.getSourceUrl(url => (this.nodes.player.src = url));

      // Setup the player's preview/file icon
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.nodes.preview.style.backgroundImage = 'url(' + url + ')'));
      } else {
        this.classList.add('show-audio-file-icon');
      }
      this._resizeContent();
    },

    // Setup the preview image sizing once the view is in the DOM
    _resizeContent() {
      const width = this.getAvailableMessageWidth();
      if (width) {
        if (this.model.preview || this.model.previewUrl) {
          const sizes = this.getBestDimensions({
            contentWidth: this.model.previewWidth,
            contentHeight: this.model.previewHeight,
            maxHeight: this.maxPreviewHeight,
            maxWidth: this.maxPreviewWidth,
          });

          this.nodes.preview.style.width = sizes.width + 'px';
          this.nodes.preview.style.height = (sizes.height || sizes.width) + 'px';
        }
        // If it needed to be allocated, its now allocated
        this.isHeightAllocated = true;
      }
    },

    /**
     * Any time playback starts, insure that any other audio playing elsewhere has stopped.
     *
     * @method onPlay
     */
    onPlay() {
      this.properties.playing = true;
      const players = document.querySelectorAll('audio');
      for (let i = 0; i < players.length; i++) {
        if (players[i] !== this.nodes.player) players[i].pause();
      }
      const audioMessages = document.querySelectorAll('layer-audio-message-view');
      for (let i = 0; i < audioMessages.length; i++) {
        if (audioMessages[i] !== this) audioMessages[i].playing = false;
      }
    },

    onAttach() {
      // resizeContent should already have triggered, but if onAfterCreate was called when the parent
      // was not yet added to the DOM, then it will need to be resolved here.
      if (!this.isHeightAllocated) this._resizeContent();
    },

    onDetach() {
      if (this.properties.playing) {
        this.model.currentTime = this.nodes.player.currentTime;
      }
    },

    /**
     * Render all of the metadata
     *
     * @method onRender
     */
    onRender() {
      const nodes = [
        this.nodes.title,
        this.nodes.description1,
        this.nodes.description2,
        this.nodes.description3,
        this.nodes.footer1,
        this.nodes.footer2,
      ];

      nodes.forEach((node, index) => (node.innerHTML = this.model.getMetadataAtIndex(index)));
    },
  },
});
