/**
 * A helper mixin to add a size property components; component must add a `supportedSizes` property.
 *
 * ```
 * Layer.UI.registerComponent('my-size-supporting-widget', {
 *   mixins: [Layer.UI.mixins.SizeProperty],
 *   properties: {
 *     supportedSizes: {
 *       value: ['massive', 'tiny', 'nano']
 *     }
 *   }
 * });
 * var el = document.createElement('my-size-supporting-widget');
 * el.size = 'massive';
 * ```
 *
 * The above code will setup a Component that supports 3 possible sizes, and creates an instance whose size is `massive`.
 * This will set the CSS class on that node to `layer-size-massive`.
 *
 * @class Layer.UI.mixins.SizeProperty
 */
import { registerComponent } from '../components/component';
import { logger } from '../../utils';
import mixins from './index';

mixins.SizeProperty = module.exports = {
  properties: {
    /**
     * The supported sizes property lists all valid size values for the {@link #size} property.
     *
     * @property {String[]} supportedSizes
     */
    supportedSizes: {
      order: 100, // Must be initialized before size can be set
    },

    /**
     * The size for this component; setting this will set the CSS Class to `layer-size-xxx` where xxx is the size you set.
     *
     * @property {String} size
     */
    size: {
      order: 101,
      mode: registerComponent.MODES.BEFORE,
      set(newValue, oldValue) {
        if (this.supportedSizes.indexOf(newValue) === -1) {
          this.properties.size = oldValue;
          logger.info(this.tagName + ' does not support a size value of ' + newValue);

        } else {
          this.supportedSizes.forEach(size =>
            this.toggleClass('layer-size-' + size, size === newValue));
        }
      },
    },
  },
};
