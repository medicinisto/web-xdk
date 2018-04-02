/**
 * The Layer Conversation List widget renders a scrollable, pagable list of Conversations or Channels.
 *
 * This Component can be added to your project directly in the HTML file:
 *
 * ```
 * <layer-conversation-list></layer-conversation-list>
 * ```
 *
 * Or via DOM Manipulation:
 *
 * ```javascript
 * var conversation = document.createElement('layer-conversation-list');
 * ```
 *
 * And then its properties can be set as:
 *
 * ```javascript
 * var list = document.querySelector('layer-conversation-list');
 * list.onConversationSelected = function(evt) {
 *    alert(evt.detail.item.id + ' has been selected');
 * }
 * ```
 *
 * ## Common Properties
 *
 * * Layer.UI.components.ConversationListPanel.List.onConversationSelected: Set a function to be called whenever a
 *   Layer.Core.Conversation is selected
 * * Layer.UI.components.ConversationListPanel.List.selectedId: Get/Set the Selected Conversation ID
 *
 * ## Listens For
 *
 * Using the `listensFor` property, this widget will listen to a Layer.UI.components.Notifier when it triggers a
 * `layer-notification-click` event, and will update the `selectedId` and select the Conversation associated with
 * that notification.
 *
 * ```
 * <layer-notifier id='nodeA'></layer-notifier>
 * <layer-conversation-list listen-to="nodeA"></layer-conversation-list>
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. To import pick one:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-conversation-list';
 * import '@layerhq/web-xdk/ui/components/layer-conversation-list/layer-conversation-list';
 * ```
 *
 * @class Layer.UI.components.ConversationListPanel.List
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.List
 * @mixin Layer.UI.mixins.ListSelection
 * @mixin Layer.UI.mixins.ListLoadIndicator
 * @mixin Layer.UI.mixins.EmptyList
 * @mixin Layer.UI.mixins.SizeProperty
 * @mixin Layer.UI.mixins.QueryEndIndicator
 */
import Core from '../../../core';
import UIConstants from '../../constants';
import { registerComponent } from '../component';
import List from '../../mixins/list';
import ListLoadIndicator from '../../mixins/list-load-indicator';
import ListSelection from '../../mixins/list-selection';
import SizeProperty from '../../mixins/size-property';
import EmptyList from '../../mixins/empty-list';
import QueryEndIndicator from '../../mixins/query-end-indicator';
import RCUtils from '../../ui-utils/replaceable-content-utils';

