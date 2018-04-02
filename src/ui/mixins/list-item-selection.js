/**
 * A List Item Mixin that adds an {@link #isSelected} property to a List.
 *
 * @class Layer.UI.mixins.ListItemSelection
 */
import mixins from './index';

mixins.ListItemSelection = module.exports = {
  properties: {

    /**
     * Is this list item selected?
     *
     * @property {Boolean} [isSelected=false]
     */
    isSelected: {
      type: Boolean,
      set(value) {
        this.toggleClass('layer-selected-item', value);
        this.onSelection(value);
      },
    },
  },
  methods: {
    /**
     * MIXIN HOOK: Each time a an item's selection state changes, this will be called.
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'my-list-item': {
     *       methods: {
     *         onSelection(isSelected) {
     *           console.log("Item ", item, " is now ", isSelected);
     *         }
     *       }
     *     }
     *   }
     * });
     *
     * @method onSelection
     * @param {Boolean} isSelected
     */
    onSelection(isSelected) {
      // No-op
    },
  },
};
