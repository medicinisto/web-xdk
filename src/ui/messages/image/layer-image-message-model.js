/**
 * The Image Message is typically used to send just a photo, but it can also be used
 * to send a photo with title, description, etc... perhaps as a simplified way to preview
 * a Product.
 *
 * A basic Image Message can be created with:
 *
 * ```
 * ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel')
 * model = new ImageModel({
 *    sourceUrl: "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg",
 *    title: "My new jacket",
 *    subtitle: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
 *    artist: "Anonymous"
 * });
 * model.send({ conversation });
 * ```
 *
 *
 * An Image Message can have a separate preview and source image; preview is rendered
 * within the Message List, and source is opened when the user clicks for more detail:
 *
 * ```
 * ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel')
 * model = new ImageModel({
 *    sourceUrl: "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg",
 *    previewUrl: "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg",
 * });
 * model.send({ conversation });
 * ```
 *
 * The ImageModel may also use the `source` and `preview` properties instead of `sourceUrl` and `previewUrl`.
 * This occurs when the Image is stored as part of a MessagePart's data, in which case, `source`
 * and `preview` refer to the MessagePart with the data:
 *
 * ```
 * ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel')
 * model = new ImageModel({
 *    source: blob1,
 *    preview: blob2,
 * });
 * model.send({ conversation });
 * ```
 *
 * ### Importing
 *
 * Included with the standard build. For custom build, import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/image/layer-image-message-view';
 * import '@layerhq/web-xdk/ui/messages/image/layer-image-message-model';
 * ```
 *
 * @class Layer.UI.messages.ImageMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import ImageManager from 'blueimp-load-image/js/load-image';
import 'blueimp-load-image/js/load-image-orientation';
import 'blueimp-load-image/js/load-image-meta';
import 'blueimp-load-image/js/load-image-exif';
import { normalizeSize } from '../../ui-utils';

import Core, { Root, MessagePart, MessageTypeModel } from '../../../core/namespace';
import { xhr } from '../../../utils';
import { getNativeSupport } from '../../../utils/native-support';

const Blob = getNativeSupport('Blob');

class ImageModel extends MessageTypeModel {
  constructor(options = {}) {
    if (options.source && !(options.source instanceof MessagePart)) {
      options.source = new MessagePart(options.source);
    }
    if (options.preview && !(options.preview instanceof MessagePart)) {
      options.preview = new MessagePart(options.preview);
    }
    super(options);
  }

  /**
   * Does the work of generateParts but allows us to asynchronously call it if needed.
   *
   * @method _generateParts2
   * @private
   */
  _generateParts2() {
    // Generate the MessagePart body
    const props = ['sourceUrl', 'previewUrl', 'artist', 'fileName', 'orientation',
      'title', 'subtitle'];

    // Use of getters for these means that these may return values even when they were never provided with values
    ['width', 'height', 'aspectRatio', 'previewWidth', 'previewHeight'].forEach((propName) => {
      if (this['__' + propName]) props.push(propName);
    });
    const body = this.initBodyWithMetadata(props);

    // Generate the MessagePart with the body
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    const parts = [this.part];

    // If there is a source part, add it to the parts array and add it to the Message Part
    // Node Heirarchy
    if (this.source) {
      parts.push(this.source);
      this.addChildPart(this.source, 'source');
    }

    // If there is a preview part, add it to the parts array and add it to the Message Part
    // Node Heirarchy
    if (this.preview) {
      parts.push(this.preview);
      this.addChildPart(this.preview, 'preview');
    }

    return parts;
  }

  /**
   * Generate the Message Parts representing this model so that the Message can be sent.
   *
   * If a `source` MessagePart is provided, but not a `preview` MessagePart, then we
   * need to generate the `preview` which is an async task.  Much of the work to generate the
   * Message Parts is therefore async called after the preview is generated.
   *
   * @method generateParts
   * @protected
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  generateParts(callback) {
    if (this.source && !this.mimeType) this.mimeType = this.source.type;

    if (this.source && !this.fileName) this.fileName = this.source.name;

    if (this.source && !this.preview && !this.previewUrl) {
      // We need to generate the preview; first gather orientation and sizing data
      this._gatherMetadataFromEXIF(this.source.body, () => {
        // Generate a smaller version of the image
        this._generatePreview(this.source.body, () => {
          // Finish the standard generateParts task
          const parts = this._generateParts2();
          callback(parts);
        });
      });
    } else {
      // Finish the standard generateParts task
      const parts = this._generateParts2();
      callback(parts);
    }
  }

  /**
   * Given a Layer.Core.Message, initialize this Image Model.
   *
   * `parseModelChildParts` is called for intialization, and is also recalled
   * whenever the Message itself is modified.
   *
   * @method parseModelChildParts
   * @protected
   * @param {Object} payload    Metadata describing the Image Message
   */
  parseModelChildParts({ changes = [], isEdit = false }) {
    super.parseModelChildParts({ changes, isEdit });

    // Iterate over each part, copying suitable parts into the associated property.
    // Change events occur when fetching external content for these MessageParts and
    // triggers change events so that UIs can rerender with all image data.
    this.childParts.forEach((part) => {
      switch (part.mimeAttributes.role) {
        case 'source': {
          this.source = part;
          const oldUrl = part.url;
          part.on('url-loaded', () => {
            this._triggerAsync('message-type-model:change', {
              property: 'source',
              oldValue: oldUrl,
              newValue: part.url,
            });
          }, this);
          break;
        }
        case 'preview':
          this.preview = part;
          if (!part.body) {
            part.on('content-loaded', () => {
              this._triggerAsync('message-type-model:change', {
                property: 'preview',
                oldValue: null,
                newValue: part.body,
              });
            }, this);
          }
          break;
      }
    });
  }

  /**
   * Get a Blob that can be used to render an Image preview.
   *
   * @method getPreviewBlob
   * @param {Function} callback
   * @param {Blob} callback.data
   */
  getPreviewBlob(callback) {
    if (this.preview) {
      if (this.preview.body) return callback(this.preview.body);
      this.preview.fetchContent(data => callback(data));
    } else if (this.source) {
      if (this.source.body) return callback(this.source.body);
      this.source.fetchContent(data => callback(data));
    } else if (this.previewUrl || this.sourceUrl) {
      xhr({
        url: this.previewUrl || this.sourceUrl,
        responseType: 'blob',
      }, (result) => {
        if (result.success) {
          callback(result.data);
        }
      });
    }
  }

  /**
   * Parse the Image Blob/File for EXIF metadata and copy them into the model's properties.
   *
   * @method _gatherMetadataFromEXIF
   * @private
   * @param {Blob} file
   * @param {Function} callback
   */
  _gatherMetadataFromEXIF(file, callback) {
    ImageManager.parseMetaData(file, onParseMetadata.bind(this));

    function onParseMetadata(data) {

      if (data.imageHead && data.exif) {
        this.orientation = data.exif.get('Orientation');
        if (this.orientation >= 5) {
          this.width = data.exif.get('ImageHeight');
          this.height = data.exif.get('ImageWidth');
        } else {
          this.width = data.exif.get('ImageWidth');
          this.height = data.exif.get('ImageHeight');
        }
        this.artist = data.exif.get('Artist');
        this.description = data.exif.get('ImageDescription') || data.exif.get('UserComment');
      }
      callback();
    }
  }

  /**
   * Given an input Image Blob, create an output MessagePart with an ImageBlob `body` property.
   *
   * > *Note*
   * >
   * > Will not generate a preview if the source image is small enough; will simply call the callback
   * > without any parameters.
   *
   * @method _generatePreview
   * @private
   * @param {Blob} file
   * @param {Function} callback
   * @param {Layer.Core.MessagePart} [callback.previewPart]
   */
  _generatePreview(file, callback) {
    const options = {
      canvas: true,
    };

    ImageManager(file, (srcCanvas) => {
      // Note that the EXIF parser already set these... but these values are more reliable,
      // and there isn't always EXIF data.
      this.width = srcCanvas.width;
      this.height = srcCanvas.height;

      // If the source image is small, don't waste time generating a preview
      if (srcCanvas.width > ImageModel.MaxPreviewDimension || srcCanvas.height > ImageModel.MaxPreviewDimension) {
        const blob = this._postGeneratePreview(srcCanvas);
        this.preview = new MessagePart(blob);
        callback(this.preview);
      } else {
        callback();
      }
    }, options);
  }

  /**
   * Does the actual processing to create the Preview Image from a Canvas rendering the Source Image.
   *
   * @method _postGeneratePreview
   * @private
   * @param {Canvas} srcCanvas
   * @returns {Blob} previewBlob
   */
  _postGeneratePreview(srcCanvas) {

    const size = normalizeSize(
      { width: this.width, height: this.height },
      { width: ImageModel.MaxPreviewDimension, height: ImageModel.MaxPreviewDimension },
    );
    const canvas = document.createElement('canvas');
    this.previewWidth = canvas.width = size.width;
    this.previewHeight = canvas.height = size.height;
    const context = canvas.getContext('2d');

    context.fillStyle = context.strokeStyle = 'white';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(srcCanvas, 0, 0, size.width, size.height);

    // Turn the canvas into a jpeg image for our Preview Image
    const binStr = atob(canvas.toDataURL('image/jpeg', ImageModel.PreviewQuality).split(',')[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: 'image/jpeg' });
  }


  // Used by Layer.UI.messages.StandardMessageViewContainer
  getDescription() { return this.subtitle; }
  getFooter() { return this.artist; }

  fetchUrl(callback) {
    if (this.source && this.source.url) callback(this.source.url);
    else if (this.source) this.source.fetchStream(callback);
    else if (this.preview && this.preview.url) callback(this.preview.url);
    else if (this.preview) this.preview.fetchStream(callback);
  }

  // See the url property definition below
  __getUrl() {
    if (this.source) {
      return this.source.url; // doesn't handle expiring content yet
    } else if (this.sourceUrl) {
      return this.sourceUrl;
    } else if (this.preview) {
      return this.preview.url; // doesn't handle expiring content yet
    } else if (this.previewUrl) {
      return this.previewUrl;
    }
  }

  __getAspectRatio() {
    if (this.__aspectRatio) return this.__aspectRatio;
    if (this.height && this.width) return this.width / this.height;
    return 0;
  }

  __getPreviewWidth() {
    if (this.__previewWidth) return this.__previewWidth;
    if (this.__previewHeight && this.__aspectRatio) return this.__previewHeight * this.__aspectRatio;
    return this.width;
  }

  __getPreviewHeight() {
    if (this.__previewHeight) return this.__previewHeight;
    if (this.__previewWidth && this.__aspectRatio) return this.__previewWidth / this.__aspectRatio;
    return this.height;
  }

  __getWidth() {
    if (this.__width) return this.__width;
    if (this.__height && this.__aspectRatio) return this.__height * this.__aspectRatio;
    return null;
  }

  __getHeight() {
    if (this.__height) return this.__height;
    if (this.__width && this.__aspectRatio) return this.__width / this.__aspectRatio;
    return null;
  }
}

