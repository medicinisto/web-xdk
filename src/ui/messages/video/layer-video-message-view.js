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
import Constants from '../../constants';
import './layer-video-message-model';
import './layer-video-message-large-view';

registerComponent('layer-video-message-view', {
  mixins: [MessageViewMixin],

  style: `
    layer-video-message-view {
      display: flex;
      width: 100%;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `,
  template: `
    <div layer-id="playIcon" class="layer-play-button"></div>
  `,
  properties: {
    // See parent class
    widthType: {
      value: Constants.WIDTH.FLEX,
    },

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
     * Maximum width allowed for a preview image in px.
     *
     * @property {Number} [maxWidth=450]
     */
    maxWidth: {
      value: 450,
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
     * Minimum width allowed for a preview image in px.
     *
     * @property {Number} [minWidth=48]
     */
    minWidth: {
      value: 48,
    },

    /**
     * Minimum height allowed for a preview image in px.
     *
     * @property {Number} [minHeight=48]
     */
    minHeight: {
      value: 48,
    },
  },
  methods: {
    onAfterCreate() {
      const video = document.createElement('video');
      if (!video.canPlayType(this.model.mimeType)) {
        this.nodes.playIcon.className = 'layer-not-playable-button';
      }
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.style.backgroundImage = 'url(' + url + ')'));
      }
    },


    /**
     * After we have a parent node and some clue as to our width/height, setup the preview display.
     *
     * @method onAttach
     * @private
     */
    onAttach() {
      // Setup sizes for this node and the parent node
      const sizes = this._getBestDimensions();
      this.style.width = sizes.width + 'px';
      this.style.height = sizes.height + 'px';
      if (sizes.width >= this.preferredMinWidth) {
        this.messageViewer.style.width = this.style.width;
      }
    },

    /**
     * Calculate best width and height for the preview image given the previewWidth/height and the maxWidth/height.
     *
     * TODO: Reusable code should be moved to Message View Mixin
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

      if (!height && !width) {
        height = this.model.height;
        width = this.model.width;
      }
      if (!width) width = this.model.aspectRatio * height;
      if (!height) height = this.model.aspectRatio / width;

      const maxWidthAvailable = this.getMaxMessageWidth();
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

      if (width < this.minWidth) {
        width = this.minWidth;
        height = width / ratio;
      }

      if (height < this.minHeight) {
        height = this.minHeight;
        width = height * ratio;
      }

      return {
        width: Math.round(width),
        height: Math.round(height),
      };
    },
  },
});

