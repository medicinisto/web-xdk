/**
 * The Status Message is used to send a Message that renders as a centered, anonymous message.
 *
 * That means it comes without a "From" or Avatar, and does not render a date.  Regardless of
 * Who sent it, it will show as though it were a status message reporting on an update to
 * someone's or something's state.
 *
 * ```
 * StatusModel = Layer.Core.Client.getMessageTypeModelClass('StatusModel')
 * model = new StatusModel({text: "Your brains have been eaten."})
 * model.send({ conversation });
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import with either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/status/layer-status-message-view';
 * import '@layerhq/web-xdk/ui/messages/status/layer-status-message-model';
 * ```
 *
 * @class Layer.UI.messages.StatusMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Core, { MessagePart, Root, MessageTypeModel } from '../../../core/namespace';
import { registerStatusModel } from '../../ui-utils';

class StatusModel extends MessageTypeModel {

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Status Message.
   *
   * @method generateParts
   * @private
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  generateParts(callback) {
    const body = this.initBodyWithMetadata(['text']);

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    callback([this.part]);
  }
}

/**
 * The text of the Status Message.
 *
 * @property {String}
 */
StatusModel.prototype.text = '';


/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Status]
 */
StatusModel.LabelSingular = 'Status';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Status]
 */
StatusModel.LabelPlural = 'Status';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=${itemCount} ${label}]
 */
StatusModel.SummaryTemplate = '${text}'; // eslint-disable-line no-template-curly-in-string


/**
 * The MIME Type recognized by and used by the Status Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.status+json]
 */
StatusModel.MIMEType = 'application/vnd.layer.status+json';

/**
 * The UI Component to render the Status Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-status-message-view]
 */
StatusModel.messageRenderer = 'layer-status-message-view';

// Finish setting up the Class
Root.initClass.apply(StatusModel, [StatusModel, 'StatusModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(StatusModel, 'StatusModel');

// Register this MIME Type to be handled as a Status Message
registerStatusModel(StatusModel);

module.exports = StatusModel;
