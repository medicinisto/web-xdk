/**
 * UI for an Video Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/video/layer-video-message-view';
 * ```
 *
 * @class Layer.UI.messages.VideoMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
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
     * @property {Number} [maxWidth=384]
     */
    maxWidth: {
      value: 384,
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
     * @property {Number} [minPreviewWidth=48]
     */
    minPreviewWidth: {
      value: 48,
    },

    /**
     * Minimum height allowed for a preview image in px.
     *
     * @property {Number} [minPreviewHeight=48]
     */
    minPreviewHeight: {
      value: 48,
    },
  },
  methods: {
    // See parent method
    onCreate() {
      this.isHeightAllocated = false;
    },

    // See parent method
    onAfterCreate() {
      const video = document.createElement('video');
      if (!video.canPlayType(this.model.mimeType)) {
        this.nodes.playIcon.className = 'layer-not-playable-button';
      }
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.style.backgroundImage = 'url(' + url + ')'));
      }
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
        // Setup sizes for this node and the parent node
        const sizes = this.getBestDimensions({
          contentWidth: this.model.previewWidth,
          contentHeight: this.model.previewHeight,
          maxHeight: this.maxHeight,
          maxWidth: this.maxWidth,
          minHeight: this.minPreviewHeight,
          minWidth: this.minPreviewWidth,
        });
        this.style.width = sizes.width + 'px';
        this.style.height = sizes.height + 'px';
        if (sizes.width >= this.minWidth) {
          this.messageViewer.width = sizes.width;
        }

        this.isHeightAllocated = true;
      }
    },

    /**
     * After we have a parent node and some clue as to our width/height, setup the preview display.
     *
     * @method onAttach
     */
    onAttach() {
      // resizeContent should already have triggered, but if onAfterCreate was called when the parent
      // was not yet added to the DOM, then it will need to be resolved here.
      if (!this.isHeightAllocated) this._resizeContent();
    },
  },
});

