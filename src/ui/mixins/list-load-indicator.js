/**
 * A helper mixin for Lists that want an indicator to render when an indicator when fetching another page of data from the server.
 *
 * This is not a necessary feature, but is nicer than just reaching the end of the list and waiting.
 *
 * This mixin requires "layer-id=loadIndicator" to exist in the template for any component using this mixin.
 *
 * @class Layer.UI.mixins.ListLoadIndicator
 */
import '../components/layer-loading-indicator';
import mixins from './index';

mixins.ListLoadIndicator = module.exports = {
  properties: {
    isDataLoading: {
      set(value) {
        this.toggleClass('layer-loading-data', value);
      },
    },

    /**
     * A dom node to render when data is loading for the list.
     *
     * Could just be a message "Messages Loading...".  Or you can add interactive widgets.
     * Note that using the default template, this widget may be wrapped in a div with CSS class `layer-header-toggle`,
     * you should insure that they height of this toggle does not change when your custom node is shown.  Set the
     * style height to be at least as tall as your custom node.
     *
     * @property {HTMLElement} [dataLoadingNode=null]
     * @removed See replaceableContent instead
     */
  },
};
