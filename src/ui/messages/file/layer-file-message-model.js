/**
 * The File Message is used to share files such as PDF or other documents.
 *
 * A basic File Message can be created with:
 *
 * ```
 * FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel')
 * model = new FileModel({
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
 * FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel')
 * model = new FileModel({
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
 * import '@layerhq/web-xdk/ui/messages/file/layer-file-message-view';
 * import '@layerhq/web-xdk/ui/messages/file/layer-file-message-model';
 * ```
 *
 * @class Layer.UI.messages.FileMessageModel
 * @extends Layer.Core.MessageTypeModel
 */


import Core, { MessagePart, MessageTypeModel, Root } from '../../../core';
import { xhr } from '../../../utils';

class FileModel extends MessageTypeModel {

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

    // Intialize metadata from the Blob
    if (source) {
      if (!this.title && source.name) this.title = source.name;
      if (!this.size) this.size = source.size;
      if (!this.mimeType) this.mimeType = source.type;
      this.size = source.size;
    }

    // Setup the MessagePart
    const body = this.initBodyWithMetadata(['sourceUrl', 'author', 'size', 'title', 'mimeType']);
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });

    // Create the source Message Part
    if (source) {
      this.source = new MessagePart(this.source);
      this.addChildPart(this.source, 'source');
      this.childParts.push(this.source);
    }

    callback(this.source ? [this.part, this.source] : [this.part]);
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
  }

  /**
   * Get the sourceUrl to use for fetching the File.
   *
   * ```
   * fileModel.getSourceUrl(url => window.open(url));
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
   * fileModel.getSourceBody(body => (this.innerHTML = body));
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

  // See title property below
  __getTitle() {
    if (this.__title) return this.__title;
    // if (this.source && this.source.mimeAttributes.name) return this.source.mimeAttributes.name;
    if (this.__sourceUrl) return this._sourceUrl.replace(/.*\/(.*)$/, '$1');
    return '';
  }

  // Used by Layer.UI.messages.StandardMessageViewContainer
  getTitle() { return this.title.replace(/\..{2,5}$/, ''); }
  getDescription() { return this.author; }
  getFooter() {
    if (!this.size) return '';
    return (Math.floor(this.size / 1000)).toLocaleString() + 'K';
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
FileModel.prototype.source = null;

/**
 * URL to the file to be shared
 *
 * The File Model may instead use `source`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {String} sourceUrl
 */
FileModel.prototype.sourceUrl = '';

/**
 * Author of the file; typically shown as the Message description.
 *
 * @property {String} author
 */
FileModel.prototype.author = '';

/**
 * Title/file-name of the file; typically shown as the Message Title.
 *
 * @property {String} title
 */
FileModel.prototype.title = '';

/**
 * Size of the file in bytes
 *
 * @property {Number} size
 */
FileModel.prototype.size = '';

/**
 * MIME Type of the file.
 *
 * @property {String} mimeType
 */
FileModel.prototype.mimeType = '';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=File]
 */
FileModel.LabelSingular = 'File';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Files]
 */
FileModel.LabelPlural = 'Files';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
FileModel.SummaryTemplate = '';

/**
 * The default action when selecting this Message is to trigger an `open-file` and view the File.
 *
 * @static
 * @property {String} [defaultAction=open-file]
 */
FileModel.defaultAction = 'open-file';

/**
 * The MIME Type recognized by and used by the File Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.file+json]
 */
FileModel.MIMEType = 'application/vnd.layer.file+json';

/**
 * The UI Component to render the File Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-file-message-view]
 */
FileModel.messageRenderer = 'layer-file-message-view';

// Init the class
Root.initClass.apply(FileModel, [FileModel, 'FileModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(FileModel, 'FileModel');

module.exports = FileModel;
