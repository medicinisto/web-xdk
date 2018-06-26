/**
 * The Layer Typing Indicator widget renders a short description of who is currently typing into the current Conversation.
 *
 * This is designed to go inside of the Layer.UI.components.ConversationView widget.
 *
 * The simplest way to customize the behavior of this widget is using the `layer-typing-indicator-change` event.
 *
 * ### Importing
 *
 * This is imported as part of the default build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-typing-indicator';
 * ```
 *
 * @class Layer.UI.components.TypingIndicator
 * @extends Layer.UI.Component
 */

/**
 * Custom handler to use for rendering typing indicators.
 *
 * By calling `evt.preventDefault()` on the event you can prevent the default rendering,
 * and provide your own custom typing indicator text to this widget:
 *
 * ```
 * document.body.addEventListener('layer-typing-indicator-change', function(evt) {
 *    evt.preventDefault();
 *    var widget = evt.target;
 *    var typingUsers = evt.detail.typing;
 *    var pausedUsers = evt.detail.paused;
 *    var text = '';
 *    if (typingUsers.length) text = typingUsers.length + ' users are typing';
 *    if (pausedUsers.length && typingUsers.length) text += ' and ';
 *    if (pausedUsers.length) text += pausedUsers.length + ' users have paused typing';
 *    widget.value = text;
 * });
 * ```
 *
 * Note that as long as you have called `evt.preventDefault()` you can also just directly manipulate child domNodes of `evt.detail.widget`
 * if a plain textual message doesn't suffice.
 *
 * @event layer-typing-indicator-change
 * @param {CustomEvent} evt
 * @param {Object} evt.detail
 * @param {Layer.Core.Identity[]} evt.detail.typing
 * @param {Layer.Core.Identity[]} evt.detail.paused
 */
import { client } from '../../settings';
import { registerComponent } from './component';

registerComponent('layer-typing-indicator', {
  template: '<span class="layer-typing-message" layer-id="panel"></span>',
  style: `
    layer-typing-indicator {
      display: block;
    }

    layer-typing-indicator span {
      display: none;
    }

    layer-typing-indicator.layer-typing-occuring span {
      display: inline;
    }
  `,
  properties: {
    /**
     * The Conversation whose typing indicator activity we are reporting on.
     *
     * This should be expected to change repeatedly during the lifespan of the widget.
     *
     * Should clear the indicator text if conversation is set to null.
     *
     * @property {Layer.Core.Conversation} [conversation=null]
     */
    conversation: {
      set(value) {
        if (value) {
          const state = client.getTypingState(value);
          this.onRerender({
            conversationId: value.id,
            typing: state.typing,
            paused: state.paused,
          });
        } else {
          this.value = '';
        }
      },
    },

    /**
     * The value property is the text/html being rendered.
     *
     * @property {String} [value=""]
     */
    value: {
      set(text) {
        this.nodes.panel.innerHTML = text || '';
        this.toggleClass('layer-typing-occuring', text);
      },
    },
  },
  methods: {

    // Lifecycle method depends upon `client` property
    onAfterCreate() {
      client.on('typing-indicator-change', this.onRerender, this);
    },

    // Lifecycle method
    onRender() {
      if (this.conversation && this.conversation.id) {
        const data = client.getTypingState(this.conversation.id);
        data.conversationId = this.conversation.id;
        this.onRerender(data);
      }
    },

    /**
     * Whenever there is a typing indicator event, rerender our UI
     *
     * @method onRerender
     */
    onRerender: {
      conditional: function onCanRerender(evt) {
        return Boolean(evt);
      },
      value: function onRerender(evt) {
        // We receive typing indicator events for ALL Conversations; ignore them if they don't apply to the current Conversation
        if (this.conversation && evt.conversationId === this.conversation.id) {

          // Trigger an event so that the application can decide if it wants to handle the event itself.
          const customEvtResult = this.trigger('layer-typing-indicator-change', {
            typing: evt.typing,
            paused: evt.paused,
          });

          // If the app lets us handle the event, set the value of this widget to something appropriate
          if (customEvtResult) {
            this._showAsTyping(evt.typing);
          }
        }
      },
    },

    /**
     * Render typing indicator text listing the users who are typing.
     *
     * @method _showAsTyping
     * @private
     * @param {Layer.Core.Identity[]} identities
     */
    _showAsTyping(identities) {
      const names = identities.map(user => user.firstName || user.displayName || user.lastName).filter(name => name);
      switch (names.length) {
        case 0:
          if (identities.length) {
            this.value = 'User is typing';
          } else {
            this.value = '';
          }
          break;
        case 1:
          this.value = names.join(', ') + ' is typing';
          break;
        case 2:
          this.value = `${names[0]} and ${names[1]} are typing`;
          break;
        default:
          this.value = `${names[0]}, ${names[1]} and ${names.length - 2} others are typing`;
      }
    },
  },
});

