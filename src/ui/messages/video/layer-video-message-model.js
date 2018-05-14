/**
 * The Video Message is used to share Video Files.
 *
 * A basic Video Message can be created with:
 *
 * ```
 * VideoModel = Layer.Core.Client.getMessageTypeModelClass('VideoModel')
 * model = new VideoModel({
 *    sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
 *    title: "Out of Tunes",
 *    artist: "Bad Intonation",
 *    duration: 500,
 * });
 * model.send({ conversation });
 * ```
 *
 *
 * A File Model can also be created with a message from your local file system using the
 * {@link #source} property:
 *
 * ```
 * VideoModel = Layer.Core.Client.getMessageTypeModelClass('VideoModel')
 * model = new VideoModel({
 *    source: FileBlob,
 * });
 * model.send({ conversation });
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/video/layer-video-message-view';
 * ```
 *
 * @class Layer.UI.messages.VideoMessageModel
 * @extends Layer.Core.MessageTypeModel
 */


import Core, { MessagePart, MessageTypeModel, Root } from '../../../core/namespace';
import { logger } from '../../../utils';

class VideoModel extends MessageTypeModel {


  /**
   * Generate the Message Parts representing this model so that the Video Message can be sent.
   *
   * @method generateParts
   * @protected
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  generateParts(callback) {
    const source = this.source;
    const preview = this.preview;
    let sourcePart;

    // Intialize metadata and source MesssgePart from the Blob
    if (source) {
      if (!this.title && source.name) this.title = source.name.replace(/(.*\/)?(.*?)(\..*)?$/, '$2');

      if (!this.mimeType) this.mimeType = source.type;
      sourcePart = new MessagePart(source);
      this.size = source.size;

      // Instantiate an video player so we can examine the video file; call continueFn1 when done
      const tmpVideo = document.createElement('video');
      tmpVideo.addEventListener('durationchange', () => {
        this.duration = tmpVideo.duration;
        this.width = tmpVideo.videoWidth;
        this.height = tmpVideo.videoHeight;
        continueFn1.bind(this)();
      });
      tmpVideo.addEventListener('error', (err) => {
        logger.error('Failed to read video file: ', err);
        continueFn1.bind(this)();
      });
      tmpVideo.src = sourcePart.url;
    } else {
      continueFn1.bind(this)();
    }

    // TODO: Promisify this stuff
    // If a Preview blob is provided, examine it to get our previewWidth and height, and call continueFn2 when done
    function continueFn1() {
      if (preview) {
        const img = new Image();
        img.addEventListener('load', () => {
          this.previewWidth = img.width;
          this.previewHeight = img.height;
          continueFn2.bind(this)();
        });
        img.addEventListener('error', (err) => {
          logger.error('Failed to read video file: ', err);
          continueFn2.bind(this)();
        });
        img.src = URL.createObjectURL(preview);
      } else {
        continueFn2.bind(this)();
      }
    }

    // Create the root message part for this model and connect the sourcePart and previewPart to it
    function continueFn2() {
      if (this.isDestroyed) return;

      // Setup the MessagePart
      const props = [
        'sourceUrl', 'previewUrl', 'title', 'subtitle', 'artist', 'mimeType', 'createdAt',
        'duration', 'size',
      ];

      // Use of getters for these means that these may return values even when they were never provided with values
      ['width', 'height', 'aspectRatio', 'previewWidth', 'previewHeight'].forEach((propName) => {
        if (this['__' + propName]) props.push(propName);
      });
      const body = this.initBodyWithMetadata(props);
      this.part = new MessagePart({
        mimeType: this.constructor.MIMEType,
        body: JSON.stringify(body),
      });

      const parts = [this.part];

      // Create the source Message Part
      if (source) {
        this.source = new MessagePart(source);
        this.addChildPart(this.source, 'source');
        this.childParts.push(this.source);
        parts.push(this.source);
      }

      if (preview) {
        this.preview = new MessagePart(preview);
        this.addChildPart(this.preview, 'preview');
        this.childParts.push(this.preview);
        parts.push(this.preview);
      }

      this._setupSlots();
      callback(parts);
    }
  }

  // See parent class
  parseModelPart({ payload, isEdit }) {
    super.parseModelPart({ payload, isEdit });

    // Initialize the mimeType property if available
    if (!this.mimeType && this.source) this.mimeType = this.source.mimeType;
    if (this.createdAt) this.createdAt = new Date(this.createdAt);
    this._setupSlots();
  }

  // See parent class
  parseModelChildParts({ changes = [], isEdit = false }) {
    super.parseModelChildParts({ changes, isEdit });
    this.source = this.childParts.filter(part => part.role === 'source')[0] || null;
    this.preview = this.childParts.filter(part => part.role === 'preview')[0] || null;
    this.transcript = this.childParts.filter(part => part.role === 'transcript')[0] || null;
  }

  /**
   * Get the sourceUrl to use for fetching the Audio File.
   *
   * ```
   * var player = new Audio();
   * VideoModel.getSourceUrl(url => player.src = url);
   * ```
   *
   * @method getSourceUrl
   * @param {Function} callback
   * @param {String} callback.url
   */
  getSourceUrl(callback) {
    if (this.sourceUrl) {
      callback(this.sourceUrl);
    } else if (this.source) {
      if (this.source.url) {
        callback(this.source.url);
      } else {
        this.source.fetchStream(url => callback(url));
      }
    } else {
      callback('');
    }
  }

