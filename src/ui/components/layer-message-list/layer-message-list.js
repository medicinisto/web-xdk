/**
 * The Layer Message List widget renders a scrollable, pagable list of Layer.UI.components.MessageListPanel.Item widgets.
 *
 * This is designed to go inside of the Layer.UI.Conversation widget.
 *
 * This Component has three named templates:
 *
 * * `layer-message-item-sent`: Rendering for Messages sent by the owner of this Session
 * * `layer-message-item-received`: Rendering for Messages sent by other users
 * * `layer-message-item-status`: Rendering for Messages sent as Status Messages
 *
 * Messages are organized into sets where a set starts with the first message from a given user, and ends when either
 * a different user sends a Message, or a long enough pause occurs.  Each Message will have firstInSeries/lastInSeries properties,
 * and these need to be maintained as new Messages are loaded, deleted, etc...
 *
 * ## Customization
 *
 * The `replaceableContent` property supports most basic customization.
 *
 * Each Layer.UI.components.MessageListPanel.Item can be customized this way as documented on the Item page.
 *
 * Any `replaceableContent` setup provided to the List will be passed onto the items.  In addition, the following
 * replaceableContent is supported for this list:
 *
 * * `emptyNode`: Shown to indicate that there are no messages in this conversation
 * * `endOfResultsNode`: Shown to indicate that the first message in the conversation has been reached; may be used to
 *   render something like "Welcome to the start of the Conversation"
 * * `loadIndicator`: Shown to indicate that we are fetching more messages from the server
 *
 * Typically these are all set on the Layer.UI.components.ConversationView which passes them down to this List:
 *
 * ```
 * conversationView.replaceableContent = {
 *     emptyNode: function(listWidget) {
 *        var div = document.createElement('div');
 *        div.innerHTML = 'if you want to see the messages you first need to have messages!';
 *        return div;
 *     }
 * };
 * ```
 *
 * ## Advanced Customization
 *
 * To enhance the Message List widget with new properties, methods and capabilities, you have can add Mixins.
 *
 *
 * The following example adds a search bar to the Message List
 *
 * ```
 * Layer.UI.init({
 *   mixins: {
 *     'layer-message-list': {
 *       properties: {
 *         searchText: {
 *           value: '',
 *           set: function(value) {
 *             this.nodes.searchBar.value = value;
 *             this._runSearch();
 *           },
 *           get: function() {
 *             return this.nodes.searchBar.value;
 *           }
 *         }
 *       },
 *       methods: {
 *         // When the widget is created, setup/initialize our custom behaviors
 *         onCreate: function() {
 *           this.nodes.searchBar = document.createElement('input');
 *           this.nodes.searchBar.classList.add('custom-search-bar');
 *           this.nodes.searchBar.addEventListener('change', this._runSearch.bind(this));
 *           this.insertBefore(this.nodes.searchBar, this.nodes.listMeta.firstChild);
 *         },
 *
 *
 *         // Whenver any messages are added/removed/changed, rerun our search
 *         onRerender: function() {
 *           if (this.searchText) this._runSearch();
 *         },
 *
 *         // Search is run whenver the user changes the search text, app changes the search text,
 *         // or new messages arrive that need to be searched
 *         _runSearch() {
 *           var searchText = this.searchText;
 *           Array.prototype.slice.call(this.childNodes).forEach(function(messageItem) {
 *             if (messageItem._isListItem) {
 *               var message = messageItem.item;
 *               const textPart = message.filterParts(part => part.mimeType === Layer.Constants.STANDARD_MIME_TYPES.TEXT)[0];
 *               if (textPart && JSON.parse(textPart.body).text.indexOf(searchText) === -1) {
 *                 messageItem.classList.remove('search-matches');
 *               } else {
 *                 messageItem.classList.add('search-matches');
 *               }
 *             }
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
 * import '@layerhq/web-xdk/ui/components/layer-message-list/layer-message-list';
 * ```
 *
 * @class Layer.UI.components.MessageListPanel.List
 * @extends Layer.UI.Component
 *
 * @mixin Layer.UI.mixins.HasQuery
 * @mixin Layer.UI.mixins.EmptyList
 * @mixin Layer.UI.mixins.List
 * @mixin Layer.UI.mixins.ListLoadIndicator
 * @mixin Layer.UI.mixins.QueryEndIndicator
 */
import { defer, generateUUID, logger } from '../../../utils';
import Settings, { client } from '../../../settings';
import StatusMessageManager from '../../ui-utils/status-message-manager';
import MessageHandlers from '../../handlers/message/message-handlers';
import UIUtils from '../../ui-utils';
import { animatedScrollTo } from '../../ui-utils/animated-scroll';
import { registerComponent } from '../component';
import List from '../../mixins/list';
import HasQuery from '../../mixins/has-query';
import EmptyList from '../../mixins/empty-list';
import ListLoadIndicator from '../../mixins/list-load-indicator';
import QueryEndIndicator from '../../mixins/query-end-indicator';

// Mandatory delay between loading one page and the next.  If user is scrolling too fast, they'll have to wait at least (2) seconds.
const PAGING_DELAY = 2000;

