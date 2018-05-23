/**
 * The Layer Conversation Panel includes a Message List, Typing Indicator Panel, and a Compose bar.
 *
 * Note that its up to the developer to tell this panel what its showing by setting the `conversationId` property.
 * This property affects what messages are rendered, what typing indicators are sent and rendered, and what Conversations messages are
 * sent to when your user types into the compose bar.
 *
 * Changing the `conversationId` is as simple as:
 *
 * ```javascript
 * function selectConversation(conversation) {
 *   conversationPanel.conversationId = conversation.id;
 * }
 * ```
 *
 * or if using a templating engine, something like this would also work for setting the `conversationId`:
 *
 * ```
 * <layer-conversation-view conversation-id={selectedConversationId}></layer-conversation-view>
 * ```
 *
 * This Component can be added to your project directly in the HTML file:
 *
 * ```
 * <layer-conversation-view></layer-conversation-view>
 * ```
 *
 * Or via DOM Manipulation:
 *
 * ```javascript
 * var conversation = document.createElement('layer-conversation-view');
 * ```
 *
 * ## Key Properties
 *
 * * Layer.UI.components.ConversationView.conversationId (attribute-name: `conversation-id`): Set what conversation is being viewed
 * * Layer.UI.components.ConversationView.queryId (attribute-name: `query-id`): If your app already has a Layer.Core.Query, you can provide it to this widget to render and page through its Messages.  If you don't have a Layer.Core.Query instance, this widget will generate one for you.
 *
 * NOTE: If you provide your own Query, you must update its predicate when changing Conversations.
 *
 * ## Events
 *
 * Events listed here come from either this component, or its subcomponents.
 *
 * * {@link Layer.UI.components.ComposeBar#layer-send-message layer-send-message}: User has requested their Message be sent
 * * {@link Layer.UI.components.TypingIndicator#layer-typing-indicator-change layer-typing-indicator-change}: Someone in the Conversation has started/stopped typing
 *
 * ### Importing
 *
 * Included in the default build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-conversation-view';
 * ```
 *
 * @class Layer.UI.components.ConversationView
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.HasQuery
 * @mixin Layer.UI.mixins.FileDropTarget
 */
import { client, conversationViewWidths } from '../../settings';
import Core from '../../core/namespace';
import UIConstants from '../constants';
import { registerComponent } from './component';
import HasQuery from '../mixins/has-query';
import Throttler from '../mixins/throttler';
import Utils from '../../utils';

import './layer-message-list';
import './layer-compose-bar';
import './layer-typing-indicator';

