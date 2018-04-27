/**
 * Adds APIs to the Layer Client for working with Typing Indicators
 *
 * @class Layer.Core.Client
 */

import Core from '../namespace';
import TypingIndicatorListener from '../typing-indicators/typing-indicator-listener';
import TypingListener from '../typing-indicators/typing-listener';
import TypingPublisher from '../typing-indicators/typing-publisher';

module.exports = {
  events: [
    /**
     * A Typing Indicator state has changed.
     *
     * Either a change has been received
     * from the server, or a typing indicator state has expired.
     *
     *      client.on('typing-indicator-change', function(evt) {
     *          if (evt.conversationId === myConversationId) {
     *              alert(evt.typing.join(', ') + ' are typing');
     *              alert(evt.paused.join(', ') + ' are paused');
     *          }
     *      });
     *
     * @event
     * @param {Layer.Core.LayerEvent} evt
     * @param {string} conversationId - ID of the Conversation users are typing into
     * @param {string[]} typing - Array of user IDs who are currently typing
     * @param {string[]} paused - Array of user IDs who are currently paused;
     *                            A paused user still has text in their text box.
     */
    'typing-indicator-change',
  ],
  lifecycle: {

    // Listen for any websocket operations and call our handler
    constructor(options) {
      this._typingIndicators = new TypingIndicatorListener({});
    },
  },
  methods: {
    /**
     * Creates a Layer.Core.TypingIndicators.TypingListener instance
     * bound to the specified dom node.
     *
     *      var typingListener = client.createTypingListener(document.getElementById('myTextBox'));
     *      typingListener.setConversation(mySelectedConversation);
     *
     * Use this method to instantiate a listener, and call
     * Layer.Core.TypingIndicators.TypingListener.setConversation every time you want to change which Conversation
     * it reports your user is typing into.
     *
     * @method createTypingListener
     * @param  {HTMLElement} inputNode - Text input to watch for keystrokes
     * @return {Layer.Core.TypingIndicators.TypingListener}
     */
    createTypingListener(inputNode) {
      return new TypingListener({
        input: inputNode,
      });
    },

    /**
     * Creates a Layer.Core.TypingIndicators.TypingPublisher.
     *
     * The TypingPublisher lets you manage your Typing Indicators without using
     * the Layer.Core.TypingIndicators.TypingListener.
     *
     *      var typingPublisher = client.createTypingPublisher();
     *      typingPublisher.setConversation(mySelectedConversation);
     *      typingPublisher.setState(Layer.Core.TypingIndicators.STARTED);
     *
     * Use this method to instantiate a listener, and call
     * Layer.Core.TypingIndicators.TypingPublisher.setConversation every time you want to change which Conversation
     * it reports your user is typing into.
     *
     * Use Layer.Core.TypingIndicators.TypingPublisher.setState to inform other users of your current state.
     * Note that the `STARTED` state only lasts for 2.5 seconds, so you
     * must repeatedly call setState for as long as this state should continue.
     * This is typically done by simply calling it every time a user hits
     * a key.
     *
     * @method createTypingPublisher
     * @return {Layer.Core.TypingIndicators.TypingPublisher}
     */
    createTypingPublisher() {
      return new TypingPublisher({});
    },

    /**
     * Get the current typing indicator state of a specified Conversation.
     *
     * Typically used to see if anyone is currently typing when first opening a Conversation.
     *
     * @method getTypingState
     * @param {String} conversationId
     */
    getTypingState(conversationId) {
      return this._typingIndicators.getState(conversationId);
    },
  },
};

Core.mixins.Client.push(module.exports);
