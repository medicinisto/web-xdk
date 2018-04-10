/**
 * @class Layer.UI.UIUtils
 */

/**
 * Array of mime types that are used in Status messages (not rendered as sent nor received)
 *
 * @property {String[]} statusMimeTypes
 * @protected
 */
module.exports.statusMimeTypes = [];

/**
 * Register a Message Type Model to be treated as a Status Message instead of a Message Sent/Received.
 *
 * A Status Message is rendered without Avatar, sender, timestamp, etc...
 *
 * ```
 * Layer.UI.register(MyModelClass);
 * ```
 *
 * @method registerStatusModel
 * @param {Function} StatusModel    Pass in the Class Definition for a Layer.Core.MessageTypeModel subclass
 */
module.exports.registerStatusModel = (StatusModel) => {
  module.exports.statusMimeTypes.push(StatusModel.MIMEType);
  (StatusModel.AltMIMETypes || []).forEach(mimeType => module.exports.statusMimeTypes.push(mimeType));
};


/**
 * Returns whether the specified MIME Type is setup to be rendered as a Status Message.
 *
 * @method isStatusMessage
 * @param {String} mimeType
 * @returns {Boolean}
 */
module.exports.isStatusMessage = mimeType => module.exports.statusMimeTypes.indexOf(mimeType);
