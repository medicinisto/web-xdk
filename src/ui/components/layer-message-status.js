/**
 * The Layer Message Status widget renders a Message's sent/delivered/read status.
 *
 * This is provided as a specialized component so that it can be easily customized or redefined by your app to
 * provide your own formatting or interactions.  Note that most customization of message status rendering can be accomplished using a
 * set of template properties such as Layer.UI.components.MessageStatus.deliveredDMTemplate, or provide your own rendering function
 * using Layer.UI.components.ConversationView.messageStatusRenderer.
 *
 * The simplest way to customize the Message Renderer is using the Template Properties:
 *
 * ```
 * Layer.init({
 *   mixins: {
 *     'layer-message-status': {
 *       properties: {
 *         pendingTemplate: "Waiting for server...",
 *         sentTemplate: "Waiting for delivery...",
 *         deliveredDMTemplate: "Delivered but not yet read",
 *         readDMTemplate: "Read at last",
 *         deliveredGroupTemplate: "Delivered to ${count} users who couldn't be bothered to read it",
 *         readGroupTemplate: "Read by ${count} users who actually care what I have to say",
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * Alternatively, if your customization goes beyond changing the wording of things, and involves introducting more interactive elements to Status:
 *
 * ```
 * Layer.UI.registerComponent('layer-message-status', {
 *    properties: {
 *      item: {
 *        set: function(newMessage) {
 *          if (newMessage) newMessage.on('messages:change', this.onRerender, this);
 *          this.onRerender();
 *        }
 *      }
 *    },
 *    methods: {
 *      onCreate() {
 *        this.addEventListener('click', this.onClick.bind(this));
 *      },
 *      onRerender() {
 *          var message = this.properties.message;
 *          this.innerHTML = 'Nobody wants to read your message';
 *      },
 *      onClick() {
 *         // Your custom interaction
 *      }
 *    }
 * });
 *
 * // Call init after custom components are defined
 * layer.init({
 *   appId:  'layer:///apps/staging/UUID'
 * });
 * ```
 *
 * ### Importing
 *
 * This is imported by default. If using a custom build, then import one of:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-message-status';
 * ```
 *
 * @class Layer.UI.components.MessageStatus
 * @extends Layer.UI.Component
 */
import Constants from '../../constants';
import { registerComponent } from './component';

