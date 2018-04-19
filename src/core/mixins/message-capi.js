/**
 * Adds custom CAPI Messaging functionality.
 *
 * This is handled by a Client mixin rather than:
 *
 * * The Client itself so we can keep the client simple and clean
 * * The Websocket Change Manager so that the change manager does not need to know
 *   how to handle any operation on any data.  Its primarily aimed at insuring websocket
 *   events get processed, not knowing minute details of the objects.
 *
 * @class Layer.Core.mixins.MessageCAPI
 */

import Core from '../namespace';
import { client as Client } from '../../settings';
import Util from '../../utils';

module.exports = {
  methods: {

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
