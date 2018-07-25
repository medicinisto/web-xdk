/*
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
 */
/**
 * @class Layer.Core.MessagePart
 */

import Core from '../namespace';

const MessagePart = {
  methods: {
    _getPostContentURL() {
      return '/content';
    },
  },
};
export default MessagePart;
Core.mixins.MessagePart.push(MessagePart);
