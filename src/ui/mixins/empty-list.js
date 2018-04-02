/**
 * A helper mixin for Lists that detect and indicate when the list is Empty.
 *
 * @class Layer.UI.mixins.EmptyList
 */
import mixins from './index';

mixins.EmptyList = module.exports = {
  properties: {
    /**
     * If the query has no data and is not loading data (and has fired successfully!), this should be true.
     *
     * @property {Boolean} [isEmptyList=false]
     * @readonly
     */
    isEmptyList: {
      value: false,
      set(value) {
        if (this.nodes.emptyNode) this.nodes.emptyNode.style.display = value ? '' : 'none';
      },
    },

    /**
     * A dom node to render when there are no messages in the list.
     *
     * Could just be a message "Empty Conversation".  Or you can add interactive widgets.
     *
     * @property {HTMLElement} [emptyNode=null]
     * @removed See replaceableContent instead
     */
  },
  methods: {
    onRender() {
      if (this.nodes.emptyNode) this.nodes.emptyNode.style.display = this.isEmptyList ? '' : 'none';
    },

    /**
     * Call this on any Query change events and update the {@link #isEmptyList} value
     *
     * @method onRerender
     * @private
     * @param {Event} evt
     */
    onRerender(evt = {}) {
      if (this.query.isDestroyed) {
        this.isEmptyList = false;
      } else {
        this.isEmptyList = evt.type !== 'reset' && this.query.data.length === 0;
      }
    },
  },
};
