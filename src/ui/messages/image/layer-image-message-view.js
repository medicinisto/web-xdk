/**
 * UI for a Image Message
 *
 * ### Importing
 *
 * Included with the standard build. For custom build, import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/image/layer-image-message-view';
 * ```
 *
 * @class Layer.UI.messages.ImageMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import ImageManager from 'blueimp-load-image/js/load-image';
import 'blueimp-load-image/js/load-image-orientation';
import 'blueimp-load-image/js/load-image-meta';
import 'blueimp-load-image/js/load-image-exif';

import { registerComponent } from '../../components/component';
import { logger } from '../../../utils';
import MessageViewMixin from '../message-view-mixin';
import './layer-image-message-model';

registerComponent('layer-image-message-view', {
  mixins: [MessageViewMixin],
  style: `layer-image-message-view {
      display: block;
      overflow: hidden;
      width: 100%;
    }
    layer-image-message-view img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    layer-message-viewer.layer-image-message-view > * {
      cursor: pointer;
    }
 `,
  template: '<img layer-id="image" />',
  properties: {

    minWidth: {
      noGetterFromSetter: true,
      get() {
        return this.parentComponent.isShowingMetadata ? this.properties.minWidth : 0;
      },
    },

    maxWidth: {
      value: 450,
    },

    /**
     * Fix the image height if image is sent as an image with metadata displaying below it.
     *
     * This can be changed, but needs to be changed at intiialization time, not runtime.
     *
     * @property {Number} [heightWithMetadata=250]
     */
    heightWithMetadata: {
      value: 250,
    },

    /**
     * If showing only the image, and no metadata below it, use a maximum height of 768px.
     *
     * @property {Number} [maxHeightWithoutMetadata=768]
     */
    maxHeightWithoutMetadata: {
      value: 768,
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
  },
  methods: {
    onCreate() {
      this.nodes.image.addEventListener('load', evt => this._imageLoaded(evt.target));

      // Image Message heights aren't known until the metadata has been parsed; and cannot be scaled
      // unless we know how much space is available in the Message List
      this.isHeightAllocated = false;
    },

    // See parent component for definition
    onAfterCreate() {
      this._resizeContent();
    },

    onAttach() {
      // resizeContent should already have triggered, but if onAfterCreate was called when the parent
      // was not yet added to the DOM, then it will need to be resolved here.
      if (!this.isHeightAllocated) this._resizeContent();
    },

    _resizeContent() {
      const width = this.getAvailableMessageWidth();
      if (width) {
        const hasMetadata = this.parentComponent.isShowingMetadata;
        // Setup sizes for this node and the parent node
        const sizes = this.getBestDimensions({
          contentWidth: this.model.previewWidth,
          contentHeight: this.model.previewHeight,
          maxHeight: hasMetadata ? this.heightWithMetadata : this.maxHeightWithoutMetadata,
          maxWidth: this.maxWidth,
        });

        this.style.width = sizes.width + 'px';
        this.style.height = sizes.height + 'px';
        if (sizes.width >= this.minWidth) {
          this.messageViewer.width = sizes.width;
        } else {
          this.messageViewer.width = this.minWidth;
        }

        // If it needed to be allocated, its now allocated
        this.isHeightAllocated = true;
      }
    },

    /**
     * Every time the model changes, or after initialization, rerender the image.
     *
     * TODO: Currently uses an img tag for sourceUrl/previewUrl and a canvas for
     * source/preview. This should consistently use a canvas.
     *
     * @method onRerender
     */
    onRender() {

      // Get the blob and render as a canvas
      if (this.model.source || this.model.preview) {
        this.model.getPreviewBlob(blob => this._renderCanvas(blob));
      } else {

        // Else get the imageUrl/previewUrl and stick it in the image src property.
        const img = this.nodes.image;
        img.src = this.model.previewUrl || this.model.sourceUrl;
      }
    },

    /**
     * Called when the image has finished loading via `sourceUrl` or `previewUrl`.
     *
     * Set the `isHeightAllocated` property to `true` as its height is now fixed and known.
     *
     * Set the width if the width is too great.
     *
     * @param {HTMLElement} img
     */
    _imageLoaded() {
      if (this.properties._internalState.onDestroyCalled) return;
      if (!this.properties.usingCanvas) {
        const img = this.nodes.image;
        this.model.previewWidth = img.naturalWidth;
        this.model.previewHeight = img.naturalHeight;
        this._resizeContent();
      }
    },


    /**
     * Generate a Canvas to render our image in order to enforce exif orientation which is ignored by browser "img" tag.
     *
     * @method _renderCanvas
     * @private
     * @param {Blob} blob
     */
    _renderCanvas(blob) {

      // Read the EXIF data
      ImageManager.parseMetaData(
        blob, (data) => {
          const options = {
            canvas: true,
            orientation: this.model.orientation,
            width: this.model.orientation >= 5 ? this.model.previewHeight : this.model.previewWidth,
            height: this.model.orientation >= 5 ? this.model.previewWidth : this.model.previewHeight,
          };

          if (!this.model.orientation && data.imageHead && data.exif) {
            options.orientation = data.exif.get('Orientation') || 1;
          }

          // Write the image to a canvas with the specified orientation
          ImageManager(blob, (canvas) => {
            if (canvas instanceof HTMLElement) {
              this.properties.usingCanvas = true;
              this.nodes.image.src = canvas.toDataURL();
              this.isHeightAllocated = true;
            } else {
              logger.error(canvas);
            }
          }, options);
        },
      );
    },
  },
});