registerComponent('layer-conversation-view', {
  mixins: [HasQuery, 'FocusOnKeydown', 'FileDropTarget', Throttler],
  template: `
    <layer-replaceable-content name='conversationViewTop' layer-id='top' class='layer-conversation-view-top'></layer-replaceable-content>
    <layer-message-list layer-id='list'></layer-message-list>
    <layer-typing-indicator layer-id='typingIndicators'></layer-typing-indicator>
    <layer-compose-bar layer-id='composer'></layer-compose-bar>
  `,
  style: `
    layer-conversation-view {
      position: relative;
      display: flex;
      flex-direction: column;
      outline: none; /* Don't show focus on the widget; typing will refocus on textarea. */
    }
    layer-message-list {
      flex-grow: 1;
      height: 100px;
    }
    layer-compose-bar {
      min-height: 30px;
    }
  `,

  /**
   * This event is triggered before any Message is sent.
   *
   * You can use this event to provide your own logic for sending the Message.
   *
   * ```javascript
   * conversationPanel.onSendMessage = function(evt) {
   *   evt.preventDefault();
   *   var model = evt.detail.model;
   *   var notification = evt.detail.notification;
   *   var conversation = evt.detail.conversation;
   *
   *   // Perform various (possibly async) tasks
   *   myAsyncLookup(function(result) {
   *     var part = new Layer.Core.MessagePart({
   *       mimeType: 'application/json',
   *       body: result
   *     });
   *     model.generateMessage(conversation, function(message) {
   *        message.addPart(part);
   *        model.send({ notification });
   *     });
   *   });
   * };
   * ```
   *
   * You can also use this event to modify the notification before its sent:
   *
   * ```
   * conversationPanel.onSendMessage = function(evt) {
   *   var notification = evt.detail.notification;
   *   notification.title = "New Notification Title";
   *   notification.text = "New Notification Text";
   * });
   * ```
   *
   * @property {Function} onSendMessage
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.MessageTypeModel} evt.detail.model
   * @param {Object} evt.detail.notification
   */

  /**
   * This event is triggered before any Message is sent.
   *
   * You can use this event to provide your own logic for sending the Message.
   *
   * ```javascript
   * document.body.addEventListener('layer-send-message', function(evt) {
   *   evt.preventDefault();
   *   var model = evt.detail.model;
   *   var notification = evt.detail.notification;
   *   var conversation = evt.detail.conversation;
   *
   *   // Perform various (possibly async) tasks
   *   myAsyncLookup(function(result) {
   *     var part = new Layer.Core.MessagePart({
   *       mimeType: 'application/json',
   *       body: result
   *     });
   *     model.generateMessage(conversation, function(message) {
   *        message.addPart(part);
   *        model.send({ notification });
   *     });
   *   });
   * });
   * ```
   *
   * You can also use this event to modify the notification before its sent:
   *
   * ```
   * document.body.addEventListener('layer-send-message', function(evt) {
   *   var notification = evt.detail.notification;
   *   notification.title = "New Notification Title";
   *   notification.text = "New Notification Text";
   * });
   * ```
   *
   * @event layer-send-message
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.MessageTypeModel} evt.detail.model
   * @param {Object} evt.detail.notification
   */

  /**
   * This event is triggered before the Message is deleted.
   *
   * You can use this event to provide your own logic for deleting the Message, or preventing it from being deleted.
   *
   * ```javascript
   * conversationPanel.onMessageDeleted = function(evt) {
   *   evt.preventDefault();
   *   var message = evt.detail.item;
   *   message.delete(Layer.Constants.DELETION_MODES.MY_DEVICES);
   * };
   * ```
   *
   * @property {Function} onMessageDeleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Message} evt.detail.item
   * @removed Use menu options callback to perform any needed actions or trigger any needed events
   */

  /**
   * This event is triggered before the Message is deleted.
   *
   * You can use this event to provide your own logic for deleting the Message, or preventing it from being deleted.
   *
   * ```javascript
   * document.body.addEventListener('layer-message-deleted', function(evt) {
   *   evt.preventDefault();
   *   var message = evt.detail.item;
   *   message.delete(Layer.Constants.DELETION_MODES.MY_DEVICES);
   * });
   * ```
   *
   * @event layer-message-deleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Message} evt.detail.item
   * @removed Use menu options callback to perform any needed actions or trigger any needed events
   */

  /**
   * Custom handler to use for rendering typing indicators.
   *
   * By calling `evt.preventDefault()` on the event you can provide your own custom typing indicator text to this widget:
   *
   * ```javascript
   * conversationPanel.onTypingIndicatorChange = function(evt) {
   *    evt.preventDefault();
   *    var widget = evt.target;
   *    var typingUsers = evt.detail.typing;
   *    var pausedUsers = evt.detail.paused;
   *    var text = '';
   *    if (typingUsers.length) text = typingUsers.length + ' users are typing';
   *    if (pausedUsers.length && typingUsers.length) text += ' and ';
   *    if (pausedUsers.length) text += pausedUsers.length + ' users have paused typing';
   *    widget.value = text;
   * };
   * ```
   *
   * Note that as long as you have called `evt.preventDefault()` you can also just directly manipulate child domNodes of `evt.detail.widget`
   * if a plain textual message doesn't suffice.
   *
   * @property {Function} onTypingIndicatorChange
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity[]} evt.detail.typing
   * @param {Layer.Core.Identity[]} evt.detail.paused
   */

  /**
   * Custom handler to use for rendering typing indicators.
   *
   * By calling `evt.preventDefault()` on the event you can provide your own custom typing indicator text to this widget:
   *
   * ```javascript
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
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity[]} evt.detail.typing
   * @param {Layer.Core.Identity[]} evt.detail.paused
   */

  /**
   * This event is triggered whenever the composer value changes.
   *
   * This is not a cancelable event.
   *
   * ```javascript
   * conversationPanel.onComposeBarChangeValue = function(evt) {
   *   this.setState({composerValue: evt.detail.newValue});
   * }
   * ```
   *
   * @property {Function} onComposeBarChangeValue
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {String} evt.detail.newValue
   * @param {String} evt.detail.oldValue
   */
  events: ['layer-send-message', 'layer-typing-indicator-change', 'layer-compose-bar-change-value'],

  properties: {

    // Documented in mixins/has-query.js
    query: {
      set(value) {
        this.nodes.list.query = value;
      },
    },

    /**
     * ID of the Conversation being shown by this panel.
     *
     * This Conversation ID specifies what conversation to render and interact with.
     * This property needs to be changed any time you change to view a different Conversation.
     *
     * Alternative: See Layer.UI.components.ConversationView.conversation property.  Strings however are easier to stick
     * into html and template files.
     *
     * ```
     * function selectConversation(selectedConversation) {
     *   // These two lines are equivalent:
     *   widget.conversation = selectedConversation;
     *   widget.conversationId = selectedConversation.id;
     * }
     * ```
     *
     * @property {String} [conversationId='']
     */
    conversationId: {
      set(value) {
        if (value && value.indexOf('layer:///conversations') !== 0 && value.indexOf('layer:///channels') !== 0) this.properties.conversationId = '';
        if (client) {
          if (this.conversationId) {
            if (client.isReady && !client.isDestroyed) {
              this.conversation = client.getObject(this.conversationId, true);
            } else {
              client.once('ready', () => {
                if (this.conversationId) this.conversation = client.getObject(this.conversationId, true);
              }, this);
            }
          } else {
            this.conversation = null;
          }
        }
      },
    },

    /**
     * Use this to initialize with a specific Conversation ID; value will be ignored after initialization.
     *
     * When to use this? You have set your Conversation View to `listen-to` your Conversation List,
     * but you still want to be able to set an initial conversation.  Any changes to this property
     * will be ignored.
     *
     * @property {String} initialConversationId
     */
    initialConversationId: {
      set(value) {
        if (!this.properties._internalState.onAfterCreateCalled) {
          this.conversationId = value;
        }
      },
    },

    /**
     * The Conversation being shown by this panel.
     *
     * This Conversation specifies what conversation to render and interact with.
     * This property needs to be changed any time you change to view a different Conversation.
     *
     * Alternative: See Layer.UI.components.ConversationView.conversationId property for an easier property to use
     * within html templates.
     *
     * ```
     * function selectConversation(selectedConversation) {
     *   // These two lines are equivalent:
     *   widget.conversationId = selectedConversation.id;
     *   widget.conversation = selectedConversation;
     * }
     * ```
     *
     * @property {Layer.Core.Container}
     */
    conversation: {
      set(value) {
        if (value && !(value instanceof Core.Conversation || value instanceof Core.Channel)) {
          this.properties.conversation = null;
        }
        if (client) this._setupConversation();
      },
    },

    // Docs in mixins/has-query.js; new behavior here is to call _setupQuery to setup an initial Query
    hasGeneratedQuery: {
      type: Boolean,
      set(value) {
        if (value && this.conversation && client) this._setupQuery();
      },
    },

    // Docs in mixins/has-query.js; new behavior here is to call _setupQuery to setup an initial Query
    useGeneratedQuery: {
      set(value) {
        this.nodes.list.useGeneratedQuery = value;
      },
    },

    /**
     * Refocus on the Conversation Panel any time the Conversation ID changes.
     *
     * So, the user clicked on a Conversation in a Conversation List, and focus is no longer on this widget?
     * Automatically refocus on it.
     *
     * Possible values:
     *
     * * Layer.UI.CONSTANTS.FOCUS.ALWAYS
     * * Layer.UI.CONSTANTS.FOCUS.DESKTOP_ONLY
     * * Layer.UI.CONSTANTS.FOCUS.NEVER
     *
     * Note that the definition we'd like to have for desktop-only is any device that automatically opens
     * an on-screen keyboard.  There are no good techniques for that.  But some basic tests will be used
     * to see if it looks like a phone/tablet/touch-screen.
     *
     * @property {String} [autoFocusConversation=desktop-only]
     */
    autoFocusConversation: {
      value: UIConstants.FOCUS.DESKTOP_ONLY,
    },

    /**
     * Function allows for additional dom nodes to be generated and inserted before/after messages
     *
     * ```
     * conversationPanel.onRenderListItem = function(widget, messages) {
     *   var message = widget.item;
     *   if (message.sentAt.toDateString() !== messages[index - 1].sentAt.toDateString()) {
     *     widget.customNodeAbove = document.createElement('hr');
     *     widget.customNodeBelow = document.createElement('hr');
     *   }
     * });
     *
     * var model = message.createModel(); // retrieves existing model
     * if (model.title) {
     *    var separator = document.createElement('div');
     *    separator.innerHTML = model.title;
     *    separator.classList.add('separator');
     *    widget.customNodeAbove = separator;
     * }
     * ```
     *
     * @property {Function} onRenderListItem
     * @property {Layer.UI.components.MessageListPanel.Item} onRenderListItem.widget
     *    One row of the list
     * @property {Layer.Core.Message[]} onRenderListItem.items
     *    full set of messages in the list
     * @property {Number} onRenderListItem.index
     *    index of the message in the items array
     * @property {Boolean} onRenderListItem.isTopItemNew
     *    If the top item is index 0, and its newly added rather than just affected by changes
     *    around it, this is often useful to know.
     */
    onRenderListItem: {
      type: Function,
      set(value) {
        this.nodes.list.onRenderListItem = value;
      },
      get() {
        return this.nodes.list.onRenderListItem;
      },
    },

    /**
     * Provide property to override the function used to render a date for each Message Item.
     *
     * Note that changing this will not rerender the list.
     *
     * ```javascript
     * conversationPanel.dateRenderer = function(date) {
     *    return date.toISOString();
     * };
     * ```
     *
     * @property {Function} [dateRenderer=null]
     * @property {Date} dateRenderer.date
     * @property {String} dateRenderer.return
     */
    dateRenderer: {
      type: Function,
      set(value) {
        this.nodes.list.dateRenderer = value;
      },
    },

    /**
     * Provide property to override the function used to render a date for each Message Item.
     *
     * Note that changing this will not rerender the list.
     *
     * ```javascript
     * conversationPanel.messageStatusRenderer = function(message) {
     *    return message.readStatus === Layer.Constants.RECIPIENT_STATE.ALL ? 'read' : 'processing...';
     * };
     * ```
     *
     * See Layer.Core.Message for more information on the properties available to determine a message's status.
     *
     * @property {Function} [messageStatusRenderer=null]
     * @property {Layer.Core.Message} messageStatusRenderer.message
     * @property {String} messageStatusRenderer.return
     */
    messageStatusRenderer: {
      type: Function,
      set(value) {
        this.nodes.list.messageStatusRenderer = value;
      },
    },

    /**
     * A dom node to render when there are no messages in the list.
     *
     * Could just be a message "Empty Conversation".  Or you can add interactive widgets.
     *
     * ```
     * var div = document.createElement('div');
     * div.innerHTML = 'Empty Conversation';
     * widget.emptyMessageListNode = div;
     * ```
     *
     * @property {HTMLElement} [emptyMessageListNode=null]
     * @removed
     */

    /**
     * A dom node to render when there are no more messages in the Message List.
     *
     * Could just be a message "Top of Conversation".
     *
     * ```
     * var div = document.createElement('div');
     * div.innerHTML = 'Top of Conversation';
     * widget.endOfMessagesNode = div;
     * ```
     *
     * Note that this node is *not* rendered when the list has no messages; see
     * emptyMessageListNode instead.
     *
     * Note that using the default template, this widget may be wrapped in a div with CSS class `layer-header-toggle`,
     * you should insure that they height of this toggle does not change when your custom node is shown.  Set the
     * style height to be at least as tall as your custom node.
     *
     * @property {HTMLElement} [emptyMessageListNode=null]
     * @removed
     */


    /**
     * Provide a function that returns the menu items for each Message Item.
     *
     * > *Note*
     * >
     * > This is called each time the user clicks on a menu button next to a message to open the menu,
     * > but is not dynamic in that it will regenerate the list while its open.
     *
     * Also...
     *
     * > *Note*
     * >
     * > This only works if your `<layer-message-item-sent />` or `<layer-message-item-received />` has a `<layer-menu-button layer-id='menuButton'/>`;
     * > The `layer-id` is required to setup `widget.nodes.menuButton`
     *
     * Format is:
     *
     * ```
     * widget.getMenuItems = function(message) {
     *   return [
     *     {text: "label1", method: method1},
     *     {text: "label2", method: method2},
     *     {text: "label3", method: method3}
     *   ];
     * }
     * ```
     *
     * @property {Function} getMenuItems
     * @property {Layer.Core.Message} getMenuItems.message
     * @property {Object[]} getMenuItems.return
     */
    getMenuItems: {
      type: Function,
      set(value) {
        this.nodes.list.getMenuItems = value;
      },
    },

    /**
     * Date formatter configuration for the Message Items within the Message List.
     *
     * Use this to configure how dates are rendered.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString for details
     * on the parameters that are supported by `toLocaleString`.
     *
     * There are four supported inputs
     *
     * * `today`: How to render dates that are today
     * * `week`: How to render dates that are not today, but within a 6 of today (note if today is
     *   wednesday, 1 week ago is also wednesday, and rendering `wednesday` would be confusing, so its 6 rather than 7 days.
     * * `default`: The default format to use
     * * `older`: The format to use for dates that are in a different year and more than 6 months in the past
     *
     * Example:
     *
     * ```
     * widget.dateFormat = {
     *    today: {"hour": "numeric", "minute": "numeric"},
     *    week: {"weekday": "short"},
     *    default: {"month": "short", "day": "2-digit"},
     *    older: {"month": "short", "year": "numeric"}
     * }
     * ```
     *
     * > *Note*
     * >
     * > This only works if `<layer-message-item-sent />` or `<layer-message-item-received />` has a `<layer-date layer-id='date' />` within it.
     *
     * @property {Object} [dateFormat=]
     * @property {Object} [dateFormat.today={hour: 'numeric', minute: 'numeric'}]
     * @property {Object} [dateFormat.week={ weekday: 'short', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.older={ month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.default={ month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     */
    dateFormat: {
      set() {
        this.nodes.list.dateFormat = this.dateFormat;
      },
    },

    /**
     * An array of buttons (dom nodes) to be added to the Compose bar, right side.
     *
     * ```
     * widget.composeButtons = [
     *     document.createElement('button'),
     *     document.createElement('button')
     * ];
     * ```
     *
     * @property {HTMLElement[]} [composeButtons=[]]
     * @removed
     */

    /**
     * An array of buttons (dom nodes) to be added to the Compose bar, left side.
     *
     * ```
     * widget.composeButtonsLeft = [
     *     document.createElement('button'),
     *     document.createElement('button')
     * ];
     * ```
     *
     * @property {HTMLElement[]} [composeButtonsLeft=[]]
     * @removed
     */

    /**
     * Use this to get/set the text in the Compose bar.
     *
     * ```
     * // Populate the Compose Bar with text
     * widget.composeText = 'This text will appear in the editor within the compose bar';
     * ```
     *
     * @property {String} [composeText='']
     */
    composeText: {
      get() {
        return this.nodes.composer.value;
      },
      set(value) {
        this.nodes.composer.value = value;
      },
    },

    /**
     * Use this to get/set the placeholder text in the Compose bar.
     *
     * ```
     * widget.composePlaceholder = 'Enter a message. Or dont. It really doesnt matter.';
     * ```
     *
     * @property {String} [composePlaceholder='']
     */
    composePlaceholder: {
      get() {
        return this.nodes.composer.placeholder;
      },
      set(value) {
        this.nodes.composer.placeholder = value;
      },
    },

    /**
     * Disable the widget to disable read receipts and other behaviors that may occur while the widget is hidden.
     *
     * ```
     * widget.disable = true;
     * ```
     *
     * @property {Boolean}
     */
    disable: {
      type: Boolean,
      set(value) {
        this.nodes.list.disable = value;
      },
    },

    /**
     * The model to generate a Query for if a Query is not provided.
     *
     * @readonly
     * @private
     * @property {String} [_queryModel=Layer.Core.Query.Message]
     */
    _queryModel: {
      value: Core.Query.Message,
    },

    /**
     * Width of this UI Component.
     *
     * * Should update any time the window resizes.
     * * Should lack a value until its added to the DOM (use `onAttach` lifecycle event to detect this)
     * * *Does not* get updated when panels are reflowed for reasons _other_ than the window resizeing
     *
     * Changes in width will cause a CSS class to be added that is one of:
     *
     * * `layer-conversation-view-width-tiny`: Width is less than 320px (Settings.conversationViewWidths.maxTiny)
     * * `layer-conversation-view-width-small`: Width is less than 480px (Settings.conversationViewWidths.maxSmall)
     * * `layer-conversation-view-width-medium`: Width is between 480 and 600 (Settings.conversationViewWidths.maxSmall - Settings.conversationViewWidths.maxMedium)
     * * `layer-conversation-view-width-large`: Width is greater than or equal to 600 (> (Settings.conversationViewWidths.maxMedium)
     *
     * > *Note*
     * >
     * > Any measure of width by the browser uses Virtual Pixels rather than Actual Pixels.  So,
     * > an 800px wide device may still show up as only 360px wide depending on Viewport and other settings.
     *
     * @property {Number} width
     */
    width: {
      set(newValue, oldValue) {
        this.toggleClass('layer-conversation-view-width-tiny', newValue < conversationViewWidths.maxTiny);
        this.toggleClass('layer-conversation-view-width-small', newValue >= conversationViewWidths.maxTiny && newValue < conversationViewWidths.maxSmall);
        this.toggleClass('layer-conversation-view-width-medium', newValue >= conversationViewWidths.maxSmall && newValue < conversationViewWidths.maxMedium);
        this.toggleClass('layer-conversation-view-width-large', newValue >= conversationViewWidths.maxMedium);
        if (this.nodes.list) this.nodes.list.width = newValue;
      },
    },

    /**
     * Set a filter on the Query.
     *
     * See {@link Layer.Core.Query#filter}.  This removes the data entirely from the Query.
     * Use it for removing items that are non-renderable or should not be rendered.
     *
     * ```
     * widget.queryFilter = function queryFilter(message) {
     *   const model = message.createModel();
     *   return !(model.getModelName() === 'ResponseModel' && !model.displayModel);
     * };
     * ```
     *
     * @property {Function} queryFilter
     * @property {Layer.Core.Message} queryFilter.message
     * @property {Boolean} queryFilter.return
     */
    queryFilter: {
      value: function queryFilter(message) {
        const model = message.createModel();
        return !model || !(model.getModelName() === 'ResponseModel' && !model.displayModel);
      },
    },
  },
  methods: {
    // Lifecycle method; wire up to detect UI Size changes;
    // TODO: make tracking width a Mixin behavior to be shared with other components
    onCreate() {
      this.properties._handleResize = this._handleResize.bind(this);
      window.addEventListener('resize', this.properties._handleResize);
      this.addEventListener('layer-compose-bar-focus', this._adjustForSoftKeyboard.bind(this));
    },

    // onAfterCreate() {
    //   if (this.conversation) this._setupConversation();
    // },

    // Lifecycle method for initializing the width
    onAttach() {
      this.width = this.clientWidth;
    },

    // Cleanup any global event handlers
    onDestroy() {
      window.removeEventListener('resize', this.properties._handleResize);
    },

    _adjustForSoftKeyboard() {
      setTimeout(() => {
        if (this.nodes.list.properties.stuckToBottom) {
          this.nodes.list.scrollToBottom(200);
        }
      }, 250);
    },

    /**
     * Any time there is a change that could impact the width, update the width property.
     *
     * @method _handleResize
     * @private
     */
    _handleResize() {
      this._throttler(this._updateWidth.bind(this));
    },

    /**
     * Update the width property based on browser size changes
     *
     * @method _updateWidth
     * @private
     */
    _updateWidth() {
      this.width = this.clientWidth;
    },

    /**
     * When a key is pressed and text is not focused, focus on the composer.
     *
     * Use a mixin to override this method to prevent this behavior:
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'layer-conversation-view': {
     *        methods: {
     *          onKeyDown: {
     *            mode: Layer.UI.registerComponent.MODES.OVERWRITE,
     *            value: function() {}
     *          }
     *        }
     *     }
     *   }
     * });
     * ```
     *
     * @method onKeyDown
     */
    onKeyDown() {
      this.focusText();
    },

    /**
     * Place focus on the text editor in the Compose bar.
     *
     * ```
     * widget.focusText();
     * ```
     *
     * @method
     */
    focusText() {
      this.nodes.composer.focus();
    },

    /**
     * Send the Message that the user has typed in.
     *
     * ```
     * widget.composeText = "Hello world";
     * widget.send(); // send the current text in the textarea
     * ```
     *
     * @method
     */
    send() {
      this.nodes.composer.send();
    },

    /**
     * Given a Conversation ID and a Client, setup the Composer and Typing Indicator
     *
     * @method _setupConversation
     * @private
     */
    _setupConversation() {
      const conversation = this.properties.conversation;

      // Client not ready yet? retry once authenticated.
      if (client && !client.isReady) {
        client.once('ready', this._setupConversation, this);
        return;
      } else if (!client) {
        return;
      }

      /**
       * Triggered whenever the Conversation is changed (or initialially set).
       *
       * Allows apps to hook into it and update state to match any changes to Conversation.
       *
       * ```
       * document.body.addEventListener('layer-conversation-panel-change', function(evt) {
       *     var newConversation = evt.detail.conversation;
       *     myRenderContentForConversation(newConversation);
       * });
       * ```
       *
       * This event is **not** cancelable.
       *
       * @event layer-conversation-panel-change
       * @param {Event} evt
       * @param {Object} evt.detail
       * @param {Layer.Core.Conversation} evt.detail.conversation
       */
      this.trigger('layer-conversation-panel-change', { conversation });

      this.nodes.list.conversation = conversation;
      this.nodes.composer.conversation = conversation;
      this.nodes.typingIndicators.conversation = conversation;
      this._setupQuery();
      if (this.shouldAutoFocusConversation(navigator)) this.focusText();
    },

    /**
     * Determine if the Conversation should automatically call Layer.UI.components.ConversationView.focusText based on the Layer.UI.components.ConversationView.autoFocusConversation property
     *
     * Typically you would configure the Layer.UI.components.ConversationView.autoFocusConversation property to change behaviors.  However, if using UIConstants.FOCUS.DESKTOP_ONLY
     * and wanting to provide your own definition of whether this is a desktop or not, you can override this method:
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'layer-conversation-view': {
     *        methods: {
     *          shouldAutoFocusConversation: {
     *            mode: Layer.UI.registerComponent.MODES.OVERWRITE,
     *            value: function() {
     *              return false;
     *            }
     *          }
     *       }
     *     }
     *   }
     * });
     * ```
     *
     * @method shouldAutoFocusConversation
     * @param {Object} options
     * @param {Number} options.maxTouchPoints
     * @returns {Boolean}
     */
    shouldAutoFocusConversation({ maxTouchPoints }) {
      switch (this.autoFocusConversation) {
        case UIConstants.FOCUS.ALWAYS:
          return true;
        case UIConstants.FOCUS.DESKTOP_ONLY:
          if (maxTouchPoints !== undefined && maxTouchPoints > 0) return false;
          return !Utils.isMobile;
        case UIConstants.FOCUS.NEVER:
          return false;
      }
      return false;
    },

    /**
     * Setup the generated query; does nothing if Layer.UI.components.ConversationView.hasGeneratedQuery is `false`.
     *
     * @method _setupQuery
     * @private
     */
    _setupQuery() {
      const conversation = this.properties.conversation;
      if (this.hasGeneratedQuery) {
        if (!conversation) {
          this.query.update({
            predicate: '',
          });
        } else if (conversation instanceof Core.Conversation) {
          this.query.update({
            predicate: `conversation.id = "${conversation.id}"`,
          });
        } else if (conversation instanceof Core.Channel) {
          this.query.update({
            predicate: `channel.id = "${conversation.id}"`,
          });
        } else {
          this.query.update({
            predicate: '',
          });
        }
      }
    },
  },
  listeners: {
    'layer-conversation-selected': function conversationSelected(evt) {
      this.conversation = evt.detail.item;
    },
    'layer-notification-click': function notificationClick(evt) {
      const message = evt.detail.item;
      const conversation = message.getConversation();
      if (conversation !== this.conversation) this.conversation = conversation;
    },
    'layer-message-notification': function messageNotification(evt) {
      // If the notification is not background, and we have toast notifications enabled, and message isn't in the selected conversation,
      // to a toast notify
      if (!evt.detail.isBackground &&
        evt.detail.item.conversationId === this.conversation.id &&
        evt.target.notifyInForeground === 'toast') {
        evt.preventDefault();
      }
    },
  },
});