registerComponent('layer-message-list', {
  mixins: [List, HasQuery, EmptyList, ListLoadIndicator, QueryEndIndicator],
  template: `
    <!-- The List Header contains a collection of special nodes that may render at the top of the list for
    different conditions -->
    <div class='layer-list-meta' layer-id='listMeta'>

      <!-- Rendered when the list is empty -->
      <layer-replaceable-content
        layer-id='emptyNode'
        class='layer-empty-list'
        name='emptyNode'>
      </layer-replaceable-content>

      <div class='layer-header-toggle'>

        <!-- Rendered when there are no more results to page to -->
        <layer-replaceable-content
          layer-id='endOfResultsNode'
          class='layer-end-of-results-indicator'
          name='endOfResultsNode'>
          <layer-start-of-conversation layer-id='startOfConversation'></layer-start-of-conversation>
        </layer-replaceable-content>

        <!-- Rendered when waiting for server data -->
        <layer-replaceable-content layer-id='loadIndicator' class='layer-load-indicator' name='loadIndicator'>
          <layer-loading-indicator></layer-loading-indicator>
        </layer-replaceable-content>
      </div>
    </div>
  `,
  style: `
    layer-message-list {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      height: 100px; /* flexbox bug */
      padding-bottom: 15px;
      overflow-x: hidden;
      overflow-y: scroll; /* has to be scroll, not auto */
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    layer-message-list > .layer-message-item {
      flex-shrink: 0;
    }

    layer-message-list:not(.layer-loading-data) .layer-load-indicator,
    layer-message-list:not(.layer-end-of-results) .layer-end-of-results-indicator {
      display: none;
    }
    layer-message-list > .layer-list-meta {
      flex-grow: 1;
    }
  `,
  properties: {

    /**
     * Supplemental property which helps drive the welcome message.
     *
     * This property is not used by this Component, but any child components (such as those added
     * using `replaceableContent` AND which have a `layer-id` attribute will have this value passed to them
     * whenever it is changed.  Typically this is used to provide the Layer.Core.Conversation to the
     * `<layer-start-of-conversation />` widget.
     *
     * @property {Layer.Core.Conversation} conversation
     */
    conversation: {
      propagateToChildren: true,
    },

    /**
     * @inheritdoc Layer.UI.components.ConversationView#dateRenderer
     *
     * @property {Function} [dateRenderer=null]
     * @property {Date} dateRenderer.date
     * @property {String} dateRenderer.return
     */
    dateRenderer: {},

    /**
     * @inheritdoc Layer.UI.components.ConversationView#messageStatusRenderer
     *
     * @property {Function} [messageStatusRenderer=null]
     * @property {Layer.Core.Message} messageStatusRenderer.message
     * @property {String} messageStatusRenderer.return
     */
    messageStatusRenderer: {},

    /**
     * @inheritdoc Layer.UI.components.ConversationView#dateFormat
     *
     * @property {Object} [dateFormat=]
     * @property {Object} [dateFormat.today={hour: 'numeric', minute: 'numeric'}]
     * @property {Object} [dateFormat.week={ weekday: 'short', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.older={ month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.default={ month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     */
    dateFormat: {
      value: {
        today: { hour: 'numeric', minute: 'numeric' },
        week: { weekday: 'short', hour: 'numeric', minute: 'numeric' },
        older: { month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' },
        default: { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
      },
    },

    /**
     * @inheritdoc Layer.UI.components.ConversationView#getMenuItems
     *
     * @property {Function} getMenuItems
     * @property {Layer.Core.Message} getMenuItems.message
     * @property {Object[]} getMenuItems.return
     */
    getMenuItems: {
      type: Function,
    },

    /**
     * Disable read receipts and other behaviors; typically used when the widget has been hidden from view.
     *
     * ```
     * widget.disable = true;
     * ```
     *
     * @property {Boolean} disable
     */
    disable: {
      set(value) {
        if (!value) {
          this.properties.stuckToBottom = true;
          this.scrollTo(this.scrollHeight - this.clientHeight);
          this._checkVisibility();
        }
      },
    },

    /**
     * If the user scrolls within this many screen-fulls of the top of the list, page the Query.
     *
     * If value is 0, will page once the user reaches the top.  If the value is 0.5, will page once the user
     * reaches a `scrollTop` of 1/2 `clientHeight`.
     *
     * @property {Number} [screenFullsBeforePaging=2.0]
     */
    screenFullsBeforePaging: {
      value: 2.0,
    },

    /**
     * Use this property to tell this View what its width is.
     *
     * This is not used to set its actual width, but rather to tell it when its been resized so it can
     * do any neccesssary recalculations.  Typically this is set directly via {@link Layer.UI.components.ConversationView#width}.
     *
     * @property {Number} width
     */
    width: {
      set(newValue, oldValue) {
        this._updateShowingAvatars();
        this.onMessageWidthChange();
      },
    },

    /**
     * Control whether or not the Message List is allowed to show the current user's avatars.
     *
     * @property {Boolean} [canShowMyAvatars=true]
     */
    canShowMyAvatars: {
      type: Boolean,
      value: true,
      set(value) {
        this._updateShowingAvatars();
      },
    },

    /**
     * Control whether or not the Message List is allowed to show other participant's avatars.
     *
     * @property {Boolean} [canShowOtherAvatars=true]
     */
    canShowOtherAvatars: {
      type: Boolean,
      value: true,
      set(value) {
        this._updateShowingAvatars();
      },
    },

    /**
     * Hides the current user's Avatars within the Message List
     *
     * @property {Boolean} _showMyAvatars
     * @private
     */
    _showMyAvatars: {
      set(value) {
        this.toggleClass('layer-message-list-show-my-avatars', value);
        this.onMessageWidthChange();
      },
    },

    /**
     * Hides Avatars of all other users within the Message List
     *
     * @property {Boolean} _showOtherAvatars
     * @private
     */
    _showOtherAvatars: {
      set(value) {
        this.toggleClass('layer-message-list-show-other-avatars', value);
        this.onMessageWidthChange();
      },
    },

    /**
     * Margin for indenting each message's header/footer text for messages that I have sent and which have my Avatar
     *
     * @property {Number} marginWithMyAvatar
     */
    marginWithMyAvatar: {
      value: 52,
      set() {
        this._scheduleRegenerateStyles();
      },
    },

    /**
     * Margin for indenting each message's header/footer text for messages that I have sent and which my Avatar is hidden
     *
     * @property {Number} marginWithoutMyAvatar
     */
    marginWithoutMyAvatar: {
      value: 12,
      set() {
        this._scheduleRegenerateStyles();
      },
    },

    /**
     * Margin for indenting each message's header/footer text for messages that I have received and which have the sender's Avatar
     *
     * @property {Number} marginWithOtherAvatar
     */
    marginWithOtherAvatar: {
      value: 52,
      set() {
        this._scheduleRegenerateStyles();
      },
    },

    /**
     * Margin for indenting each message's header/footer text for messages that I have received and which the sender's Avatar is hidden
     *
     * @property {Number} marginWithoutOtherAvatar
     */
    marginWithoutOtherAvatar: {
      value: 12,
      set() {
        this._scheduleRegenerateStyles();
      },
    },
  },
  methods: {
    // Lifecycle method sets up intial properties and events
    onCreate() {
      if (!this.id) this.id = 'messagelist_' + generateUUID().replace(/-/g, '_');

      // Init some local props
      this.properties.lastPagedAt = 0;
      this.properties.isSelfScrolling = false;
      this.properties.stuckToBottom = true;
      this.properties._checkVisibilityBound = this._checkVisibility.bind(this);

      window.addEventListener('focus', this.properties._checkVisibilityBound);
      this.addEventListener('message-width-change', this.onMessageWidthChange.bind(this));
    },


    /**
     * Cleanup all pointers to self created by registering event handlers.
     *
     * @method onDestroy
     */
    onDestroy() {
      if (this.properties._stylesNode) {
        document.head.removeChild(this.properties._stylesNode);
        this.properties._stylesNode = null;
      }

      window.removeEventListener('focus', this.properties._checkVisibilityBound);
    },

    /**
     * Builds and rebuilds a `style` tag with margins setup for message items of this Message List.
     *
     * Why not use style sheets? Because these are pretty common values that needs to be setup,
     * and we wanted it front and center in our API to have them setup.
     *
     * Furthermore, these values may vary from Message List to Message List even within a single app, such that
     * any theming engine would struggle to distinguish between the different message lists.
     *
     * @method _scheduleRegenerateStyles
     * @private
     */
    _scheduleRegenerateStyles() {
      if (!this.properties._regenerateStylesPending) {
        this.properties._regenerateStylesPending = true;

        // Defer so that if multiple property changes are being made, they can be applied all at once
        defer(() => {
          this.properties._regenerateStylesPending = false;
          if (!this.properties._stylesNode) {
            this.properties._stylesNode = document.createElement('style');
          }
          const styles = this.properties._stylesNode;
          styles.innerHTML = this.generateStyles();

          if (!document.body.contains(styles)) document.head.appendChild(styles);
        });
      }
    },

    /**
     * Method for generating the styles specific to this Message List.
     *
     * Override this method using a mixin to change the behavivors
     *
     * @method generateStyles
     * @protected
     */
    generateStyles() {
      return `
        /* Generated styles for one message list */
        #${this.id}.layer-message-list-show-my-avatars layer-message-item-sent.layer-list-item-first
        .layer-message-header,
        #${this.id}.layer-message-list-show-my-avatars layer-message-item-sent.layer-list-item-last
        .layer-message-footer {
          margin-right: ${this.marginWithMyAvatar}px;
        }
        #${this.id}:not(.layer-message-list-show-my-avatars) layer-message-item-sent.layer-list-item-first
        .layer-message-header,
        #${this.id}:not(.layer-message-list-show-my-avatars) layer-message-item-sent.layer-list-item-last
        .layer-message-footer {
          margin-right: ${this.marginWithoutMyAvatar}px;
        }
        #${this.id}.layer-message-list-show-other-avatars layer-message-item-received.layer-list-item-first
        .layer-message-header,
        #${this.id}.layer-message-list-show-other-avatars layer-message-item-received.layer-list-item-last
        .layer-message-footer {
          margin-left: ${this.marginWithOtherAvatar}px;
        }
        #${this.id}:not(.layer-message-list-show-other-avatars) layer-message-item-received.layer-list-item-first
        .layer-message-header,
        #${this.id}:not(.layer-message-list-show-other-avatars) layer-message-item-received.layer-list-item-last
        .layer-message-footer {
          margin-left: ${this.marginWithoutOtherAvatar}px;
        }
     `;
    },

    /**
     * Avatars are showing if `canShowXXXAvatars` is true and if the width is sufficient
     *
     * @method _updateShowingAvatars
     * @private
     */
    _updateShowingAvatars() {
      this._showMyAvatars = this.canShowMyAvatars && this.width >= Settings.conversationViewWidths.maxSmall;
      this._showOtherAvatars = this.canShowOtherAvatars && this.width >= Settings.conversationViewWidths.maxTiny;
    },

    /**
     * Tests to see if we should load a new page of data.
     *
     * 1. Tests scrollTop to see if we are close enough to the top
     * 2. Tests if we are already loading that page of data
     *
     * @method _shouldPage
     * @return {Boolean}
     * @private
     */
    _shouldPage() {
      const pagingHeight = Math.max(this.clientHeight, 300) * this.screenFullsBeforePaging;
      return this.scrollTop <= pagingHeight && this.scrollHeight > this.clientHeight + 1 && !this.isDataLoading;
    },

    /**
     * Handler is called whenever the list is scrolled.
     *
     * Scrolling is caused by user activity, OR by setting the `scrollTop`.
     * Typically, we want to stay `stuckToButton` so that any time new Messages arrive,
     * we scroll to the bottom to see them.  Any user scrolling however may disable that behavior.
     *
     * @method _handleScroll
     * @private
     */
    _handleScroll: {
      mode: registerComponent.MODES.OVERWRITE,
      value() {
        // Calls to scrollTo() are automatically followed by calls to _checkVisibility() so skip this
        if (this.properties.isSelfScrolling) return;

        // If the user has scrolled within screenFullsBeforePaging of the top of the page...
        // and if the page has enough contents to actually
        // be scrollable, page the Messages.
        if (this._shouldPage() && !this.properties.delayedPagingTimeout) {
          if (this.properties.lastPagedAt + PAGING_DELAY < Date.now()) {
            if (!this.query.isFiring) {
              this.query.update({ paginationWindow: this.query.paginationWindow + 50 });
              this.isDataLoading = this.properties.query.isFiring;
            }
          } else if (!this.properties.delayedPagingTimeout) {
            // User is scrolling kind of fast, lets slow things down a little
            this.properties.delayedPagingTimeout = setTimeout(() => {
              this.query.update({ paginationWindow: this.query.paginationWindow + 50 });
              this.isDataLoading = this.properties.query.isFiring;
              this.properties.delayedPagingTimeout = 0;
            }, 500);
          }
        }

        // If we have scrolled to the bottom/away from bottom (or are approximately at the bottom), update stuckToBottom.
        const stuckToBottom = this.scrollHeight - 50 <= this.clientHeight + this.scrollTop;
        if (stuckToBottom !== this.properties.stuckToBottom && !this.properties.inPagedData) {
          this.properties.stuckToBottom = stuckToBottom;
        }

        // Trigger checks on visibility to update read state
        this._checkVisibility();
      },
    },

    /**
     * Scroll the list to the specified Y position in pixels.
     *
     * Will call _checkVisibility() when done.
     *
     * ```
     * widget.scrollTo(500);
     * ```
     *
     * See also:
     *
     * * #scrollToItem
     * * #animatedScrollTo
     *
     * @method scrollTo
     * @param {Number} position
     */
    scrollTo: {
      mode: registerComponent.MODES.OVERWRITE,
      value(position) {
        if (position === this.scrollTop) return;
        this.properties.isSelfScrolling = true;
        this.scrollTop = position;
        setTimeout(() => {
          this.properties.isSelfScrolling = false;
          this._checkVisibility();
        }, 200);
      },
    },

    /**
     * Scrolls the list to the specified Y position.
     *
     * Will call _checkVisibility() when done.
     *
     * ```
     * widget.animatedScrollTo(500);
     * ```
     *
     * @method animatedScrollTo
     * @param {Number} position            Pixels from top of list to scroll to
     * @param {Number} [animateSpeed=200]  Number of miliseconds of animated scrolling; 0 for no animation
     * @param {Function} [animateCallback] Function to call when animation completes
     */
    animatedScrollTo: {
      mode: registerComponent.MODES.OVERWRITE,
      value(position, animateSpeed = 200, animateCallback) {
        if (position === this.scrollTop) return;
        this.properties.isSelfScrolling = true;
        if (this.properties.cancelAnimatedScroll) this.properties.cancelAnimatedScroll();
        const cancel = this.properties.cancelAnimatedScroll =
          animatedScrollTo(this, position, animateSpeed, () => {
            // Wait for any onScroll events to trigger before we clear isSelfScrolling and procede
            setTimeout(() => {
              if (cancel !== this.properties.cancelAnimatedScroll) return;
              this.properties.cancelAnimatedScroll = null;

              this.properties.isSelfScrolling = false;
              this._checkVisibility();
              if (animateCallback) animateCallback();
            }, 100);
          });
      },
    },

    /**
     * Check which Messages are fully visible, and mark them as Read.
     *
     * TODO PERFORMANCE: Should be able to skip to the visible items and near-visible items without iterating over entire list
     *
     * NOTE: Only mark messages as read if the document has focus.  Just being visible but not in focus does not give us
     * sufficient cause to assume the user has read it.
     *
     * TODO: At some point we may need to customize whether document.hasFocus() is required; in particular, this could cause problems for anyone
     * running in an iFrame.  Is top.document.hasFocus() a suitable solution, or are there scenarios where top might not even be accessable due to
     * being a different domain?
     *
     * @method _checkVisibility
     * @private
     */
    _checkVisibility() {
      if (this.disable) return;

      const children = Array.prototype.slice.call(this.childNodes);
      children.filter(item => item.tagName !== 'DIV').forEach((child, index) => {
        if (child.properties && child.properties.item && this._isVisibleEnoughToMarkAsRead(child)) {
          // TODO: Use a scheduler rather than many setTimeout calls
          if (!UIUtils.isInBackground() && !child.properties.item.isRead) {
            setTimeout(() => this._markAsRead(child), Settings.markReadDelay);
          }

          // Minus 1 allows this to fire while `isRead` is still `false` so that analytics knows its a message
          // about to be marked as read rather than one marked as read "some time ago"
          setTimeout(() => this._reportAnalytics(child), Settings.markReadDelay - 1);
        }
      }, this);
    },

    /**
     * Tests to see if the specified Message Item be marked as read
     *
     * @method _shouldMarkAsRead
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item} child
     * @returns {Boolean}
     */
    _shouldMarkAsRead(child) {
      if (UIUtils.isInBackground() || this.disable) return false;

      return this._isVisibleEnoughToMarkAsRead(child);
    },

    /**
     * Tests to see if the specified Message Item is visible enough to be marked as read.
     *
     * Note that this can return true even for messages that are already read.
     *
     * @method _isVisibleEnoughToMarkAsRead
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item} child
     * @returns {Boolean}
     */
    _isVisibleEnoughToMarkAsRead(child) {
      if (this.disabled) return false;

      const errorMargin = 10;
      const topVisiblePixel = this.scrollTop;
      const bottomVisiblePixel = this.scrollTop + this.clientHeight;
      const childTopVisiblePixel = child.offsetTop - this.offsetTop;
      const childBottomVisiblePixel = childTopVisiblePixel + child.clientHeight;
      const isTooBig = child.clientHeight + 50 > this.clientHeight;

      const isChildTopVisible = childTopVisiblePixel + errorMargin >= topVisiblePixel &&
        childTopVisiblePixel < bottomVisiblePixel;
      const isChildBottomVisible = childBottomVisiblePixel <= bottomVisiblePixel + errorMargin &&
        childTopVisiblePixel < bottomVisiblePixel;

      return (isChildTopVisible && isChildBottomVisible || isTooBig && (isChildBottomVisible || isChildTopVisible));
    },

    /**
     * Mark a the Message associated with this item as read.
     *
     * This method validates that the Message flagged as ready to be read by #_checkVisibility is
     * in fact still fully visible after the delay.
     *
     * @method _markAsRead
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item} child
     */
    _markAsRead(child) {
      if (this._shouldMarkAsRead(child)) {
        child.properties.item.isRead = true;
      }
    },

    /**
     * Any message that has been scrolled into view for at least 2.5 seconds should be reported as visible to analytics engines.
     *
     * @method _reportAnalytics
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item} child
     */
    _reportAnalytics(child) {
      if (this._isVisibleEnoughToMarkAsRead(child)) {
        client._triggerAsync('analytics', {
          type: 'message-viewed',
          size: child.nodes.messageViewer ? child.nodes.messageViewer.size : '',
          where: 'message-list',
          message: child.properties.item,
          model: child.properties.item.createModel(),
          modelName: child.properties.item.getModelName(),
          wasUnread: child.properties.item.isUnread,
          inBackground: UIUtils.isInBackground(),
        });
      }
    },


    /**
     * Return the tag name to use to render an individual Message Item.
     *
     * Typically would return one of:
     *
     * * 'layer-message-item-sent'
     * * 'layer-message-item-received'
     * * 'layer-message-item-status'
     *
     * You may customize what is received by using a mixin:
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'layer-message-list': {
     *       methods: {
     *         mode: Layer.UI.registerComponent.MODES.OVERWRITE,
     *         getMessageItemTagName(message) {
     *           return 'layer-message-item-received';
     *         }
     *       }
     *     }
     *   }
     * });
     * ```
     *
     * @param {*} message    The message to be rendered
     * @param {*} handler    The handler for rendering that message; typically 'layer-message-viewer'
     */
    getMessageItemTagName(message, handler) {
      const rootPart = message.getRootPart();
      if (this._isStatusMessage(rootPart, message)) {
        return 'layer-message-item-status';
      } else if (message.sender.isMine) {
        return 'layer-message-item-sent';
      } else {
        return 'layer-message-item-received';
      }
    },

    /**
     * Append a Message to the document fragment, updating the previous messages' lastInSeries property as needed.
     *
     * @method _generateItem
     * @param {Layer.Core.Message} message
     * @returns {Layer.UI.components.MessageListPanel.Item}
     * @private
     */
    _generateItem(message) {
      const handler = MessageHandlers.getHandler(message, this);
      if (handler) {
        const type = this.getMessageItemTagName(message, handler);

        const messageWidget = document.createElement(type);
        messageWidget.id = this._getItemId(message.id);
        messageWidget.dateRenderer = this.dateRenderer;

        messageWidget.messageStatusRenderer = this.messageStatusRenderer;
        if (this.dateFormat) messageWidget.dateFormat = this.dateFormat;
        messageWidget._contentTag = handler.tagName;
        messageWidget.item = message;
        messageWidget.getMenuItems = this.getMenuItems;
        if (this.query.pagedToEnd && this.query.data.indexOf(message) === this.query.data.length - 1) {
          messageWidget.classList.add('layer-first-message-of-conversation');
        }
        return messageWidget;
      } else {
        return null;
      }
    },

    /**
     * Should the provided message with the specified Root Message Part be treated as a Status Message?
     *
     * If there is no rootPart, then its _not_ following Message Type Model conventions, and is therefore
     * not a Status Message.
     *
     * @param {Layer.Core.MessageTypeModel} rootPart
     * @param {Layer.Core.Message} message
     */
    _isStatusMessage(rootPart, message) {
      if (!rootPart) return false;
      return StatusMessageManager.isStatusMessage(rootPart.mimeType) !== -1;
    },

    /**
     * Are the two Messages in the same Group?
     *
     * See Layer.UI.settings.messageGroupTimeSpan to adjust the definition of Same Group.
     *
     * @method _inSameGroup
     * @private
     * @param {Layer.UI.Component} messageItem1
     * @param {Layer.UI.Component} messageItem2
     * @returns {Boolean}
     */
    _inSameGroup(m1, m2) {
      if (!m1 || !m2) return false;
      if (m1.tagName !== m2.tagName) return false;
      const message1 = m1.item;
      const message2 = m2.item;
      const diff = Math.abs(message1.sentAt.getTime() - message2.sentAt.getTime());
      return message1.sender === message2.sender && diff < Settings.messageGroupTimeSpan;
    },

    /**
     * Whenever new message items are added to the list, we need to assign lastInSeries and firstInSeries values to them,
     * as well as update those values in nearby message items.
     *
     * @method _processAffectedWidgetsCustom
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item[]} widgets
     * @param {Number} firstIndex - Index in the listData array of the first item in the widgets array
     * @param {Boolean} isTopItemNew - If the top item is index 0 and its a new item rather than an "affected" item, this is true.
     */
    _processAffectedWidgetsCustom(widgets, firstIndex, isTopItemNew) {
      if (widgets.length === 0) return;
      if (isTopItemNew) widgets[0].firstInSeries = true;
      for (let i = 1; i < widgets.length; i++) {
        const sameGroup = this._inSameGroup(widgets[i - 1], widgets[i]);
        widgets[i].firstInSeries = !sameGroup;
        widgets[i - 1].lastInSeries = !sameGroup;
      }
      if (!widgets[widgets.length - 1].nextSibling) widgets[widgets.length - 1].lastInSeries = true;
    },

    // See List mixin docs
    _renderResetData: {
      mode: registerComponent.MODES.AFTER,
      value: function _renderResetData(evt) {
        this.properties.stuckToBottom = true;
        this.properties.lastPagedAt = 0;
        this.properties.isSelfScrolling = false;
      },
    },

    // See List mixin docs
    _renderWithoutRemovedData: {
      mode: registerComponent.MODES.OVERWRITE,
      value(evt) {
        this.properties.listData = [].concat(this.properties.query.data).reverse();

        const messageWidget = this.querySelector('#' + this._getItemId(evt.target.id));
        if (messageWidget) this.removeChild(messageWidget);

        const removeIndex = this.properties.listData.length - evt.index; // Inverted for reverse order
        const affectedItems = this.properties.listData.slice(Math.max(0, removeIndex - 3), removeIndex + 3);
        this._gatherAndProcessAffectedItems(affectedItems, false);
      },
    },

    // See List mixin docs
    _renderInsertedData: {
      mode: registerComponent.MODES.OVERWRITE,
      value(evt) {
        if (this.properties.appendingMore) {
          if (!this.properties.insertEvents) this.properties.insertEvents = [];
          this.properties.insertEvents.push(evt);
          return;
        }
        const oldListData = this.properties.listData;
        this.properties.listData = [].concat(this.properties.query.data).reverse();

        const insertIndex = oldListData.length - evt.index; // Inverted for reverse order
        const isTopItemNew = insertIndex === 0;

        const affectedItems = this.properties.listData.slice(Math.max(0, insertIndex - 3), insertIndex + 4);
        const fragment = this._generateFragment([evt.target]);
        if (insertIndex < oldListData.length) {
          const insertBeforeNode = affectedItems.length > 1 ?
            this.querySelector('#' + this._getItemId(oldListData[insertIndex].id)) : null;
          this.insertBefore(fragment, insertBeforeNode);
        } else {
          this.appendChild(fragment);
        }
        this._gatherAndProcessAffectedItems(affectedItems, isTopItemNew);
        this._updateLastMessageSent();
        if (this.properties.stuckToBottom) {
          setTimeout(() => this.animatedScrollTo(this.scrollHeight - this.clientHeight), 0);
        } else {
          this._checkVisibility();
        }
        if (!evt.inRender) this.onRerender();
      },
    },

    /**
     * The last message sent by the session owner should show some pending/read-by/etc... status.
     *
     * Other messages may also do this, but adding the `layer-last-message-sent` css class makes it easy
     * to conditionally show status only for the last sent message.
     *
     * TODO: Review if a CSS :last-child could isolate last message sent from last message received, and be used for easily styling this.
     *
     * @method _updateLastMessageSent
     * @private
     */
    _updateLastMessageSent() {
      for (let i = this.properties.listData.length - 1; i >= 0; i--) {
        if (this.properties.listData[i].sender.isMine) {
          const item = this.querySelector('#' + this._getItemId(this.properties.listData[i].id));
          if (item && !item.classList.contains('layer-last-message-sent')) {
            this.querySelectorAllArray('.layer-last-message-sent').forEach((node) => {
              node.classList.remove('layer-last-message-sent');
            });
            item.classList.add('layer-last-message-sent');
          }
          break;
        }
      }
    },

    /**
     * Identify the message-item that is fully visible and at the top of the viewport.
     *
     * We use this before paging in new data so that we know which message should still
     * be at the top after we insert new messages at the top, and must compensate our `scrollTop`
     * accordingly.
     *
     * @method _findFirstVisibleItem
     * @private
     */
    _findFirstVisibleItem() {
      const visibleTop = this.scrollTop;
      const visibleBottom = this.scrollTop + this.clientHeight;
      const children = Array.prototype.slice.call(this.childNodes);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childOffset = child.offsetTop - this.offsetTop;
        if (childOffset >= visibleTop && childOffset + child.clientHeight <= visibleBottom) {
          if (child.properties && child.properties.item) {
            return child;
          }
        }
      }
      return null;
    },

    /**
     * Render a new page of data received from the Query.
     *
     * @method _renderPagedData
     * @private
     */
    _renderPagedData: {
      mode: registerComponent.MODES.OVERWRITE,
      value(evt) {
        if (evt.data.length === 0) {
          this.isDataLoading = this.properties.query.isFiring;
          if (this.query.pagedToEnd) {
            const firstItem = this.querySelectorAllArray('.layer-message-item')[0];
            if (firstItem && firstItem.item && firstItem.item === this.query.data[this.query.data.length - 1]) {
              firstItem.classList.add('layer-first-message-of-conversation');
            }
          }
          this._renderPagedDataDone([], null, evt);
          return;
        }

        this.properties.inPagedData = true;

        // Set this so that if the user is clinging to the scrollbar forcing it to stay at the top,
        // we know we just paged and won't page again.
        this.properties.lastPagedAt = Date.now();

        // Get both the query data and the event data
        const oldListData = this.properties.listData;
        this.properties.listData = [].concat(this.properties.query.data).reverse();
        const newData = [].concat(evt.data).reverse();

        // Get the affected items
        let affectedItems = [].concat(newData);
        let fragment;
        if (oldListData.length) affectedItems = affectedItems.concat(oldListData.slice(0, 3));


        // Append only a few items at a time, with pauses to keep browser running smoothly.
        // Don't append anything to the document until its all generated
        // TODO: This sucks.  For 100 items, it takes 5 iterates of 20ms each, so it adds 100ms lag to render,
        // and the only good news is that this 100ms lag results in performance of the rest of the browser not degrading.
        const appendMore = function appendMore() {
          if (!this.query || this.query.isDestroyed) return;
          this.properties.appendingMore = true;
          const processItems = newData.splice(0, 20).filter(item => !item.isDestroyed);
          fragment = this._generateFragment(processItems, fragment);
          if (newData.length) {
            setTimeout(() => appendMore.call(this), 20);
          } else {
            this.properties.appendingMore = false;
            defer(() => this._renderPagedDataDone(affectedItems, fragment, evt));
          }
        }.bind(this);
        appendMore();
      },
    },

    /**
     * After we have rendered the newly paged in messages, some post processing is needed.
     *
     * 1. Call processAffectedWidgets
     * 2. Scroll to maintain an appropriate position
     * 3. Insert the document fragment into our widget
     * 4. Check visibility on newly rendered items
     *
     * @method _renderPagedDataDone
     * @private
     */
    _renderPagedDataDone(affectedItems, fragment, evt) {
      if (!fragment) return; // called without fragment to trigger mixin versions of _renderPagedDataDone
      if (this.properties._internalState.onDestroyCalled) return;

      // Find the nodes of all affected items in both the document and the fragment,
      // and call processAffectedWidgets on them
      if (affectedItems.length) {
        const affectedWidgetsQuery = '#' + affectedItems.map(message => this._getItemId(message.id)).join(', #');
        let affectedWidgets = this.querySelectorAllArray(affectedWidgetsQuery);
        if (fragment) {
          const fragmentWidgets = Array.prototype.slice.call(fragment.querySelectorAll(affectedWidgetsQuery));
          affectedWidgets = fragmentWidgets.concat(affectedWidgets);
        }
        try {
          // When paging new data, top item should always be new
          this._processAffectedWidgets(affectedWidgets, true);
        } catch (e) {
          logger.error('LAYER-MESSAGE-LIST: Error in renderPagedDataDone', e);
        }
      }

      const firstVisibleItem = this._findFirstVisibleItem();
      const initialOffset = firstVisibleItem ?
        firstVisibleItem.offsetTop - this.offsetTop - this.scrollTop : 0;

      // Now that DOM manipulation is completed,
      // we can add the document fragments to the page
      const nextItem = this.nodes.listMeta.nextSibling;
      this.insertBefore(fragment, nextItem);

      // TODO PERFORMANCE: We should not need to do this as we page UP; very wasteful
      this._updateLastMessageSent();

      this.isDataLoading = this.properties.query.isFiring;
      this._checkVisibility();
      if (!evt.inRender) this.onRerender();

      if (this.properties.insertEvents) this.properties.insertEvents.forEach(anEvt => this._renderInsertedData(anEvt));
      delete this.properties.insertEvents;

      // more than just lastMessage
      if (this.query.data.length > 1) {
        defer(() => this._pagedDataDone(firstVisibleItem, evt, initialOffset));
      }

      // Fixes special case where first message is taller than the viewport,
      // also happens when listItem.beforeNode adds height.
      else if (this.properties.stuckToBottom) {
        this.onPagedDataDone(false);
        this.properties.inPagedData = false;
        // TODO: Add onPagedData(true) call
      }
    },

    /**
     * This method is called whenever the list finishes generating all of the Layer.UI.components.MessageListPanel.Item
     * for a new page of data.
     *
     * On finishing loading, it will:
     *
     * 1. Determine where it needs to scroll to (bottom or fistVisibleItem)
     * 2. Scroll to that position
     * 3. Wait for messages to finish asyc rendering such as fetching images from servers
     * 4. Rescroll to that position after all message heights are updated
     *
     * @method _pagedDataDone
     * @private
     * @param {Layer.UI.components.MessageListPanel.Item} firstVisibleItem   The first message that at the top of the view and fully visible
     * @param {Layer.Core.LayerEvent} evt   The Query change event that delivered the data
     * @param {Number} initialOffset    How far from the top of the Message List is that first fully visible item (so we can maintain that offset)
     */
    _pagedDataDone(firstVisibleItem, evt, initialOffset) {
      this.properties.inPagedData = false;
      let needsPagedDataDone = true;
      // CustomElements.takeRecords();
      // defer.flush();

      if (this.properties.stuckToBottom) {
        // Get all Message Viewers that contain a ui node
        const uis = this.querySelectorAllArray('layer-message-viewer').map(card => card.nodes.ui).filter(ui => ui);

        // Gather all UIs that haven't yet finished allocating their height
        let unfinishedUIs = uis.filter(card => !card.isHeightAllocated);

        // If there are unfinished UIs, setup event handlers to detect when all messages are done
        if (unfinishedUIs.length) {
          this.onPagedDataDone(false);

          // Function determines if everything is resolved, and if so, calls onPagedDataDone(true)
          const onCardFinished = () => {
            if (needsPagedDataDone) return;
            unfinishedUIs = unfinishedUIs.filter(card => !card.isHeightAllocated);
            if (unfinishedUIs.length === 0) {
              needsPagedDataDone = true;
              this.removeEventListener('message-height-change', onCardFinished);
              setTimeout(() => this.onPagedDataDone(true), 10);
            }
          };

          // Listen for all Messages that have resolved their height
          this.addEventListener('message-height-change', onCardFinished);
          needsPagedDataDone = false;
        }
      }

      // If we are not stuck to the bottom, then just try and stay pinned to whatever the first visible item is
      // TODO: this doesn't yet use the height change events to make adjustments!!!
      else if (firstVisibleItem && evt.type === 'data' && evt.data.length !== 0) {
        this.scrollTo(firstVisibleItem.offsetTop - this.offsetTop - initialOffset);
      }

      // Is everything good? Well then call onPagedDataDone(true)
      if (needsPagedDataDone) {
        this.onPagedDataDone(true);
        this.properties.inPagedData = false;
      }
    },

    /**
     * Whenever the width of any messages changes, assume that things may have been pushed up/down and scrollToBottom.
     *
     * @method onMessageWidthChange
     */
    onMessageWidthChange() {
      if (this.properties.stuckToBottom && !this.properties.inPagedData) {
        this.scrollToBottom();
      }
    },

    /**
     * Mixin Hook for when a page of messages has finished loading.
     *
     * Note that the `isDoneSizingContent` is significant if you need all of the Messages to finish allocating their height
     * before doing processing.  Messages adjust their height when fetching graphics asynchronously and do not yet know
     * the dimensions for those images.  Fixed height messages are typically cleaner to work with.
     *
     * @param {Boolean} isDoneSizingContent
     */
    onPagedDataDone(isDoneSizingContent) {
      if (this.properties.stuckToBottom) {
        this.scrollToBottom();
      }
    },

    /**
     * Scroll the Message List to the bottom / most recent message.
     *
     * Sometimes things shift while animating so keep retrying until
     * we Really reach the bottom.
     *
     * @method scrollToBottom
     */
    scrollToBottom(animateSpeed = 0) {
      this.properties.stuckToBottom = true;
      const bottom = this.scrollHeight - this.clientHeight;
      if (!animateSpeed) {
        this.scrollTo(bottom);
      } else {
        this.animatedScrollTo(bottom, animateSpeed);
      }
      setTimeout(() => {
        const newBottom = this.scrollHeight - this.clientHeight;
        if (bottom !== newBottom) this.scrollToBottom(animateSpeed);
      }, animateSpeed + 10 || 250);
    },
  },
});
