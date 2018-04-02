/**
 * A List Mixin that provides common list patterns
 *
 * @class Layer.UI.mixins.List
 * @mixin Layer.UI.mixins.HasQuery
 * @mixin Layer.UI.mixins.Throttler
 */
import { client } from '../../settings';
import Layer from '../../core';
import Util, { defer, logger } from '../../utils';
import { animatedScrollTo } from '../ui-utils';
import { registerComponent } from '../components/component';
import HasQuery from './has-query';
import Throttler from './throttler';
import mixins from './index';

mixins.List = module.exports = {
  mixins: [HasQuery, Throttler],
  properties: {
    /**
     * Lists have some special behaviors; its useful to be able to test if a component is in fact a list.
     *
     * @property {Boolean} [_isList=true]
     * @private
     * @readonly
     */
    _isList: {
      value: true,
    },

    // Redefined from Layer.UI.mixins.ListLoadIndicator because that mixin is not gaurenteed to be present
    isDataLoading: {},

    /**
     * Any time we are about to render an object, call any provided onRenderListItem function to see if there
     * are nodes to be inserted before/after the Item.
     *
     * ```javascript
     * listWidget.onRenderListItem = function(widget, dataArray, index, isTopItemNew) {
     *     var item = widget.item;
     *     var priorItem = dataArray[index - 1];
     *     if (index > 0 && item.metadata.category !== priorItem.metadata.category) {
     *        widget.customNodeAbove = '<div class="my-separator">' + widget.user.metadata.category + '</div>';
     *     }
     * });
     * ```
     *
     * Typical actions for this handler is, on receiving a widget,
     * to set its customNodeAbove and/or customNodeBelow to either a DOM node or an HTML String.
     *
     * @property {Function} [onRenderListItem=null]      Function to call on each rendered item.
     * @property {Layer.Core.Root} onRenderListItem.widget    Current user/message/conversation/list-item widget that has been created from the Query.
     * @property {Layer.Core.Root[]} onRenderListItem.items   Full set of users/messages/conversations have been/will be rendered
     * @property {Number} onRenderListItem.index         Index of the user/message/conversation in the items array
     * @property {Boolean} onRenderListItem.isTopItemNew If the top item is index 0, and its newly added rather than just affected by changes
     *           around it, this is often useful to know.
     */
    onRenderListItem: {
      type: Function,
    },

    // additional behaviors on top of Layer.UI.mixins.StateManager for propagating state changes
    // to List Items
    state: {
      set(newState) {
        Array.prototype.slice.call(this.childNodes).forEach((node) => {
          node.state = newState;
        });
      },
    },

    /**
     * String, Regular Expression or Function for filtering items that are in {@link Layer.Core.Query#data}.
     *
     * ```
     * list.filter = function(item) {
     *    return isGood(item); // return true to show, false to hide
     * };
     * ```
     *
     * Note that this is for quick local searches of items; to actually filter data that should not be shown
     * to users, see {@link #queryFilter}
     *
     * @property {String/RegExp/Function} [filter='']
     */
    filter: {
      set(value) {
        this._runFilter();
      },
    },
  },
  methods: {
    onCreate() {
      if (!this.id) this.id = Util.generateUUID();
      this.properties.listData = [];
      this.addEventListener('scroll', this._onScroll.bind(this));
      this.onRender();
    },

    /**
     * The _onScroll method throttles calls to the handleScroll method.
     *
     * @method _onScroll
     * @param {Event} evt
     * @private
     */
    _onScroll(evt) {
      if (this.properties.isSelfScrolling) {
        evt.preventDefault();
      } else {
        this._throttler(this._handleScroll.bind(this));
      }
    },

    /**
     * Any time a new Query is assigned, wire it up.
     *
     * @method _updateQuery
     * @private
     */
    _updateQuery() {
      this.query.on('change:property', this._runFilter, this);
    },

    /**
     * If the user scrolls to the bottom of the list, page the Query.
     *
     * @method _handleScroll
     * @private
     */
    _handleScroll() {
      if (this.scrollTop >= this.scrollHeight - this.clientHeight - 20 && this.scrollTop > 0) {
        this.query.update({ paginationWindow: this.query.paginationWindow + this.pageSize });
        this.isDataLoading = this.properties.query.isFiring;
      }
    },

    /**
     * Scroll the list to the specified Y position.
     *
     * @method scrollTo
     * @param {Number} position
     */
    scrollTo(position) {
      if (position === this.scrollTop) return;
      this.scrollTop = position;
    },

    /**
     * Animated scroll to the specified Y position.
     *
     * @method animatedScrollTo
     * @param {Number} position
     * @param {Number} [animateSpeed=200]   Number of miliseconds of animated scrolling; 0 for no animation
     * @param {Function} [animateCallback] Function to call when animation completes
     */
    animatedScrollTo(position, animateSpeed = 200, animateCallback) {
      if (this.properties.cancelAnimatedScroll) this.properties.cancelAnimatedScroll();

      const cancel = this.properties.cancelAnimatedScroll = animatedScrollTo(this, position, animateSpeed, () => {
        if (cancel !== this.properties.cancelAnimatedScroll) return;
        this.properties.cancelAnimatedScroll = null;
        if (animateCallback) animateCallback();
      });
    },

    /**
     * Scroll to the specified item.
     *
     * Item is assumed to be a Layer.Core.Message, Layer.Core.Conversation, or whatever the core
     * data set is that is in your list.  Note that this does not load the item from the server;
     * scrolling to an item not in the list will return `false`.
     *
     * @method scrollToItem
     * @param {Layer.Core.Root} item
     * @param {Number} [animateSpeed=0]   Number of miliseconds of animated scrolling; 0 for no animation
     * @param {Function} [animateCallback] Function to call when animation completes
     * @return {Boolean}                  Returns true if operation was successful,
     *                                    returns false if the item was not found in the list.
     */
    scrollToItem(item, animateSpeed = 0, animateCallback) {
      const widget = document.getElementById(this._getItemId(item.id));
      if (!widget) return false;

      const position = widget.offsetTop - this.offsetTop;
      if (!animateSpeed) {
        this.scrollTop = position;
      } else {
        this.animatedScrollTo(position, animateSpeed, animateCallback);
      }

      return true;
    },

    onRender() {
      // Reset the query to initial state by cloning the template
      Array.prototype.slice.call(this.childNodes).forEach((node) => {
        if (node._isListItem) this.removeChild(node);
      });

      // Render any data in the query
      if (this.query && this.query.size) {
        this.onRerender({ type: 'data', data: this.query.data, inRender: true });
      }
    },

    onRerender: {
      mode: registerComponent.MODES.BEFORE,
      conditional: function onCanRerender() {
        return Boolean(this.query);
      },
      value(evt = {}) {
        if (this.query.isDestroyed) {
          this._renderResetData(evt);
        } else {
          this._processQueryEvt(evt);
        }
      },
    },

    /**
     * Generate a document fragment with all the newly added Users.
     *
     * @method _generateFragment
     * @private
     */
    _generateFragment(data, fragment) {
      if (!fragment) fragment = document.createDocumentFragment();
      data.forEach((item, index) => {
        this._generateFragmentItem(item, fragment);
      }, this);
      return fragment;
    },

    /**
     * Generate a unique but consistent DOM ID for each Layer.UI.mixins.ListItem.
     *
     * @method _getItemId
     * @param {String} itemId
     * @private
     */
    _getItemId(itemId) {
      return 'list-item-' + this.id + '-' + itemId.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
    },

    /**
     * Generate an list-item for one query result.
     *
     * @method _generateFragmentItem
     * @private
     */
    _generateFragmentItem(item, fragment) {
      const itemInstance = item instanceof Layer.Root ? item : client.getObject(item.id);
      if (itemInstance) {
        const widget = this._generateItem(itemInstance);

        // propagate any custom nodes down to the list items
        if (this.customNodes) {
          widget.customNodes = {};
          Object.keys(widget.nodes).forEach((nodeName) => {
            if (this.customNodes[nodeName]) {
              if (typeof this.customNodes[nodeName] === 'function') {
                // no-op
              } else if (this.customNodes[nodeName].tagName !== 'TEMPLATE') {
                const template = document.createElement('template');
                template.content.appendChild(this.customNodes[nodeName]);
                this.customNodes[nodeName] = template;
              }
              widget.customNodes[nodeName] = this.customNodes[nodeName];
            }
          });
        }

        widget.parentComponent = this;
        widget.setAttribute('layer-item-id', item.id.replace(/^layer:\/\/\//, '').replace(/\//g, '_'));
        if (widget) {
          this.onGenerateListItem(widget);
          fragment.appendChild(widget);
        }
      }
    },

    /**
     * MIXIN HOOK: Each time a List Item is generated, call this so that listeners can use this.
     *
     * This is intended for Mixins to hook into; apps wanting to do processing on rendered
     * items should use `onRenderListItem`.
     *
     * @method
     * @param {Layer.UI.mixins.ListItem} widget
     */
    onGenerateListItem(widget) {
      // No-op
    },

    /**
     * Find the widgets associated with each affected item and feed it to processAffectedWidgets.
     *
     * @method _gatherAndProcessAffectedItems
     * @private
     */
    _gatherAndProcessAffectedItems(affectedItems, isTopItemNew) {
      if (affectedItems.length) {
        const itemIds = affectedItems.map(item => this._getItemId(item.id));
        const affectedWidgets = this.querySelectorAllArray('#' + itemIds.join(', #'));
        this._processAffectedWidgets(affectedWidgets, isTopItemNew);
      }
    },

    /**
     * For all newly added items, as well as items near them,
     * call onRenderListItem and _processAffectedWidgetsCustom to udpate
     * any rendering state needed.
     *
     * widgets are assumed to be sequential within the list.
     *
     * @method _processAffectedWidgets
     * @private
     */
    _processAffectedWidgets(widgets, isTopItemNew) {
      // Get the index of our first widget within listData
      let firstIndex;
      for (let i = 0; i < this.properties.listData.length; i++) {
        if (widgets.length && widgets[0].item.id === this.properties.listData[i].id) {
          firstIndex = i;
          break;
        }
      }

      // Do our internal processing of these widgets
      this._processAffectedWidgetsCustom(widgets, firstIndex, isTopItemNew);

      // Allow external processing of the widgets
      widgets.forEach((widget, index) => {
        if (this.properties.onRenderListItem) {
          try {
            this.properties.onRenderListItem(widget, this.properties.listData, firstIndex + index, isTopItemNew);
          } catch (err) {
            logger.error(`Error in onRenderListItem for ${widget.item.id}; ${err}`);
          }
        }
      }, this);
    },

    /**
     * Lists should override this to provide custom behaviors on newly added/affected items.
     *
     * @method _processAffectedWidgetsCustom
     * @private
     * @param {Layer.UI.mixins.ListItem} widgets
     * @param {Number} firstIndex - Index in the listData array of the first item in the widgets array
     * @param {Boolean} isTopItemNew - If the top item is index 0 and its a new item rather than an "affected" item, this is true.
     */
    _processAffectedWidgetsCustom(widgets, firstIndex, isTopItemNew) {
    },

    /**
     * Call this on any Query change events.
     *
     * TODO: This should work on the MessageList which is in Reverse Order
     *
     * @method _processQueryEvt
     * @private
     * @param {Event} evt
     */
    _processQueryEvt(evt) {
      switch (evt.type) {
        case 'data':
          this._renderPagedData(evt);
          break;
        case 'insert':
          this._renderInsertedData(evt);
          break;
        case 'remove':
          this._renderWithoutRemovedData(evt);
          break;
        case 'reset':
          this._renderResetData(evt);
          break;
        case 'move':
          this._renderMovedData(evt);
      }
    },

    /**
     * The query has been reset of all data (perhaps its now got a new predicate) or destroyed.
     *
     * Clear all data and list state
     *
     * @method _renderResetData
     * @param {Layer.Core.LayerEvent} evt
     * @private
     */
    _renderResetData(evt) {
      this.properties.listData = [];
      this.scrollTo(0);
      this.onRender();
    },

    /**
     * The query results have had an element move from one position to another.
     *
     * We need to update our list to reflect that change.
     *
     * @method _renderMovedData
     * @private
     */
    _renderMovedData(evt) {
      const oldIndex = evt.fromIndex;
      const newIndex = evt.toIndex;
      const moveNode = this.childNodes[oldIndex];
      this.removeChild(moveNode);
      this.insertBefore(moveNode, this.childNodes[newIndex]);
      if (!evt.inRender) this.onRerender();
    },

    /**
     * Data has been removed from the query; remove that data from our UI.
     *
     * Calls _gatherAndProcessAffectedItems on 3 items prior and 3 items after the removed item.
     *
     * @method _renderWithoutRemovedData
     * @private
     */
    _renderWithoutRemovedData(evt) {
      this.properties.listData = [].concat(this.properties.query.data);
      const removeIndex = evt.index;
      const affectedItems = this.properties.listData.slice(Math.max(0, removeIndex - 3), removeIndex + 3);
      const listItem = this.querySelector('#' + this._getItemId(evt.target.id));
      if (listItem) this.removeChild(listItem);

      this._gatherAndProcessAffectedItems(affectedItems, false);
    },

    /**
     * Data has been inserted into the results; insert it into our UI list.
     *
     * @method _renderInsertedData
     * @private
     */
    _renderInsertedData(evt) {
      this.properties.listData = [].concat(this.properties.query.data);
      const insertIndex = evt.index;
      const affectedItems = this.properties.listData.slice(Math.max(0, insertIndex - 3), insertIndex + 4);
      const fragment = this._generateFragment([evt.target]);
      this.insertBefore(fragment, this.childNodes[insertIndex]);
      this._gatherAndProcessAffectedItems(affectedItems, insertIndex === 0);
    },

    /**
     * A new page of data has been loaded by the query; insert it into our results.
     *
     * @method _renderPagedData
     * @private
     */
    _renderPagedData(evt) {
      const affectedItems = this.properties.listData
        .slice(this.properties.listData.length - 3, this.properties.listData.length)
        .concat(evt.data);
      this.properties.listData = [].concat(this.properties.query.data);
      const fragment = this._generateFragment(evt.data);

      this.insertBefore(fragment, this.nodes.listMeta);

      // isTopItemNew is true if there wasn't any prior data... data length == event length
      this._gatherAndProcessAffectedItems(affectedItems, evt.data.length === this.properties.query.data.length);

      if (typeof CustomElements !== 'undefined') CustomElements.takeRecords();
      defer.flush();

      this.isDataLoading = this.properties.query.isFiring;
      if (!evt.inRender) this.onRerender();
      if (this._renderPagedDataDone) this._renderPagedDataDone();
    },

    /**
     * Run the filter on all Identity Items.
     *
     * @method _runFilter
     * @private
     */
    _runFilter() {
      if (!this.filter) {
        this.querySelectorAllArray('.layer-item-filtered')
          .forEach(item => item.classList.remove('layer-item-filtered'));
      } else {
        for (let i = 0; i < this.childNodes.length; i++) {
          const listItem = this.childNodes[i];
          if (listItem.item instanceof Layer.Root) {
            listItem._runFilter(this.filter);
          }
        }
      }
    },

    destroy() {
      for (let i = this.childNodes.length - 1; i >= 0; i--) {
        if (this.childNodes[i].destroy) this.childNodes[i].destroy();
      }
    },
  },
};
