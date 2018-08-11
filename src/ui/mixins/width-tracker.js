/**
 * A helper mixin for adding monitoring of width changes to a UI Component
 *
 * Sets a CSS class of:
 *
 * * component-name-width-tiny: Width is less than `widths.small`}
 * * component-name-width-small: Width is between `widths.small` and `widths.medium`
 * * component-name-width-medium: Width is between `widths.medium` and `widths.large`
 * * component-name-width-large: Width is greater than `widths.large`
 *
 * Each UI Component that uses this must define the {@link #widths} properties
 *
 * @class Layer.UI.mixins.WidthTracker
 * @typescript ismixin
 */
import mixins from './index';
import Throttler from './throttler';

mixins.WidthTracker = {
  mixins: [Throttler],
  properties: {
    /**
     * Width in pixels of this view; must be set as this is not a getter for looking at the DOM's width.
     *
     * @property {Number} width
     */
    width: {
      set(newValue, oldValue) {
        if (!this.widths) return; // some uses of this component only want the new width, and not the new class based on the widths property
        if (this.widths.small) {
          this.toggleClass(this.tagName.toLowerCase() + '-width-tiny', newValue < this.widths.small);
          this.toggleClass(this.tagName.toLowerCase() + '-width-small',
            newValue >= this.widths.small && newValue < this.widths.medium);
        } else {
          this.toggleClass(this.tagName.toLowerCase() + '-width-small', newValue < this.widths.medium);
        }
        this.toggleClass(this.tagName.toLowerCase() + '-width-medium',
          newValue >= this.widths.medium && newValue < this.widths.large);
        this.toggleClass(this.tagName.toLowerCase() + '-width-large', newValue >= this.widths.large);
      },
    },

    /**
     * Width values used to configure the width-tracker mixin
     *
     * @property {Object} widths
     * @property {Number} widths.small
     * @property {Number} widths.medium
     * @property {Number} widths.large
     */
    widths: {},
  },
  methods: {

    // Wire up the resize event handler
    onCreate() {
      this.properties._handleResize = this._handleResize.bind(this);
      window.addEventListener('resize', this.properties._handleResize);
    },

    // Unwire the resize event handler
    onDestroy() {
      window.removeEventListener('resize', this.properties._handleResize);
    },

    // Once added to the document, obtain our current size
    onAttach() {
      this.updateWidth();
    },

    /**
     * Any time there is a change that could impact the width, update the width property.
     *
     * @method _handleResize
     * @private
     */
    _handleResize() {
      this._throttler(this.updateWidth.bind(this));
    },

    /**
     * Update the width property based on browser size changes
     *
     * @method updateWidth
     */
    updateWidth() {
      this.width = this.clientWidth;
    },
  },
};
export default mixins.WidthTracker;
