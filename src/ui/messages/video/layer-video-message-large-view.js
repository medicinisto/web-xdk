/**
 * UI for a Large Video Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-video-message-view';
 * ```
 *
 * @class Layer.UI.messages.VideoMessageLargeView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import VideoModel from './layer-video-message-model';
import Clickable from '../../mixins/clickable';

registerComponent('layer-video-message-large-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
    layer-video-message-large-view {
      display: flex;
      flex-direction: column;
    }
    layer-video-message-large-view .layer-video-inner {
      overflow-y: auto;
    }
  `,
  /* eslint-disable */
  template: `
    <video layer-id="player" preload="auto" controls="controls"></video>
    <div class="layer-card-body">
      <div layer-id="title" class="layer-standard-card-container-title"></div>
      <div layer-id="description1" class="layer-standard-card-container-description"></div>
      <div layer-id="description2" class="layer-standard-card-container-description"></div>
      <div layer-id="footer1" class="layer-standard-card-container-footer"></div>
      <div layer-id="footer2" class="layer-standard-card-container-footer"></div>
      <div layer-id="footer3" class="layer-standard-card-container-footer"></div>
    </div>
  `,
  /* eslint-enable */
  properties: {

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
      return VideoModel.LabelSingular;
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
        this.model.getPreviewUrl(url => (this.nodes.player.poster = url));
      }
    },

    // Setup the preview image sizing once the view is in the DOM
    onAttach() {
      const sizes = this._getBestDimensions();
      this.nodes.player.style.width = sizes.width + 'px';
      this.nodes.player.style.height = sizes.height + 'px';

      const styles = getComputedStyle(this.lastChild);
      const margins = parseInt(styles.getPropertyValue('margin-top'), 10) +
        parseInt(styles.getPropertyValue('margin-bottom'), 10);
      const requiredHeight = this.lastChild.clientHeight + this.lastChild.offsetTop + margins;

      this.trigger('layer-container-reduce-height', {
        height: requiredHeight,
      });
    },

    onDetach() {
      if (this.nodes.player.currentTime < this.nodes.player.duration) {
        this.model.currentTime = this.nodes.player.currentTime;
      } else if (this.nodes.player.currentTime === this.nodes.player.duration) {
        this.model.currentTime = 0;
      }
    },

    /**
     * Render all of the metadata
     *
     * @method onRender
     */
    onRender() {
      this.nodes.title.innerHTML = this.model.getTitle();
      const nodes = [
        this.nodes.description1,
        this.nodes.description2,
        this.nodes.footer1,
        this.nodes.footer2,
        this.nodes.footer3,
      ];

      nodes.forEach((node, index) => (node.innerHTML = this.model.getMetadataAtIndex(index)));
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
      let height = this.model.height;
      let width = this.model.width;

      if (!width) width = this.model.aspectRatio * height;
      if (!height) height = this.model.aspectRatio / width;


      const maxWidth = this.messageViewer.parentNode.clientWidth;
      const maxHeight = this.messageViewer.parentNode.clientHeight;
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
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      return { width, height };
    },
  },
});
