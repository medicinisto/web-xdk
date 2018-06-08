/**
 * A helper mixin for adding monitoring of width changes to a UI Component
 *
 * Sets a CSS class of:
 *
 * * component-name-width-tiny: Width is less than {@link #widthSmallStart}
 * * component-name-width-small: Width is between {@link #widthSmallStart} and {@link #widthMediumStart}
 * * component-name-width-medium: Width is between {@link #widthMediumStart} and {@link #widthLargeStart}
 * * component-name-width-large: Width is greater than {@link #widthLargeStart}
 *
 * Each UI Component that uses this must define these widthXXXStart properties
 *
 * @class Layer.UI.mixins.WidthTracker
 */
import mixins from './index';
import Throttler from './throttler';

mixins.WidthTracker = module.exports = {
  mixins: [Throttler],
  properties: {
    /**
     * Width in pixels of this view; must be set as this is not a getter for looking at the DOM's width.
     *
     * @property {Number} width
     */
    width: {
      set(newValue, oldValue) {
        if (this.widthSmallStart) {
          this.toggleClass(this.tagName.toLowerCase() + '-width-tiny', newValue < this.widthSmallStart);
          this.toggleClass(this.tagName.toLowerCase() + '-width-small', newValue >= this.widthSmallStart && newValue < this.widthMediumStart);
        } else {
          this.toggleClass(this.tagName.toLowerCase() + '-width-small', newValue < this.widthMediumStart);
        }
        this.toggleClass(this.tagName.toLowerCase() + '-width-medium', newValue >= this.widthMediumStart && newValue < this.widthLargeStart);
        this.toggleClass(this.tagName.toLowerCase() + '-width-large', newValue >= this.widthLargeStart);
      },
    },

    /**
     * Minimum width for this UI Component to be considered of size "small"
     *
     * @property {Number} widthSmallStart
     */
    widthSmallStart: {},

    /**
     * Minimum width for this UI Component to be considered of size "medium"
     *
     * @property {Number} widthMediumStart
     */
    widthMediumStart: {},

    /**
     * Minimum width for this UI Component to be considered of size "large"
     *
     * @property {Number} widthLargeStart
     */
    widthLargeStart: {},
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
      this._updateWidth();
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
  },
};

