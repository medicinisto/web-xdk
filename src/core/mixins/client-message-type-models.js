/**
 * Adds MessageTypeModel handling to the Layer.Core.Client.
 *
 * TODO:
 * 1. If the Message is destroyed, find and destroy any linked Models
 * 2. If the Message is in use, insure that the Message isn't garbage collected.
 *    Potential definition of in-use: its in the DOM
 *
 * @class Layer.Core.Client
 */
import { ErrorDictionary } from '../layer-error';
import Core from '../namespace';

const MessageTypeModelClasses = [];
const MessageTypeModelHash = {};
const MessageTypeModelNameHash = {};

module.exports = {
  events: [
    /**
     * A property of this model has changed.
     *
     * ```
     * client.on('message-type-model:change', function(evt) {
     *    if (evt.target.getModelName() === 'ChoiceModel') {
     *      var responseChanges = evt.getChangesFor('responses');
     *      responseChanges.forEach(change => console.log(change.propertyName + " has changed from ', change.oldValue, ' to ', change.newValue);
     *    }
     * });
     * ```
     *
     * @event
     * @param {Layer.Core.LayerEvent} evt
     */
    'message-type-model:change',
    'message-type-model:customization',

    /**
     * A Message has been created for this model, but has not yet been sent.
     *
     * ```
     * client.on('message-type-model:has-new-message', function(evt) {
     *    var model = evt.target;
     *    var message = model.message;
     *    message.addPart(new Layer.Core.MessagePart({mimeType: "text/note", body: "This part has been added"}));
     * });
     * ```
     *
     * @event
     * @param {Layer.Core.LayerEvent} evt
     */
    'message-type-model:has-new-message',

    /**
     * Customize the Response Message before it is sent.
     *
     * ```
     * client.on('message-type-model:sending-response-message', function(evt) {
     *   const { respondingToModel, responseModel } = evt;
     *   if (respondingToModel.getModelName() === 'ChoiceModel') {
     *     responseModel.displayModel.text = "Something important just changed";
     *     responseModel.addOperations([new Layer.Core.CRDT.Changes({
     *       operation: "add",
     *       type: Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS,
     *       name: 'my-custom-state',
     *       value: 'frodo-the-dodo',
     *       id: Layer.Utils.randomString(6)
     *     })]);
     * });
     * ```
     *
     * @event
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.MessageTypeModel} evt.respondingToModel
     * @param {Layer.UI.messages.ResponseMessageModel} evt.responseModel
     */
    'message-type-model:sending-response-message',

    /**
     * Any event used to customize the notification sent when sending a Message
     * using {@link Layer.Core.MessageTypeModel#send}.
     *
     * ```
     * client.on('message-type-model:notification', function(evt) {
     *    if (evt.modelName === 'TextModel') {
     *      if (evt.notification.title.length > 50) evt.notification.title = 'Frodo is a Dodo';
     *      if (evt.notification.text.length < 10) evt.notification.text += ' and furthermore, Frodo is a Dodo';
     *    }
     * });
     * ```
     *
     * > *Note*
     * >
     * > Calling {@link Layer.Core.Message#send} bypasses this event.
     *
     * @event
     * @param {Layer.Core.LayerEvent} evt
     */
    'message-type-model:notification',
  ],
  lifecycle: {
    constructor(options) {
      this._models.messageTypes = {};
    },
    cleanup() {
      Object.keys(this._models.messageTypes || {}).forEach((id) => {
        const messageTypeModel = this._models.messageTypes[id];
        if (messageTypeModel && !messageTypeModel.isDestroyed) {
          messageTypeModel.destroy();
        }
      });
      this._models.messageTypes = null;
    },
    reset() {
      this._models.messageTypes = {};
    },

  },
  methods: {
    /**
     * Retrieve an existing Message Type Model by Model id or Message Part id.
     *
     * @method getMessageTypeModel
     * @param  {string} id              - layer:///messages/uuid/parts/uuid
     * @return {Layer.Core.MessageTypeModel}
     */
    getMessageTypeModel(id) {
      if (typeof id !== 'string') throw new Error(ErrorDictionary.idParamRequired);
      id = id.replace(/layer:\/\/\/messages\//, Core.MessageTypeModel.prefixUUID);

      return this._models.messageTypes[id] || null;
    },

    /**
     * Register the Layer.Core.MessageTypeModel.
     *
     * @method _addMessageTypeModel
     * @private
     * @param  {Layer.Core.MessageTypeModel} messageTypeModel
     */
    _addMessageTypeModel(messageTypeModel) {
      this._models.messageTypes[messageTypeModel.id] = messageTypeModel;
    },

    /**
     * Deregister the Layer.Core.MessageTypeModel.
     *
     * @method _removeMessageTypeModel
     * @private
     * @param  {Layer.Core.MessageTypeModel} messageTypeModel
     */
    _removeMessageTypeModel(messageTypeModel) {
      if (messageTypeModel) {
        delete this._models.messageTypes[messageTypeModel.id];
        this.off(null, null, messageTypeModel);
      }
    },

    /**
     * Get the Layer.Core.MessageTypeModel Class that supports this mimeType.
     *
     * Technically this could be a static method, but its simplest to use when invoked on the Client itself.
     *
     * @method getMessageTypeModelClassForMimeType
     * @param {String} mimeType
     * @returns {Function}
     */
    getMessageTypeModelClassForMimeType(mimeType) {
      return MessageTypeModelHash[mimeType];
    },

    /**
     * Create a Layer.Core.MessageTypeModel instance for this Message.
     *
     * Retrieves one from cache if it already exists.
     *
     * Note that the Part specifies whether we are generating the Root Model, or
     * if not, which sub model to generate for this Message.
     *
     * @method createMessageTypeModel
     * @param {Layer.Core.Message} message
     * @param {Layer.Core.MessagePart} [part=root]
     */
    createMessageTypeModel(message, part) {

      // Use the Root Part of the Message if we don't get a part as input
      if (!part) part = message.getRootPart();
      if (!part) return null;

      const messageTypeModel = this.getMessageTypeModel(part.id);
      if (messageTypeModel) {
        return messageTypeModel;
      } else {
        // Instantiate a sutiable model for this Part.
        const MessageTypeModelClass = this.getMessageTypeModelClassForMimeType(part.mimeType);
        if (MessageTypeModelClass) return new MessageTypeModelClass({ message, part });
      }
      return null;
    },
  },

  staticMethods: {
    /**
     * Call this static method to register a MessageTypeModelClass.
     *
     * @method registerMessageTypeModelClass
     * @param {Function} registerMessageTypeModelClass
     * @static
     */
    registerMessageTypeModelClass(messageTypeModelClass, name) {
      MessageTypeModelClasses.push(messageTypeModelClass);
      MessageTypeModelHash[messageTypeModelClass.MIMEType] = messageTypeModelClass;

      // Register any alternative MIME Types as well
      (messageTypeModelClass.AltMIMETypes || []).forEach(mimeType =>
        (MessageTypeModelHash[mimeType] = messageTypeModelClass));

      if (name) MessageTypeModelNameHash[name] = messageTypeModelClass;
    },

    /**
     * Get the Layer.Core.MessageTypeModel Class that supports this mimeType.
     *
     * @method getMessageTypeModelClassForMimeType
     * @param {String} mimeType
     * @returns {Function}
     * @static
     */
    getMessageTypeModelClass(name) {
      return MessageTypeModelNameHash[name];
    },
  },
};

Core.mixins.Client.push(module.exports);