  /**
   * Get the preview url to use for fetching the preview image... returns '' if there is no preview image.
   *
   * ```
   * var img = document.createElement('img');
   * VideoModel.getPreviewUrl(url => img.src = url);
   * ```
   *
   * @method getPreviewUrl
   * @param {Function} callback
   * @param {String} callback.url
   */
  getPreviewUrl(callback) {
    if (this.previewUrl) {
      callback(this.previewUrl);
    } else if (this.preview) {
      if (this.preview.url) {
        callback(this.preview.url);
      } else {
        this.preview.fetchStream(url => callback(url));
      }
    } else {
      callback('');
    }
  }

  _setupSlots() {
    this._simpleMetadataSlots = [];
    this._allMetadataSlots = [];

    if (this.subtitle) {
      this._simpleMetadataSlots.push(this.subtitle);
      this._allMetadataSlots.push(this.subtitle);
    }

    if (this.artist) {
      if (!this.subtitle) this._simpleMetadataSlots.push(this.artist);
      this._allMetadataSlots.push(this.artist);
    }

    if (this.duration) {
      const duration = this.getDuration();
      this._simpleMetadataSlots.push(duration);
      this._allMetadataSlots.push(duration);
    }

    if (this.size) {
      const size = this.getSize();
      if (!this.duration) this._simpleMetadataSlots.push(size);
      this._allMetadataSlots.push(size);
    }

    if (this.createdAt) {
      const createdAt = this.createdAt.toLocaleString();
      if (!this.duration && !this.size) this._simpleMetadataSlots.push(createdAt);
      this._allMetadataSlots.push(createdAt);
    }
  }

  /**
   * Get the title for the Standard Message Container.
   *
   * Title is either the title property, a file name within the sourceUrl or whatever is returned by the getOneLineSummary method.
   *
   * @method getTitle
   * @returns {String}
   */
  getTitle() {
    if (this.title) {
      return this.title;
    } else if (this.sourceUrl) {
      return this.sourceUrl.replace(/(.*\/)?(.*?)(\..*)?$/, '$2');
    } else {
      return this.getOneLineSummary(true);
    }
  }

  getDescription() {
    return this._simpleMetadataSlots[0] || '';
  }

  getFooter() {
    return this._simpleMetadataSlots[1] || '';
  }

  getMetadataAtIndex(index) {
    return this._allMetadataSlots[index] || '';
  }

  /**
   * Gets the duration as a formatted string; to get just the raw number use the {@link #duration} property
   *
   * @method getDuration
   * @returns {String}
   */
  getDuration() {
    let str = '';

    let hrs = Math.floor(this.duration / 3600);
    if (!hrs) hrs = '00';
    else if (hrs < 10) hrs = '0' + hrs;
    str += hrs + ':';

    const afterHours = this.duration % 3600;
    let mins = Math.floor(afterHours / 60);
    if (!mins) mins = '00';
    else if (mins < 10) mins = '0' + mins;
    str += mins + ':';

    let secs = Math.round(afterHours % 60);
    if (!secs) secs = '00';
    else if (secs < 10) secs = '0' + secs;
    str += secs;
    return str;
  }

  /**
   * Gets the size as a formatted string; to get just the raw number use the {@link #size} property
   *
   * @method getSize
   * @returns {String}
   */
  getSize() {
    return (Math.floor(this.size / 1000)).toLocaleString() + 'K';
  }

  /**
   * Whenever any view sets the model's currentTime property, notify all other views of this change.
   *
   * currentTime is number of seconds into the playback as reported by `audioPlayer.currentTime`
   *
   * @param {Number} newValue
   * @param {Number} oldValue
   */
  __updateCurrentTime(newValue, oldValue) {
    this._triggerAsync('message-type-model:change', {
      property: 'currentTime',
      oldValue,
      newValue,
    });
  }

