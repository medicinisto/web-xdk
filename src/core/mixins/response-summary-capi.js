/*
 * Adds custom CAPI Response Summary versions of methods.
 *
 * This is handled by a Client mixin so that other uses of Messaging objects (SAPI for example)
 * can have separate implementations of these methods or separate methods and properties as needed.
 *
 * This mixin provides a custom
 *
 * * `sendResponseMessage()` method which unlike SAPI returns `this` rather than a Promise
 */

/**
 * @class Layer.Core.MessageTypeResponseSummary
 */

import Core from '../namespace';

const MessageTypeResponseSummary = {
  methods: {
    /**
     * Generate a Message from the Response Model, and send it in our current Conversation.
     *
     * Note that this is automatically called after a short delay, any time
     * `addState` is called changing the state and requiring that state to be shared with all participants.
     * Calling it directly however insures other changes aren't accidently added to this Response Message.
     *
     * @method sendResponseMessage
     */
    sendResponseMessage() {
      if (this.isDestroyed || !this._currentResponseModel || !this._currentResponseModel.operations.length) return;
      this._sendResponseTimeout = 0;

      if (this.parentModel.message && this.parentModel.part && !this.parentModel.message.isNew()) {
        const evt = this.parentModel.trigger('message-type-model:sending-response-message', {
          respondingToModel: this.parentModel,
          responseModel: this._currentResponseModel,
          cancelable: true,
        });

        // If the event was canceled, do nothing
        if (evt.canceled) {
          this._currentResponseModel = null;
        }

        // Fix up the response model's properties and then call `send`
        else {
          const response = this.getPreparedResponseModel();
          response.send({ conversation: this.parentModel.message.getConversation() });
        }
      } else if (this.parentModel.message) {
        this.parentModel.message.once('messages:sent', this.sendResponseMessage.bind(this), this);
      } else {
        this.parentModel.once('message-type-model:has-new-message', this.sendResponseMessage.bind(this), this);
      }
    },
  },
};

export default MessageTypeResponseSummary;
Core.mixins.ResponseSummaryModel.push(MessageTypeResponseSummary);