/**
 * The title of the Image Message
 *
 * @property {String} title
 */
ImageModel.prototype.title = '';

/**
 * File Name of the image in this Message.
 *
 * > *Note*
 * >
 * > Adding this to the model is not according to spec, but allows us to
 * > preserve this info when a user uploads a file without it forcing it to
 * > render metadata that isn't important.
 *
 * @property {String} fileName
 */
ImageModel.prototype.fileName = '';

/**
 * Subtitle for the Image Message
 *
 * @property {String} subtitle
 */
ImageModel.prototype.subtitle = '';

/**
 * URL to the image.
 *
 * Not needed if providing a Layer.UI.messages.ImageMessageModel.source property.
 *
 * @property {String} sourceUrl
 */
ImageModel.prototype.sourceUrl = '';

/**
 * URL to the preview image.
 *
 * Not needed if providing a Layer.UI.messages.ImageMessageModel.preview property.
 *
 * @property {String} previewUrl
 */
ImageModel.prototype.previewUrl = '';

/**
 * Orientation number to use for orienting the Image.
 *
 * Orientation number is defined according to how the EXIF orientation number is defined.
 *
 * @property {Number} orientation
 */
ImageModel.prototype.orientation = null;

/**
 * Artist who created the Image
 *
 * @property {String} artist
 */
