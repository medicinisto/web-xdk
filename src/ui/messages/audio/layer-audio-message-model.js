/**
 * The File Message is used to share files such as PDF or other documents.
 *
 * A basic File Message can be created with:
 *
 * ```
 * AudioModel = Layer.Core.Client.getMessageTypeModelClass('AudioModel')
 * model = new AudioModel({
 *    sourceUrl: "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg",
 *    title: "My new jacket",
 *    author: "Anonymous"
 * });
 * model.send({ conversation });
 * ```
 *
 *
 * A File Model can also be created with a message from your local file system using the
 * Layer.UI.messages.FileMessageModel.source property:
 *
 * ```
 * AudioModel = Layer.Core.Client.getMessageTypeModelClass('AudioModel')
 * model = new AudioModel({
 *    source: FileBlob
 * });
 * model.send({ conversation });
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import using either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-view';
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-model';
 * ```
 *
 * @class Layer.UI.messages.AudioMessageModel
 * @extends Layer.Core.MessageTypeModel
 */


import Core, { MessagePart, MessageTypeModel, Root } from '../../../core/namespace';
import { xhr, logger } from '../../../utils';

class AudioModel extends MessageTypeModel {

  /**
   * Generate the Message Parts representing this model so that the File Message can be sent.
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

    // Intialize metadata from the Blob
    if (source) {
      if (!this.title && source.name) this.title = source.name;
      if (!this.mimeType) this.mimeType = source.type;
      sourcePart = new MessagePart(source);
      this.size = source.size;
      const tmpAudio = new Audio(sourcePart.url);
      tmpAudio.addEventListener('durationchange', () => {
        this.duration = tmpAudio.duration;
        continueFn1.bind(this)();
      });
      tmpAudio.addEventListener('error', (err) => {
        logger.error('Failed to read audio file: ', err);
        continueFn1.bind(this)();
      });
    } else {
      continueFn1.bind(this)();
    }

    function continueFn1() {
      if (preview) {
        const img = new Image();
        img.addEventListener('load', () => {
          this.previewWidth = img.width;
          this.previewHeight = img.height;
          continueFn2.bind(this)();
        });
        img.addEventListener('error', (err) => {
          logger.error('Failed to read audio file: ', err);
          continueFn2.bind(this)();
        });
        img.src = URL.createObjectURL(preview);
      } else {
        continueFn2.bind(this)();
      }
    }

    function continueFn2() {
      if (this.isDestroyed) return;

      // Setup the MessagePart
      const body = this.initBodyWithMetadata([
        'sourceUrl', 'previewUrl', 'album', 'artist', 'duration',
        'genre', 'title', 'mimeType', 'previewWidth', 'previewHeight',
        'duration', 'size',
      ]);
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

      callback(parts);
    }
  }

  // See parent class
  parseModelPart({ payload, isEdit }) {
    super.parseModelPart({ payload, isEdit });

    // Initialize the mimeType property if available
    if (!this.mimeType && this.source) this.mimeType = this.source.mimeType;
  }

  parseModelChildParts({ changes = [], isEdit = false }) {
    super.parseModelChildParts({ changes, isEdit });
    this.source = this.childParts.filter(part => part.role === 'source')[0] || null;
    this.preview = this.childParts.filter(part => part.role === 'preview')[0] || null;
    this.transcript = this.childParts.filter(part => part.role === 'transcript')[0] || null;
  }

  /**
   * Get the sourceUrl to use for fetching the File.
   *
   * ```
   * AudioModel.getSourceUrl(url => window.open(url));
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
   * Get the raw file data in a non-expiring form; this does involve download costs not paid using {@link #getSourceUrl}
   *
   * ```
   * AudioModel.getSourceBody(body => (this.innerHTML = body));
   * ```
   *
   * @method getSourceBody
   * @param {Function} callback
   * @param {String} callback.body
   */
  getSourceBody(callback) {
    if (this.source) {
      this.source.fetchContent(body => callback(body));
    } else if (this.sourceUrl) {
      xhr({
        method: 'GET',
        url: this.sourceUrl,
      }, body => callback(body));
    } else {
      callback('');
    }
  }

  /**
   * Get the sourceUrl to use for fetching the File.
   *
   * ```
   * AudioModel.getPreviewUrl(url => window.open(url));
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

  /**
   * Get the raw file data in a non-expiring form; this does involve download costs not paid using {@link #getSourceUrl}
   *
   * ```
   * AudioModel.getPreviewBody(body => (this.innerHTML = body));
   * ```
   *
   * @method getPreviewBody
   * @param {Function} callback
   * @param {String} callback.body
   */
  getPreviewBody(callback) {
    if (this.source) {
      this.source.fetchContent(body => callback(body));
    } else if (this.sourceUrl) {
      xhr({
        method: 'GET',
        url: this.sourceUrl,
      }, body => callback(body));
    } else {
      callback('');
    }
  }