  __updateHeight(newValue) {
    if (this.width) this.aspectRatio = this.width / newValue;
  }

  __updateWidth(newValue) {
    if (this.height) this.aspectRatio = newValue / this.height;
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
    return 0;
  }

  __getHeight() {
    if (this.__height) return this.__height;
    if (this.__width && this.__aspectRatio) return this.__width / this.__aspectRatio;
    return 0;
  }
}

/**
 * MessagePart with the Video File to be shared.
 *
 * Use {@link #getSourceUrl} method rather than the `source` property to access this content.
 *
 * @property {Layer.Core.MessagePart} source
 */
VideoModel.prototype.source = null;

/**
 * URL to the Video File to be shared
 *
 * Use {@link #getSourceUrl} method rather than the `sourceUrl` property to access this content.
 *
 * @property {String} sourceUrl
 */
VideoModel.prototype.sourceUrl = '';

/**
 * MessagePart with the Preview Image to be shared.
 *
 * Use {@link #getPreviewUrl} method rather than the `preview` property to access this content.
 *
 * @property {Layer.Core.MessagePart} source
 */
VideoModel.prototype.preview = null;

/**
 * URL to the Preview Image to be shared
 *
 * Use {@link #getPreviewUrl} method rather than the `previewUrl` property to access this content.
 *
 * @property {String} previewUrl
 */
VideoModel.prototype.previewUrl = '';

/**
 * If a Message Part with role of `transcript` is part of the Message, this will point to that Message Part.
 *
 * This is not currently supported.
 *
 * @property {Layer.Core.MessagePart} transcript
 * @protected
 */
VideoModel.prototype.transcript = null;


/**
 * Title/file-name of the file; typically shown as the Message Title.
 *
 * @property {String} [title]
 */
VideoModel.prototype.title = '';

/**
 * Subtitle to show with this message
 *
 * @property {String} [subtitle]
 */
VideoModel.prototype.subtitle = '';

/**
 * Artist who created the video
 *
 * @property {String} [artist]
 */
VideoModel.prototype.artist = '';

/**
 * MIME Type of the file.
 *
 * @property {String} [mimeType]
 */
VideoModel.prototype.mimeType = '';

/**
 * Video file creation time
 *
 * @property {String} [createdAt]
 */
VideoModel.prototype.createdAt = '';

/**
 * Video width
 *
 * @property {Number} [width]
 */
VideoModel.prototype.width = 0;

/**
 * Video height
 *
 * @property {Number} [height]
 */
VideoModel.prototype.height = 0;

/**
 * Video aspect ratio
 *
 * @property {Number} [aspectRatio]
 */
VideoModel.prototype.aspectRatio = 0;

/**
 * If a preview image is provided, provide a width and height property
 * to get the best results (least jitter) when rendering
 *
 * @property {Number} previewWidth
 */
VideoModel.prototype.previewWidth = 0;

/**
 * If a preview image is provided, provide a width and height property
 * to get the best results (least jitter) when rendering
 *
 * @property {Number} previewHeight
 */
VideoModel.prototype.previewHeight = 0;

/**
 * Duration of the vide in the duration format in seconds
 *
 * @property {String} duration
 */
VideoModel.prototype.duration = '';

/**
 * Size of the file in bytes
 *
 * @property {Number} size
 */
VideoModel.prototype.size = null;

/**
 * This property is used by different Views to share the time they have played up to.
 *
 * @property {Number} currentTime
 */
VideoModel.prototype.currentTime = null;

VideoModel.prototype._simpleMetadataSlots = null;
VideoModel.prototype._allMetadataSlots = null;

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Video]
 */
VideoModel.LabelSingular = 'Video';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Videos]
 */
VideoModel.LabelPlural = 'Videos';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
VideoModel.SummaryTemplate = '';

/**
 * The default action when selecting this Message is to trigger an `layer-show-large-message` and show Large Message for Video
 *
 * @static
 * @property {String} [defaultAction=layer-show-large-message]
 */
VideoModel.defaultAction = 'layer-show-large-message';

/**
 * The MIME Type recognized by and used by the Video Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.video+json]
 */
VideoModel.MIMEType = 'application/vnd.layer.video+json';

/**
 * The UI Component to render the Video Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-video-message-view]
 */
VideoModel.messageRenderer = 'layer-video-message-view';

/**
 * The UI Component to render the Large Message Video Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-video-message-large-view]
 */
VideoModel.largeMessageRenderer = 'layer-video-message-large-view';

// Init the class
Root.initClass.apply(VideoModel, [VideoModel, 'VideoModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(VideoModel, 'VideoModel');

module.exports = VideoModel;
