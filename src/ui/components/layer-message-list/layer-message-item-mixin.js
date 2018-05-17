/**
 * The Layer Message Item component renders a single Message, typically for use within a Message List.
 *
 * This is designed to go inside of the Layer.UI.components.MessageListPanel.List component.
 * This component renders the framework of information that goes around a Message,
 * but leaves it up to subcomponents to render the contents and assorted MIME Types of the messages.
 *
 * This Component has three named and customizable templates:
 *
 * * `layer-message-item-sent`: Rendering for Messages sent by the owner of this Session
 * * `layer-message-item-received`: Rendering for Messages sent by other users
 * * `layer-message-item-status`: Rendering for Messages that are rendered as Status Messages
 *
 * ## CSS Classes
 *
 * * When sending a message, if using `presend()` the message item will have the CSS class `layer-message-preview` until its sent
 * * The tagName used to render the content within the message item will be used as a class name of the parent item.
 *   If using a `<layer-message-viewer />` widget within the item, the item itself will receive the `layer-message-viewer` CSS class
 * * `layer-unread-message` will be applied to any message that the user has received but which hasn't been marked as read
 * * `layer-message-status-read-by-all`: All receipients of your user's message have read the message
 * * `layer-message-status-read-by-some`: Some receipients of your user's message have read the message
 * * `layer-message-status-read-by-none`: No receipients of your user's message have read the message
 * * `layer-message-status-delivered-to-all`: All receipients of your user's message have received the message on their device
 * * `layer-message-status-delivered-to-some`: Some receipients of your user's message have received the message on their device
 * * `layer-message-status-delivered-to-none`: No receipients of your user's message have received the message on their device
 * * `layer-message-status-pending`: The Message is trying to reach the server and has not yet completed sending
 * * `layer-list-item-last`: The message is the last in a series of messages from the same sender and within the same block of time
 * * `layer-list-item-first`: The message is the first in a series of messages from the same sender and within the same block of time
 *
 * ## Customization
 *
 * The recommended way to customize a Message Item is using Replaceable Content.  While this can be set as a property upon the Message Item,
 * its typically simpler to set it as a property upon the Message List or even the Conversation View.
 *
 * ```
 * conversationView.replaceableContent = {
 *     messageRowRightSide: function(messageItemComponent) {
 *        var message = messageItemComponent.item;
 *        if (message.sender.isMine) {
 *            var div = document.createElement('div');
 *            div.innerHTML = 'some stuff that the message sender should see goes here';
 *            return div;
 *        } else {
 *            var div = document.createElement('div');
 *            div.innerHTML = 'some stuff that the message recipient should see goes here';
 *            return div;
 *        }
 *     }
 * };
 * ```
 *
 * The following Replaceable Content keys are built into the templates:
 *
 * * messageRowRightSide
 * * messageRowLeftSide
 * * messageRowHeader
 * * messageRowFooter
 *
 * Any component that you define and put into any of these areas will have an `item` property set containing the currently
 * rendered Layer.Core.Message.
 *
 * ## Advanced Customization
 *
 * For more advanced customizations where the Message Item widget needs new properties, methods and capabilities, the Message Item
 * can be enhanced via Mixin
 *
 * The following example adds a selection checkbox to each Message Item;
 *
 * * It adds a selected property that gets/sets the Checkbox state
 * * It adds custom handling during onCreate to add a checkbox to the DOM and wire up its event handler
 * * It adds initialization of the checkbox state
 * * It adds triggering of a `custom-message-checkbox-change` event on the DOM that can be listened for
 *   using `document.addEventListener('custom-message-checkbox-change', handler)
 *
 * ```
 * Layer.init({
 *   mixins: {
 *     'layer-messages-item': {
 *       properties: {
 *         selected: {
 *           value: false,
 *           set: function(value) {
 *             if (this.nodes.checkbox) this.nodes.checkbox.checked = value;
 *           },
 *           get: function() {
 *             return this.nodes.checkbox ? this.nodes.checkbox.checked : this.properties.selected;
 *           }
 *         }
 *       },
 *       methods: {
 *         onCreate: function() {
 *           this.nodes.checkbox = document.createElement('input');
 *           this.nodes.checkbox.type = 'checkbox';
 *           this.nodes.checkbox.classList.add('custom-checkbox');
 *           this.nodes.checkbox.addEventListener('click', this._handleCustomCheckboxEvent.bind(this));
 *           this.appendChild(this.nodes.checkbox);
 *         },
 *
 *         onAfterCreate: function() {
 *          this.nodes.checkbox.checked = this.selected;
 *         },
 *
 *         // Allow the app to get updates to selection state changes for all Message Items
 *         _handleCustomCheckboxEvent(evt) {
 *           this.trigger('custom-message-checkbox-change', {
 *             isChecked: this.selected,
 *             item: this.item
 *           });
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * ### Importing
 *
 * Included with the standard build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-message-list/layer-message-item-mixin';
 * ```
 *
 * @class Layer.UI.components.MessageListPanel.Item
 * @mixins Layer.UI.mixins.ListItem
 * @extends Layer.UI.Component
 */
