/**
 * A helper mixin for adding throttling to any component.
 *
 * This code only calls `fn` once:
 *
 * ```
 * this._throttler(fn);
 * this._throttler(fn);
 * this._throttler(fn);
 * ```
 *
 * @class Layer.UI.mixins.Throttler
 */
import mixins from './index';

mixins.Throttler = module.exports = {
  properties: {
    /**
     * A throttler is used to prevent excessive scroll events.
     *
     * This timeout indicates how frequently scroll events are allowed to fire in miliseconds.
     * This value should not need to be tinkered with.
     *
     * @property {Number} [_throttlerTimeout=150]
     * @protected
     */
    _throttlerTimeout: {
      value: 150,
    },
  },
  methods: {
    onCreate() {
      this.properties.throttler = {};
    },

    /**
     * Simple throttler to avoid too many events while scrolling.
     *
     * Not at this time safe for handling multiple types of events at the same time.
     *
     * Note that implementation is impacted by https://bugs.chromium.org/p/chromium/issues/detail?id=661155
     * which prevents setTimeout from firing while user is scrolling
     *
     * @method _throttler
     * @protected
     */
    _throttler(callback) {
      // setTimeout doesn't complete while user scrolls on touchscreen (or trackpad) on Chrome, so we track the time of the last
      // request and allow the request to refire if it was too long ago
      if (!this.properties.throttler.timeout ||
        Date.now() - this.properties.throttler.lastCall > this._throttlerTimeout) {

        clearTimeout(this.properties.throttler.timeout);
        this.properties.throttler.lastCall = Date.now();
        this.properties.throttler.callWaiting = false;

        callback();

        this.properties.throttler.timeout = setTimeout(() => {
          this.properties.throttler.timeout = null;
          if (this.properties.throttler.callWaiting) {
            callback();
            this.properties.throttler.lastCall = Date.now();
            this.properties.throttler.callWaiting = false;
          }
        }, this._throttlerTimeout);
      } else {
        this.properties.throttler.callWaiting = true;
      }
    },
  },
};