ImageModel.prototype.artist = '';

/**
 * Preview Image Message Part
 *
 * Image data in an Image Message Part is typcially accessed with:
 *
 * ```
 * if (!model.preview.body) {
 *    model.preview.fetchContent(function(blob) {
 *        // process blob here
 *    });
 * } else {
 *    // process model.preview.body blob here
 * }
 * ```
 *
 * See Layer.Core.MessagePart.fetchContent and Layer.Core.MessagePart.fetchStream
 * for more details.
 *
 * @property {Layer.Core.MessagePart} preview
 */
ImageModel.prototype.preview = null;

/**
 * Image Message Part
 *
 * Image data in an Image Message Part is typcially accessed with:
 *
 * ```
 * if (!model.preview.body) {
 *    model.preview.fetchContent(function(blob) {
 *        // process blob here
 *    });
 * } else {
 *    // process model.preview.body blob here
 * }
 * ```
 *
 * See Layer.Core.MessagePart.fetchContent and Layer.Core.MessagePart.fetchStream
 * for more details.
 *
 * @property {Layer.Core.MessagePart} source
 */
ImageModel.prototype.source = null;

/**
 * Width of the Image in the Message; applies to the source/sourceUrl image.
 *
 * @property {Number} width
 */
ImageModel.prototype.width = null;