import Constants from '../../../constants';
import Util, { logger } from '../../../utils';
import ListItem from '../../mixins/list-item';

module.exports = {
  mixins: [ListItem],
  properties: {

    /**
     * Rather than sort out `instanceof` operations, you can use `isMessageListItem` to test to see if a widget represents a Message Item.
     *
     * A Message Item only shows up in a MessageList; other places where Messages are rendered (layer-notifier,
     * layer-conversation-last-message, etc...) are
     * NOT Message Items, and may need to keep its content more compact.
     *
     * @property {Boolean} [isMessageListItem=true]
     * @readonly
     */
    isMessageListItem: {
      value: true,
    },

    // Every List Item has an item property, here it represents the Message to render
    item: {},

    /**
     * Deletion of this Message is enabled.
     *
     * ```
     * widget.getDeleteEnabled = function(message) {
     *    return message.sender.isMine;
     * }
     * ```
     *
     * @property {Function} getDeleteEnabled
     * @removed
     */

    /**
     * HTML Tag to generate for the current content.
     *
     * @private
     * @deprecated  Here for backwards compatability only; all messages should be rendered using Layer.UI.handlers.message.MessageViewer
     * @property {String} _contentTag
     */
    _contentTag: {
      set(newTag, oldTag) {
        if (oldTag) this.classList.remove(oldTag);
        if (newTag) this.classList.add(newTag);
      },
    },

    /**
     * @inheritdoc Layer.UI.components.MessageListPanel.List#dateRenderer
     *
     * @property {Function} [dateRenderer=null]
     * @property {Date} dateRenderer.date
     * @property {String} dateRenderer.return
     */
    dateRenderer: {},

    /**
     * @inheritdoc Layer.UI.components.MessageListPanel.List#dateFormat
     *
     * @property {Object} [dateFormat=]
     * @property {Object} [dateFormat.today={hour: 'numeric', minute: 'numeric'}]
     * @property {Object} [dateFormat.week={ weekday: 'short', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.older={ month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.default={ month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     */
    dateFormat: {},

    /**
     * @inheritdoc Layer.UI.components.MessageListPanel.List#getMenuItems
     *
     * @property {Function} getMenuItems
     * @property {Layer.Core.Message} getMenuItems.message
     * @property {Object[]} getMenuItems.return
     */
    getMenuItems: {
      type: Function,
      propagateToChildren: true,
    },

    /**
     * @inheritdoc Layer.UI.components.MessageListPanel.List#messageStatusRenderer
     *
     * @property {Function} [messageStatusRenderer=null]
     * @property {Layer.Core.Message} messageStatusRenderer.message
     * @property {String} messageStatusRenderer.return
     */
    messageStatusRenderer: {},
    cssClassList: {
      value: ['layer-message-item'],
    },
  },
  methods: {

    // Lifecycle method sets up date widget
    onAfterCreate() {
      const dateFormat = this.dateFormat;
      if (dateFormat && this.nodes.date) {
        Object.keys(dateFormat).forEach((formatName) => {
          this.nodes.date[formatName + 'Format'] = dateFormat[formatName];
        });
      }
    },

    // Lifecycle method sets up the Message to render
    onRender: function onRender() {
      try {

        // Setup the layer-sender-name
        if (this.nodes.sender) {
          this.nodes.sender.innerHTML = this.item.sender.displayName;
        }

        if (this.nodes.avatar) {
          this.nodes.avatar.users = [this.item.sender];
        }

        // Setup the layer-date
        if (this.nodes.date && !this.item.isNew()) {
          if (this.dateRenderer) this.nodes.date.dateRenderer = this.dateRenderer;
          this.nodes.date.date = this.item.sentAt;
        }

        // Setup the layer-message-status
        if (this.nodes.status && this.messageStatusRenderer) {
          this.nodes.status.messageStatusRenderer = this.messageStatusRenderer;
        }

        // Setup the layer-delete
        if (this.nodes.delete) {
          this.nodes.delete.enabled = this.getDeleteEnabled ? this.getDeleteEnabled(this.properties.item) : true;
        }

        // Generate the renderer for this Message's MessageParts.
        this._applyContentTag();

        // Render all mutable data
        this.onRerender();
      } catch (err) {
        logger.error('layer-message-item.render(): ', err);
      }
    },

    // Lifecycle method handles rendering of mutable properties of the message
    onRerender() {
      const readStatus = this.properties.item.readStatus;
      const deliveryStatus = this.properties.item.deliveryStatus;
      const statusPrefix = 'layer-message-status';
      this.toggleClass('layer-unread-message', !this.properties.item.isRead);
      this.toggleClass(`${statusPrefix}-read-by-all`, readStatus === Constants.RECIPIENT_STATE.ALL);
      this.toggleClass(`${statusPrefix}-read-by-some`, readStatus === Constants.RECIPIENT_STATE.SOME);
      this.toggleClass(`${statusPrefix}-read-by-none`, readStatus === Constants.RECIPIENT_STATE.NONE);

      this.toggleClass(`${statusPrefix}-delivered-to-all`, deliveryStatus === Constants.RECIPIENT_STATE.ALL);
      this.toggleClass(`${statusPrefix}-delivered-to-some`, deliveryStatus === Constants.RECIPIENT_STATE.SOME);
      this.toggleClass(`${statusPrefix}-delivered-to-none`, deliveryStatus === Constants.RECIPIENT_STATE.NONE);

      this.toggleClass(`${statusPrefix}-pending`, this.properties.item.isSaving());
      this.toggleClass('layer-message-preview', this.properties.item.isNew());

      // Needed for when a message was first rendered after calling `presend()`
      // and later gets `send()` called on it.
      if (this.nodes.date && !this.item.isNew()) {
        this.nodes.date.date = this.item.sentAt;
      }
    },

    /**
     * The parent component sets the _contentTag property, and now its time to use it.
     *
     * Use that tagName to create a DOM Node to render the MessageParts.
     *
     * @method
     * @private
     */
    _applyContentTag() {
      let messageHandler;
      if (this._contentTag.toLowerCase() === 'layer-message-viewer') {
        messageHandler = this.nodes.messageViewer;
        if (this.nodes.content) this.nodes.content.parentNode.removeChild(this.nodes.content);
        this.nodes.messageViewer.message = this.item;
      } else {
        messageHandler = document.createElement(this._contentTag);
        messageHandler.parentComponent = this;
        messageHandler.message = this.item;
        this.nodes.messageHandler = messageHandler;
        if (this.nodes.messageViewer) {
          this.nodes.messageViewer.parentNode.removeChild(this.nodes.messageViewer);
          delete this.nodes.messageViewer;
        }
        this.nodes.content.appendChild(messageHandler);
      }
      Util.defer(() => {
        if (messageHandler.style.height) {
          this.nodes.content.style.height = messageHandler.style.height;
        }
      });
    },
  },
};
