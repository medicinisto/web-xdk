/**
 * Adds custom CAPI Messaging functionality.
 *
 * This is handled by a Client mixin so that other uses of Messaging objects (SAPI for example)
 * can have separate implementations of these methods or separate methods and properties as needed.
 *
 * This mixin provides a custom
 *
 * * `send()` method which unlike SAPI returns `this` rather than a Promise
 * * `presend()` method for rendering an unsent message in a Message List
 * * `_send()` for using websockets to actually send the message
 *
 * @class Layer.Core.mixins.MessageCAPI
 */

import Core from '../namespace';
import { client as Client } from '../../settings';
import Util from '../../utils';
import { ErrorDictionary } from '../layer-error';
import Constants from '../../constants';
import ContentTypeParser from '../../utils/content-type-parser';

module.exports = {
  methods: {
    /**
     * Your unsent Message will show up in Query results and be rendered in Message Lists.
     *
     * This method is only needed for Messages that should show up in a Message List Widget that
     * is driven by Query data, but where the Layer.Core.Message.send method has not yet been called.
     *
     * Once you have called `presend` your message should show up in your Message List.  However,
     * typically you want to be able to edit and rerender that Message. After making changes to the Message,
     * you can trigger change events:
     *
     * ```
     * var message = conversation.createMessage({parts: [{mimeType: 'custom/card', body: null}]});
     * message.presend();
     *
     * message.parts[0].body = 'Frodo is a Dodo';
     * message.trigger('messages:change');
     * ```
     *
     * Note that if using Layer UI for Web, the `messages:change` event will trigger an `onRerender` call,
     * not an `onRender` call, so the capacity to handle editing of messages will require the ability to render
     * all possible edits within `onRerender`.
     *
     * It is assumed that at some point either `send()` or `destroy()` will be called on this message
     * to complete or cancel this process.
     *
     * @method presend
     * @return this
     */
    presend() {
      const conversation = this.getConversation(false);

      if (!conversation) {
        throw new Error(ErrorDictionary.conversationMissing);
      }

      if (this.syncState !== Constants.SYNC_STATE.NEW) {
        throw new Error(ErrorDictionary.alreadySent);
      }
      conversation._setupMessage(this);

      // Make sure all data is in the right format for being rendered
      this._readAllBlobs(() => {
        Client._addMessage(this);
      });
      return this;
    },

    /**
     * Send the message to all participants of the Conversation.
     *
     * Message must have parts and a valid conversation to send successfully.
     *
     * The send method takes a `notification` object. In normal use, it provides the same notification to ALL
     * recipients, but you can customize notifications on a per recipient basis, as well as embed actions into the notification.
     *
     * For the Full Notification API, see [Server Docs](https://docs.layer.com/reference/server_api/push_notifications.out).
     *
     * ```
     * message.send({
     *    title: "New Hobbit Message",
     *    text: "Frodo-the-Dodo: Hello Sam, what say we waltz into Mordor like we own the place?",
     *    sound: "whinyhobbit.aiff"
     * });
     * ```
     *
     * @method send
     * @param {Object} [notification]            Parameters for controling how the phones manage notifications of the new Message.
     *                                           See IOS and Android docs for details.
     * @param {String} [notification.title]      Title to show on lock screen and notification bar
     * @param {String} [notification.text]       Text of your notification
     * @param {String} [notification.sound]      Name of an audio file or other sound-related hint
     * @return {Layer.Core.Message} this
     */
    send(notification) {
      const conversation = this.getConversation(true);

      if (!conversation) {
        throw new Error(ErrorDictionary.conversationMissing);
      }

      if (this.syncState !== Constants.SYNC_STATE.NEW) {
        throw new Error(ErrorDictionary.alreadySent);
      }

      this.parts.forEach((part) => {
        if (!ContentTypeParser(part.mimeType)) {
          throw new Error(ErrorDictionary.invalidMimeType + ': ' + part.mimeType);
        }
      });

      if (conversation.isLoading) {
        conversation.once(conversation.constructor.eventPrefix + ':loaded', () => this.send(notification));
        conversation._setupMessage(this);
        return this;
      }

      if (!this.parts || !this.parts.size) {
        throw new Error(ErrorDictionary.partsMissing);
      }

      this._setSyncing();

      // Make sure that the Conversation has been created on the server
      // and update the lastMessage property
      conversation.send(this);

      // If we are sending any File/Blob objects, and their Mime Types match our test,
      // wait until the body is updated to be a string rather than File before calling _addMessage
      // which will add it to the Query Results and pass this on to a renderer that expects "text/plain" to be a string
      // rather than a blob.
      this._readAllBlobs(() => {
        // Calling this will add this to any listening Queries... so position needs to have been set first;
        // handled in conversation.send(this)
        Client._addMessage(this);

        // allow for modification of message before sending
        const evt = this.trigger('messages:sending', { notification, cancelable: true });
        if (evt.canceled) {
          return;
        }

        const data = {
          parts: new Array(this.parts.size),
          id: this.id,
        };
        if (notification && this.conversationId) data.notification = notification;

        this._preparePartsForSending(data);
      });
      return this;
    },

    /**
     * Handle the actual sending.
     *
     * Layer.Core.Message.send has some potentially asynchronous
     * preprocessing to do before sending (Rich Content); actual sending
     * is done here.
     *
     * @method _send
     * @private
     */
    _send(data) {
      const conversation = this.getConversation(false);

      Client._triggerAsync('state-change', {
        started: true,
        type: 'send_' + Util.typeFromID(this.id),
        telemetryId: 'send_' + Util.typeFromID(this.id) + '_time',
        id: this.id,
      });
      this.sentAt = new Date();
      Client.sendSocketRequest({
        method: 'POST',
        body: {
          method: 'Message.create',
          object_id: conversation.id,
          data,
        },
        sync: {
          depends: [this.conversationId, this.id],
          target: this.id,
        },
      }, (success, socketData) => this._sendResult(success, socketData));
    },
    _getSendData(data) {
      data.object_id = this.conversationId;
      return data;
    },
  },
};
Core.mixins.Message.push(module.exports);