registerComponent('layer-conversation-list', {
  mixins: [List, ListSelection, ListLoadIndicator, SizeProperty, EmptyList, QueryEndIndicator],
  template: `
    <div class='layer-list-meta' layer-id='listMeta'>
      <!-- Rendered when the list is empty -->
      <layer-replaceable-content layer-id='emptyNode' class='layer-empty-list' name='emptyNode'>
        No Conversations yet
      </layer-replaceable-content>

      <div class='layer-header-toggle'>

        <!-- Rendered when there are no more results to page to -->
        <layer-replaceable-content
          layer-id='endOfResultsNode'
          class='layer-end-of-results-indicator'
          name='endOfResultsNode'>
        </layer-replaceable-content>

        <!-- Rendered when waiting for server data -->
        <layer-replaceable-content
          layer-id='loadIndicator'
          class='layer-load-indicator'
          name='loadIndicator'>
          <layer-loading-indicator></layer-loading-indicator>
        </layer-replaceable-content>
      </div>
    </div>
  `,
  style: `
    layer-conversation-list {
      overflow-y: auto;
      display: block;
    }
    layer-conversation-list:not(.layer-loading-data) .layer-load-indicator {
      display: none;
    }
  `,

  /**
   * Configure a custom action when a Conversation is selected;
   *
   * Use `evt.preventDefault()` to prevent default handling from occuring.
   *
   * ```javascript
   *    document.body.addEventListener('layer-conversation-selected', function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to select this conversation:
   *      evt.preventDefault();
   *    });
   * ```
   *
   * OR
   *
   * ```javascript
   *    converationList.onConversationSelected = function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to select this conversation:
   *      evt.preventDefault();
   *    });
   * ```
   *
   * @property {Function} onConversationSelected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Conversation} evt.detail.item   The selected Conversation
   * @param {Event} evt.detail.originalEvent            The click event that selected the Conversation
   */

  /**
   * See Layer.UI.components.ConversationListPanel.List.onConversationSelected for usage.
   *
   * @event layer-conversation-selected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Conversation} evt.detail.item   The selected Conversation
   * @param {Event} evt.detail.originalEvent            The click event that selected the Conversation
   */

  /**
   * The user has clicked to delete a conversation.
   *
   * ```javascript
   *    conversationListNode.onConversationDeleted = function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to delete this conversation (perhaps you want
   *      // to leave the Conversation instead of delete it):
   *      evt.preventDefault();
   *      conversation.leave();
   *    };
   * ```
   *
   *  OR
   *
   * ```javascript
   *    document.body.addEventListener('layer-conversation-deleted', function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to delete this conversation (perhaps you want
   *      // to leave the Conversation instead of delete it):
   *      evt.preventDefault();
   *      conversation.leave();
   *    });
   * ```
   *
   * @property {Function} onConversationDeleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Conversation} evt.detail.item
   * @removed
   */

  /**
   * See Layer.UI.components.ConversationListPanel.List.onConversationDeleted.
   *
   * @event layer-conversation-deleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Conversation} evt.detail.item
   * @removed
   */

  events: ['layer-conversation-selected'],
  properties: {

    /**
     * Get/Set the Conversation shown as selected in the list using the Conversation ID.
     *
     * @property {String} [selectedConversationId='']
     * @deprecated see Layer.UI.components.ConversationListPanel.List.ListSelection.selectedId
     */
    selectedConversationId: {
      set(value) {
        this.selectedId = value;
      },
      get() {
        return this.selectedId;
      },
    },

    /**
     * Function allows for control over which Conversations can be deleted and which can not.
     *
     * Return true means enabled, false is disabled.
     *
     *  ```javascript
     * conversationPanel.deleteConversationEnabled = function(conversation) {
     *     return conversation.metadata.category !== 'adminStuff';
     * });
     * ```
     *
     * If delete is enabled, the Layer.UI.components.misc.Delete.enabled property is changed, causing
     * the `layer-delete-enabled` css class to be added/removed on that widget.
     *
     * @property {Function} [deleteConversationEnabled=null]
     * @property {Layer.Core.Conversation} deleteConversationEnabled.conversation
     * @property {Boolean} deleteConversationEnabled.return
     * @removed
     */

    /**
     * The model to generate a Query for if a Query is not provided.
     *
     * @readonly
     * @private
     * @property {String} [_queryModel=Layer.Core.Query.Conversation]
     */
    _queryModel: {
      value: Core.Query.Conversation,
    },

    /**
     * Sort by takes as value `lastMessage` or `createdAt`; for initialization only.
     *
     * This will not resort your list after initialization; use `list.query.update()` for that.
     *
     * @property {String} [sortBy=lastMessage]
     */
    sortBy: {
      order: -1, // needs to fire before appId and client are set
      value: UIConstants.CONVERSATIONS_SORT.LAST_MESSAGE,
      set(value) {
        switch (value) {
          case UIConstants.CONVERSATIONS_SORT.LAST_MESSAGE:
            this.properties.sortBy = [{ 'lastMessage.sentAt': 'desc' }];
            break;
          default:
            this.properties.sortBy = [{ createdAt: 'desc' }];
        }
      },
    },

    /**
     * The event name to trigger on selecting a Conversation.
     *
     * @readonly
     * @private
     * @property {String} [_selectedItemEventName=layer-conversation-selected]
     */
    _selectedItemEventName: {
      value: 'layer-conversation-selected',
    },

    /**
     * Provide a function to determine if the last message is rendered in the Conversation List.
     *
     * By default, only text/plain last-messages are rendered in the Conversation List.
     *
     * ```javascript
     * list.canFullyRenderLastMessage = function(message) {
     *     return message.parts[0].mimeType === 'text/mountain' ||
     *            message.parts[0].mimeType === 'text/plain';
     * }
     * ```
     *
     * If you enable rendering of images for example, you would be enabling the handler that renders image messages
     * in the Message List to render that same image in the Conversation List.
     *
     * If you prevent rendering of a Message, it will instead render the `label` attribute for that message handler;
     * see Layer.UI.handlers.message.register for more info on the `label`.
     *
     * TODO: Should test to see what handler is returned rather than testing the mimeType
     *
     * @property {Function} canFullyRenderLastMessage
     * @removed
     */


    /**
     * Provide a function that returns the menu items for the given Conversation.
     *
     * Note that this is called each time the user clicks on a menu button to open the menu,
     * but is not dynamic in that it will regenerate the list as the Conversation's properties change.
     *
     * Format is:
     *
     * ```
     * widget.getMenuItems = function(conversation) {
     *   return [
     *     {text: "label1", method: method1},
     *     {text: "label2", method: method2},
     *     {text: "label3", method: method3}
     *   ];
     * }
     * ```
     *
     * @property {Function} getMenuItems
     * @property {Layer.Core.Conversation} getMenuItems.conversation
     * @property {Object[]} getMenuItems.return
     */
    getMenuItems: {
      type: Function,
    },

    /**
     * This iteration of this property is not dynamic; it will be applied to all future Conversation Items,
     * but not to the currently generated items.
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
     * @property {Object}
     */
    dateFormat: {},

    // See Layer.UI.mixins.SizeProperty.size
    size: {
      value: 'large',
      set(size) {
        for (let i = 0; i < this.childNodes.length; i++) {
          this.childNodes[i].size = size;
        }
      },
    },

    // See Layer.UI.mixins.SizeProperty.supportedSizes
    supportedSizes: {
      value: ['tiny', 'small', 'medium', 'large'],
    },

    /**
     * Provide a hash of DOM generation functions to insert custom content into.
     *
     * The Conversation List supports the following Content Areas:
     *
     * * conversationRowLeftSide: Nodes that appear to the left of each Conversation Item; defaults to rendering an Avatar or Presence widget.
     * * conversationRowRightSide: Nodes that appear to the right of each Conversation Item; defaults to rendering a Menu Button
     * * loadIndicator: Node for rendering the fact that Conversations are loading
     * * emptyNode: Node for rendering the fact that there are no Conversations for this user
     * * endOfReultsNode: Node for rendering that we have scrolled to the end of the Conversations from the server
     *
     * @property {Object} replaceableContent
     */
    replaceableContent: {
      value: {
        conversationRowLeftSide(widget) {
          const div = document.createElement('div');
          const avatar = document.createElement('layer-avatar');
          avatar.setAttribute('layer-id', 'avatar');
          avatar.size = this.size;
          const presence = document.createElement('layer-presence');
          presence.setAttribute('layer-id', 'presence');
          presence.size = 'medium';
          const groupCounter = document.createElement('div');
          groupCounter.classList.add('layer-group-counter');
          groupCounter.setAttribute('layer-id', 'groupCounter');
          div.appendChild(avatar);
          div.appendChild(presence);
          div.appendChild(groupCounter);
          return div;
        },
        conversationRowRightSide: RCUtils.conversationAge + RCUtils.menuNode,
      },
    },
  },
  methods: {
    /**
     * Generate a Layer.UI.components.ConversationListPanel.Item.Conversation widget.
     *
     * @method _generateItem
     * @private
     * @param {Layer.Core.Conversation} conversation
     */
    _generateItem(conversation) {
      const isChannel = Core.Channel && conversation instanceof Core.Channel;
      const conversationWidget = document.createElement(`layer-${isChannel ? 'channel' : 'conversation'}-item`);
      conversationWidget.id = this._getItemId(conversation.id);
      conversationWidget.item = conversation;
      conversationWidget.size = this.size;
      if (this.getMenuItems) conversationWidget.getMenuItems = this.getMenuItems;
      if (this.dateFormat) conversationWidget.dateFormat = this.dateFormat;

      if (this.filter) conversationWidget._runFilter(this.filter);
      return conversationWidget;
    },
  },
  listeners: {
    'layer-notification-click': function notificationClick(evt) {
      const message = evt.detail.item;
      const conversation = message.getConversation();
      if (conversation) this.selectedId = conversation.id;
    },
  },
});