/**
 * Height of the Image in the Message; applies to the source/sourceUrl image.
 *
 * @property {Number} height
 */
ImageModel.prototype.height = null;

/**
 * Width of the Preview Image in the Message; applies to the preview/previewUrl image.
 *
 * @property {Number} previewWidth
 */
ImageModel.prototype.previewWidth = null;

/**
 * Height of the Preview Image in the Message; applies to the preview/previewUrl image.
 *
 * @property {Number} previewHeight
 */
ImageModel.prototype.previewHeight = null;

/**
 * Aspect ratio is width / height
 *
 * @property {Number} aspectRatio
 */
ImageModel.prototype.aspectRatio = null;

/**
 * The `open-url` action needs a url property in order to determine what to open.
 *
 * Provide a property getter for `url` that finds a suitable url and returns it.
 *
 * @property {String} url
 */
ImageModel.prototype.url = '';

/**
 * Maximum width/height for a Preview Image.
 *
 * If width/height of an image we are sending is greater than this, we create a preview at this size.
 *
 * @static
 * @property {Number} {MaxPreviewDimesion=768}
 */
ImageModel.MaxPreviewDimension = 768;

/**
 * Preview Image JPEG Quality
 *
 * When generating preview images, what quality of jpeg compression to use?
 *
 * * 100%: Full quality
 * * 50%: Much compression
 * * 0%: I have not dared to try this
 *
 * @static
 * @property {Number} {PreviewQuality=0.5}
 */
ImageModel.PreviewQuality = 0.5;

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Image]
 */
ImageModel.LabelSingular = 'Image';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Images]
 */
ImageModel.LabelPlural = 'Images';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
ImageModel.SummaryTemplate = '';

/**
 * The default action when selecting this Message is to trigger an `open-url` and view the Image.
 *
 * @static
 * @property {String} [defaultAction=open-url]
 */
ImageModel.defaultAction = 'open-url';

/**
 * The MIME Type recognized by and used by the Image Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.image+json]
 */
ImageModel.MIMEType = 'application/vnd.layer.image+json';

/**
 * The UI Component to render the Image Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-image-message-view]
 */
ImageModel.messageRenderer = 'layer-image-message-view';

// Init the class
Root.initClass.apply(ImageModel, [ImageModel, 'ImageModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(ImageModel, 'ImageModel');

module.exports = ImageModel;
