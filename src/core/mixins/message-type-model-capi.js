/**
 * Adds custom CAPI Message Type Model functionality to the Message Type Model class
 *
 * This is handled by a mixin so that other uses of Messaging objects (SAPI for example)
 * can have separate implementations of these methods or separate methods and properties as needed.
 *
 * This mixin provides a custom
 *
 * * `send()` method which unlike CAPI returns a Promise rather than `this`, and takes a `conversationId` instead of a `conversation`
 * * `generateMessage()` method which unlike CAPI returns a Promise rather than `this`, and takes a `conversationId` instead of a `conversation`
 * * `_send()` for using websockets to actually send the message
 *
 * @class Layer.Core.mixins.MessageTypeModelCAPI
 */

import Core from '../namespace';
import { client } from '../../settings';
import Root from '../root';
import { ErrorDictionary } from '../layer-error';
import Message from '../models/message';

module.exports = {
  methods: {

    /**
     * Send this Message Type Model within the specified Conversation
     *
     * Simplest usage, which will generate a suitable notification for this message:
     *
     * ```
     * model.send({
     *    conversation: myConversation
     * });
     * ```
     *
     * The full API?
     *
     * ```
     * model.send({
     *    conversation: myConversation,
     *    notification: {
     *      title: "New Message from " + Layer.client.user.displayName,
     *      text: model.getOneLineSummary(),
     *      sound: 'bleep.aiff'
     *    },
     *    callback(message) {
     *       console.log("Generated and sending " + message.id);
     *       message.once('messages:sent', function(evt) {
     *         console.log("Message Sent " + message.id);
     *       });
     *    }
     * });
     * ```
     *
     * The send method takes a `notification` object. In normal use, it provides the same notification to ALL
     * recipients, but you can customize notifications on a per recipient basis, as well as embed actions into the notification.
     *
     * For the Full Notification API, see [Server Docs](https://docs.layer.com/reference/server_api/push_notifications.out).
     *
     * Finally, if you want to customize the message before sending it, see {@link #generateMessage} instead.
     *
     * @method send
     * @param {Object} options
     * @param {Layer.Core.Container} options.conversation   The Conversation/Channel to send this message on
     * @param {Object} [options.notification]               Parameters for controling how the phones manage notifications of the new Message.
     *                                                      See IOS and Android docs for details.
     * @param {String} [options.notification.title]         Title to show on lock screen and notification bar
     * @param {String} [options.notification.text]          Text of your notification
     * @param {String} [options.notification.sound]         Name of an audio file or other sound-related hint
     * @param {Function} [options.callback]                 Function to call with generated Message;
     *                                                      Message state should be "sending" but not yet
     *                                                      received by the server
     * @param {Layer.Core.Message} [options.callback.message]
     * @return {Layer.Core.MessageTypeModel} this
     */
    send({ conversation, notification, callback }) {
      if (notification === undefined) notification = this.getNotification();
      return this.generateMessage(conversation, (message) => {
        if (message.isNew()) message.send(notification);
        if (callback) callback(message);
      });
    },

    /**
     * Generate a Layer.Core.Message from this Model.
     *
     * This method returns the Layer.Core.Message asynchronously as some models
     * may require processing of data prior to writing data into the Layer.Core.MessagePart objects.
     *
     * ```
     * model.generateMessage(conversation, function(message) {
     *     message.send();
     * });
     * ```
     *
     * > *Note*
     * >
     * > A model can have only a single message; calling `generateMessage()` a second time
     * > will do nothing other than call `callback` with the existing message.
     *
     * @method generateMessage
     * @param {Layer.Core.Conversation} conversation
     * @param {Function} callback
     * @param {Layer.Core.Message} callback.message
     * @return {Layer.Core.MessageTypeModel} this
     */
    generateMessage(conversation, callback) {
      if (this.message) return callback(this.message);
      if (!conversation) throw new Error(ErrorDictionary.conversationMissing);
      if (!(conversation instanceof Root)) throw new Error(ErrorDictionary.conversationMissing);
      this.generateParts((parts) => {
        this.childParts = parts.concat(this._generateInitialStateParts(parts));
        this.part.mimeAttributes.role = 'root';
        // this.part.mimeAttributes.xdkVersion = 'webxdk-' + version;
        this.message = conversation.createMessage({
          id: Message.prefixUUID + this.id.replace(/\/parts\/.*$/, '').replace(/^.*MessageTypeModels\//, ''),
          parts: this.childParts,
        });

        client._removeMessageTypeModel(this);
        this.id = Core.MessageTypeModel.prefixUUID + this.part.id.replace(/^.*messages\//, '');
        client._addMessageTypeModel(this);
        this.parseModelChildParts({ changes: this.childParts.map(part => ({ type: 'added', part })), isEdit: false });
        this.trigger('message-type-model:has-new-message'); // do this before the callback so it fires before message.send() is called
        if (callback) callback(this.message);
      });
    },
  },
};
Core.mixins.MessageTypeModel.push(module.exports);