  // Used by Layer.UI.messages.StandardMessageViewContainer
  getTitle() {
    if (this.title) {
      return this.title;
    } else if (this.sourceUrl) {
      return this.sourceUrl.replace(/.*\/(.*?)(\..*)?$/, '$1');
    } else {
      return this.getOneLineSummary(true);
    }
  }
  getDescription() {
    return this.artist || this.album || this.genre;
  }
  getFooter() {
    if (this.duration) return this.getDuration();
    if (!this.size) return '';
    return this.getSize();
  }

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

  getSize() {
    return (Math.floor(this.size / 1000)).toLocaleString() + 'K';
  }

  __updateCurrentTime(newValue, oldValue) {
    this._triggerAsync('message-type-model:change', {
      property: 'currentTime',
      oldValue,
      newValue,
    });
  }
}

/**
 * MessagePart with the file to be shared.
 *
 * The File Model may instead use `sourceUrl`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {Layer.Core.MessagePart} source
 */
AudioModel.prototype.source = null;

/**
 * URL to the file to be shared
 *
 * The File Model may instead use `source`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {String} sourceUrl
 */
AudioModel.prototype.sourceUrl = '';

/**
 * MessagePart with the file to be shared.
 *
 * The File Model may instead use `sourceUrl`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {Layer.Core.MessagePart} source
 */
AudioModel.prototype.preview = null;

/**
 * URL to the file to be shared
 *
 * The File Model may instead use `preview`; use the `getPreviewUrl()` method
 * to abstract these concepts.
 *
 * @property {String} previewUrl
 */
AudioModel.prototype.previewUrl = '';

/**
 * Album this sound file comes from
 *
 * @property {String} album
 */
AudioModel.prototype.album = '';

/**
 * Artist of the sound file; typically shown as the Message description.
 *
 * @property {String} artist
 */
AudioModel.prototype.artist = '';

/**
 * Genre of the sound file; typically shown as the Message description.
 *
 * @property {String} genre
 */
AudioModel.prototype.genre = '';

/**
 * Title/file-name of the file; typically shown as the Message Title.
 *
 * @property {String} title
 */
AudioModel.prototype.title = '';

/**
 * MIME Type of the file.
 *
 * @property {String} mimeType
 */
AudioModel.prototype.mimeType = '';

/**
 * If a preview image is provided, provide a width and height property
 * to get the best results (least jitter) when rendering
 *
 * @property {Number} previewWidth
 */
AudioModel.prototype.previewWidth = 0;

/**
 * If a preview image is provided, provide a width and height property
 * to get the best results (least jitter) when rendering
 *
 * @property {Number} previewHeight
 */
AudioModel.prototype.previewHeight = 0;

/**
 * Duration of the audio in the duration format as specified in ISO 8601
 *
 * @property {String} duration
 */
AudioModel.prototype.duration = '';

/**
 * Size of the file in bytes
 *
 * @property {Number} size
 */
AudioModel.prototype.size = null;

/**
 * This property is used by different Views to share the time they have played up to.
 *
 * @property {Number} currentTime
 */
AudioModel.prototype.currentTime = null;

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Audio Message]
 */
AudioModel.LabelSingular = 'Audio Message';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Audio Messages]
 */
AudioModel.LabelPlural = 'Audio Messages';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
AudioModel.SummaryTemplate = '';

/**
 * The default action when selecting this Message is to trigger an `layer-show-large-message` and view the File.
 *
 * @static
 * @property {String} [defaultAction=layer-show-large-message]
 */
AudioModel.defaultAction = 'layer-show-large-message';

/**
 * The MIME Type recognized by and used by the Audio Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.audio+json]
 */
AudioModel.MIMEType = 'application/vnd.layer.audio+json';

/**
 * The UI Component to render the Audio Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-audio-message-view]
 */
AudioModel.messageRenderer = 'layer-audio-message-view';

/**
 * The UI Component to render the Large Message Audio Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-audio-message-large-view]
 */
AudioModel.largeMessageRenderer = 'layer-audio-message-large-view';

// Init the class
Root.initClass.apply(AudioModel, [AudioModel, 'AudioModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(AudioModel, 'AudioModel');

module.exports = AudioModel;