registerComponent('layer-message-status', {
  style: `
    layer-message-status {
      display: inline;
    }
  `,
  properties: {

    /**
     * Message whose status is to be rendered
     *
     * @property {Layer.Core.Message} [message=null]
     */
    item: {
      set(newMessage, oldMessage) {
        if (oldMessage) oldMessage.off(null, null, this);
        if (newMessage) newMessage.on('messages:change', this.onRerender, this);
        this.onRender();
      },
    },

    /**
     * Provide property to override the function used to render a message status for each Message Item.
     *
     * > *Note*
     * >
     * > Changing this will not trigger a rerender; this should be set during initialization.
     *
     * > *Note*
     * >
     * > This property is typically set via Layer.UI.components.ConversationView.messageStatusRenderer
     *
     * ```javascript
     * statusItem.messageStatusRenderer = function(message) {
     *    return message.readStatus === Layer.Constants.RECIPIENT_STATE.ALL ? 'read' : 'processing...';
     * };
     * ```
     *
     * @property {Function} [messageStatusRenderer=null]
     */
    messageStatusRenderer: {
      get() {
        return this.properties.messageStatusRenderer ||
          this.parentComponent && this.parentComponent.messageStatusRenderer;
      },
    },

    /**
     * New message template, for when the message is in preview mode and has not yet been queued for sending
     *
     * @property {String} [presendTemplate=]
     */
    presendTemplate: {
      value: '',
    },

    /**
     * Pending status message template, for when the message has not yet been sent to the server or acknowledged by the server.
     *
     * @property {String} [pendingTemplate=pending]
     */
    pendingTemplate: {
      value: 'pending',
    },

    /**
     * Sent status message template, for when the message has been acknowledged by the server but not yet successfully delivered to any users.
     *
     * @property {String} [sentTemplate=sent]
     */
    sentTemplate: {
      value: 'sent',
    },

    /**
     * Status message template for Channels which do not track read/delivery status for other users and only track whether the message has been acknowledged
     * by the server.
     *
     * @property {String} [channelTemplate=sent]
     */
    channelTemplate: {
      value: 'sent',
    },

    /**
     * Delivered status message template for one-on-one Conversations, for when the message has not been read by any users, but has been delivered.
     *
     * @property {String} [deliveredDMTemplate=delivered]
     */
    deliveredDMTemplate: {
      value: 'delivered',
    },

    /**
     * Read status message template for one-on-one Conversations, for when the message has not been read by all users.
     *
     * @property {String} [readDMTemplate=read]
     */
    readDMTemplate: {
      value: 'read',
    },

    /**
     * Delivered status message template for group Conversations, for when the message has not been read by any users, but has been delivered to one or more users (not counting the sender).
     *
     * String template supports a ${count} symbol in the template string
     *
     * @property {String} [deliveredGroupTemplate=delivered to ${count} participants]
     */
    deliveredGroupTemplate: {
      value: 'delivered to ${count} participants', // eslint-disable-line no-template-curly-in-string

    },

    /**
     * Read status message template for group Conversations, for when the message has been read by one or more users (not counting the sender)
     *
     * String template supports a ${count} symbol in the template string
     *
     * @property {String} [readGroupTemplate=read by ${count} participants]
     */
    readGroupTemplate: {
      value: 'read by ${count} participants', // eslint-disable-line no-template-curly-in-string
    },


  },
  methods: {

    /**
     * Constructor.
     *
     * @method onCreate
     * @private
     */
    onCreate() {
    },

    /**
     * There are many ways to render the status of a Message.
     *
     * See Layer.UI.components.ConversationView.messageStatusRenderer to customize this.
     *
     * @method
     * @private
     * @param {Event} evt
     */
    onRerender(evt) {
      if (this.item && !this.item.isDestroyed &&
          (!evt || evt.hasProperty('recipientStatus') || evt.hasProperty('syncState'))) {
        const message = this.item;
        let html = '';
        if (this.messageStatusRenderer) {
          html = this.messageStatusRenderer(message);
        }

        // App called presend on the message and its not yet queued to be sent but is rendered:
        else if (message.isNew()) {
          html = this.presendTemplate;
        }

        // Message is being sent, but not yet acknowledged by server
        else if (message.isSaving()) {
          html = this.pendingTemplate;
        }

        // Don't yet have a deliveryStatus / readStatus
        else if (!message.deliveryStatus && !message.readStatus) {
          html = '';
        }

        // Message has been acknowledged by the server, but has not been delivered to anyone
        else if (message.deliveryStatus === Constants.RECIPIENT_STATE.NONE) {
          html = this.sentTemplate;
        }

        // Message is a Channel Message where read/delivery is not tracked
        else if (message.channel) {
          html = this.channelTemplate;
        }

        // One-on-One Conversations
        else if (message.getConversation().participants.length === 2) {
          if (message.readStatus === Constants.RECIPIENT_STATE.NONE) {
            html = this.deliveredDMTemplate;
          } else {
            html = this.readDMTemplate;
          }
        }

        // Group Conversations
        else if (message.readStatus === Constants.RECIPIENT_STATE.NONE) {
          const count = Object.keys(message.recipientStatus)
            .filter(id =>
              message.recipientStatus[id] === Constants.RECEIPT_STATE.DELIVERED ||
              message.recipientStatus[id] === Constants.RECEIPT_STATE.READ).length - 1;
          html = this.deliveredGroupTemplate.replace(/(\$\{.*?\})/g, match => count);
        } else {
          const count = Object.keys(message.recipientStatus)
            .filter(id => message.recipientStatus[id] === Constants.RECEIPT_STATE.READ).length - 1;
          html = this.readGroupTemplate.replace(/(\$\{.*?\})/g, match => count);
        }
        this.innerHTML = html;
      }
    },
  },
});
