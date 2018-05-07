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
import Constants from '../../constants';
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
    }
  `,
  template: `
    <div class='layer-vertical-spacer'></div>
    <div class="layer-audio-inner">
      <div layer-id="preview" class="layer-audio-preview"></div>
      <div layer-id="fileIcon" class="layer-file-audio"></div>
      <div class="layer-card-body">
        <div layer-id="title" class="layer-standard-card-container-title"></div>
        <div layer-id="description1" class="layer-standard-card-container-description layer-audio-message-large-view-artist"></div>
        <div layer-id="description2" class="layer-standard-card-container-description layer-audio-message-large-view-album"></div>
        <div layer-id="description3" class="layer-standard-card-container-description layer-audio-message-large-view-genre"></div>
        <div layer-id="footer1" class="layer-standard-card-container-footer layer-audio-message-large-view-duration"></div>
        <div layer-id="footer2" class="layer-standard-card-container-footer layer-audio-message-large-view-size"></div>
      </div>
    </div>
    <div class='layer-vertical-spacer'></div>
    <audio layer-id="player" preload="auto" controls="controls"></audio>
  `,

  properties: {
    // See parent class
    widthType: {
      value: Constants.WIDTH.FLEX,
    },

    /**
     * Maximum width allowed for a preview image in px.
     *
     * @property {Number} [maxWidth=250]
     */
    maxWidth: {
      value: 250,
    },

    /**
     * Maximum height allowed for a preview image in px.
     *
     * @property {Number} [maxHeight=250]
     */
    maxHeight: {
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

      // Setup the player's source url
      this.model.getSourceUrl(url => (this.nodes.player.src = url));

      // Setup the player's preview/file icon
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.nodes.preview.style.backgroundImage = 'url(' + url + ')'));
      } else {
        this.classList.add('show-audio-file-icon');
      }
    },

    // Setup the preview image sizing once the view is in the DOM
    onAttach() {
      if (this.model.preview || this.model.previewUrl) {
        const sizes = this._getBestDimensions();
        this.nodes.preview.style.width = sizes.width + 'px';
        this.nodes.preview.style.height = sizes.height + 'px';
      }
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
      this.nodes.title.innerHTML = this.model.getTitle();
      this.nodes.description1.innerHTML = this.model.artist;
      this.nodes.description2.innerHTML = this.model.album;
      this.nodes.description3.innerHTML = this.model.genre;
      if (this.model.duration) this.nodes.footer1.innerHTML = this.model.getDuration();
      if (this.model.size) this.nodes.footer2.innerHTML = this.model.getSize();
    },

    /**
     * Calculate best width and height for the preview image given the previewWidth/height and the maxWidth/height.
     *
     * @method _getBestDimensions
     * @private
     * @return {Object}
     * @return {Number} return.width
     * @return {Number} return.height
     */
    _getBestDimensions() {
      let height = this.model.previewHeight;
      let width = this.model.previewWidth;

      const maxWidthAvailable = this.parentNode.clientWidth;
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
  },
});
