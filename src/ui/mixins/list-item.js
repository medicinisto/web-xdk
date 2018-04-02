/**
 * A List Item Mixin that provides common properties, shortcuts and code.
 *
 * This Mixin requires a template that provides a `layer-list-item` class
 *
 * ```
 * <template>
 *    <div class='layer-list-item' layer-id='listItem'>
 *       <label class='my-title' layer-id='title'></label>
 *    </div>
 * </template>
 * ```
 *
 * @class Layer.UI.mixins.ListItem
 */
import { registerComponent } from '../components/component';
import { ComponentsHash } from '../component-services';
import mixins from './index';

mixins.ListItem = module.exports = {
  properties: {
    /**
     * Is this component a List Item
     *
     * TODO: Automate this for all mixins, and provide methods to test `widget.isMixin(mixinDefinition)`
     *
     * @private
     * @readonly
     * @property {Boolean} [_isListItem=true]
     */
    _isListItem: {
      value: true,
    },

    /**
     * A custom DOM node added by your application that goes over this list item.
     *
     * You can set this to a DOM Node or html string; note that strings will automatically be wrapped in an extra `<div/>`.
     *
     * ```
     * listItem.customNodeAbove = document.createElement('div');
     * listItem.customNodeAbove = '<div class="my-class">Hello there</div>';
     * ```
     *
     * @property {HTMLElement | String} [customNodeAbove=null]
     */
    customNodeAbove: {
      set(node, oldValue) {
        if (oldValue) this.removeChild(oldValue);
        if (node && typeof node === 'string') {
          const tmp = node;
          node = document.createElement('div');
          node.innerHTML = tmp;
          this.properties.customNodeAbove = node;
        }
        if (node) {
          this.insertBefore(node, this.querySelector('.layer-list-item'));
        } else {
          this.properties.customNodeAbove = null;
        }
      },
    },

    /**
     * A custom DOM node added by your application that goes below this list item.
     *
     * You can set this to a DOM Node or html string; note that strings will automatically be wrapped in an extra `<div/>`.
     *
     * ```
     * listItem.customNodeBelow = document.createElement('div');
     * listItem.customNodeBelow = '<div class="my-class">Hello there</div>';
     * ```
     *
     * @property {HTMLElement | String} [customNodeBelow=null]
     */
    customNodeBelow: {
      set(node, oldValue) {
        if (oldValue) this.removeChild(oldValue);
        if (node && typeof node === 'string') {
          const tmp = node;
          node = document.createElement('div');
          node.innerHTML = tmp;
          this.properties.customNodeBelow = node;
        }
        if (node) {
          this.appendChild(node);
        } else {
          this.properties.customNodeBelow = null;
        }
      },
    },

    /**
     * Shortcut to the `.layer-list-item` node that wraps every list item's contents.
     *
     * @property {HTMLElement} [innerNode=null]
     * @private
     */
    innerNode: {},

    /**
     * Sets whether this widget is the first in a series of items.
     *
     * @property {Boolean} [firstInSeries=false]
     */
    firstInSeries: {
      type: Boolean,
      value: false,
      set(value) {
        this.toggleClass('layer-list-item-first', value);
      },
    },

    /**
     * Sets whether this widget is the last in a series of items.
     *
     * @property {Boolean} [lastInSeries=false]
     */
    lastInSeries: {
      type: Boolean,
      value: false,
      set(value) {
        this.toggleClass('layer-list-item-last', value);
      },
    },

    /**
     * The item of data in a list of data that this List Item will render.
     *
     * @property {Layer.Core.Root} [item=null]
     */
    item: {
      propagateToChildren: true,
      set(newItem, oldItem) {
        // Disconnect from any previous Message we were rendering; not currently used.
        if (oldItem) oldItem.off(null, null, this);

        // Any changes to the Message should trigger a rerender
        if (newItem) newItem.on(newItem.constructor.eventPrefix + ':change', this.onRerender, this);
        this.onRender();
      },
    },
  },
  methods: {
    onCreate() {
      this.innerNode = this.nodes.listItem || this.querySelector('.layer-list-item');
    },

    // Delay any onRender call until there is an item
    onRender: {
      conditional: function onCanRender() {
        return Boolean(this.item);
      },
    },

    /**
     * On having new Replaceable Content setup, iterate over all child nodes and provide them with all `propagateToChildren` property values.
     *
     * @method onReplaceableContentAdded
     */
    onReplaceableContentAdded: {
      mode: registerComponent.MODES.AFTER,
      value: function onReplaceableContentAdded(name, node) {
        const props = ComponentsHash[this.tagName.toLowerCase()].properties
          .filter(propDef => propDef.propagateToChildren);

        // Setup each node added this way as a full part of this component
        const nodeIterator = document.createNodeIterator(
          node,
          NodeFilter.SHOW_ELEMENT,
          () => true,
          false,
        );
        const allNodes = [];
        let tmpNode;
        while ((tmpNode = nodeIterator.nextNode())) allNodes.push(tmpNode);

        allNodes.forEach((currentNode) => {
          props.forEach((propDef) => {
            if (ComponentsHash[currentNode.tagName.toLowerCase()]) {
              if (!currentNode.properties._internalState) {
                // hit using polyfil
                currentNode.properties[propDef.propertyName] = this[propDef.propertyName];
              } else {
                // hit using real webcomponents
                currentNode[propDef.propertyName] = this[propDef.propertyName];
              }
            }
          });
        });
      },
    },

    /**
     * Adds the CSS class to this list item's outer node.
     *
     * @method addClass
     * @param {String} className
     * @removed
     */

    /**
     * Removes the CSS class from this list item's outer node.
     *
     * @method removeClass
     * @param {String} className
     * @removed
     */

    /**
     * Toggles the CSS class of this list item's outer node.
     *
     * @method toggleClass
     * @param {String} className
     * @param {Boolean} [add=true]
     * @removed
     */
  },
};
