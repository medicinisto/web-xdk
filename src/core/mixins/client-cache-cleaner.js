/**
 * Adds APIs to the Layer Client for managing cached Models
 *
 * @class Layer.Core.Client
 */

import Core from '../namespace';
import Root from '../root';

module.exports = {
  lifecycle: {
    constructor() {
      this._scheduleCheckAndPurgeCacheItems = [];
    },
  },
  properties: {
    /**
     * Any  Message that is part of a Query's results are kept in memory for as long as it
     * remains in that Query.  However, when a websocket event delivers new Messages  that
     * are NOT part of a Query, how long should they stick around in memory?  Why have them stick around?
     * Perhaps an app wants to post a notification of a new Message or Conversation... and wants to keep
     * the object local for a little while.  Default is 2 hours before checking to see if
     * the object is part of a Query or can be uncached.  Value is in miliseconds.
     *
     * @property {Number} [cachePurgeInterval=2hours]
     */
    cachePurgeInterval: 2 * 60 * 60 * 1000, // 2 hours * 60 minutes per hour * 60 seconds per minute * 1000 miliseconds/second


    /**
     * Array of items to be checked to see if they can be uncached.
     *
     * @private
     * @property {Layer.Core.Root[]}
     */
    _scheduleCheckAndPurgeCacheItems: null,

    /**
     * Time that the next call to _runCheckAndPurgeCache() is scheduled for in ms since 1970.
     *
     * @private
     * @property {number}
     */
    _scheduleCheckAndPurgeCacheAt: 0,
  },
  methods: {
    /**
     * Check to see if the specified objects can safely be removed from cache.
     *
     * Removes from cache if an object is not part of any Query's result set.
     *
     * @method _checkAndPurgeCache
     * @private
     * @param  {Layer.Core.Root[]} objects - Array of Messages or Conversations
     */
    _checkAndPurgeCache(objects) {
      this._inCheckAndPurgeCache = true;
      objects.forEach((obj) => {
        if (!obj.isDestroyed && !this._isCachedObject(obj)) {
          if (obj instanceof Root === false) obj = this.getObject(obj.id);
          if (obj) obj.destroy();
        }
      });
      this._inCheckAndPurgeCache = false;
    },

    /**
     * Schedules _runScheduledCheckAndPurgeCache if needed, and adds this object
     * to the list of objects it will validate for uncaching.
     *
     * Note that any object that does not exist on the server (!isSaved()) is an object that the
     * app created and can only be purged by the app and not by the SDK.  Once its been
     * saved, and can be reloaded from the server when needed, its subject to standard caching.
     *
     * @method _scheduleCheckAndPurgeCache
     * @private
     * @param {Layer.Core.Root} object
     */
    _scheduleCheckAndPurgeCache(object) {
      if (object.isSaved()) {
        if (this._scheduleCheckAndPurgeCacheAt < Date.now()) {
          this._scheduleCheckAndPurgeCacheAt = Date.now() + this.cachePurgeInterval;
          setTimeout(() => this._runScheduledCheckAndPurgeCache(), this.cachePurgeInterval);
        }
        this._scheduleCheckAndPurgeCacheItems.push(object);
      }
    },

    /**
     * Calls _checkAndPurgeCache on accumulated objects and resets its state.
     *
     * @method _runScheduledCheckAndPurgeCache
     * @private
     */
    _runScheduledCheckAndPurgeCache() {
      if (this.isDestroyed) return; // Primarily triggers during unit tests
      const list = this._scheduleCheckAndPurgeCacheItems;
      this._scheduleCheckAndPurgeCacheItems = [];
      this._checkAndPurgeCache(list);
      this._scheduleCheckAndPurgeCacheAt = 0;
    },

    /**
     * Returns true if the specified object should continue to be part of the cache.
     *
     * Result is based on whether the object is part of the data for a Query.
     *
     * @method _isCachedObject
     * @private
     * @param  {Layer.Core.Root} obj - A Message or Conversation Instance
     * @return {Boolean}
     */
    _isCachedObject(obj) {
      const list = Object.keys(this._models.queries);
      for (let i = 0; i < list.length; i++) {
        const query = this._models.queries[list[i]];
        if (query._getItem(obj.id)) return true;
      }
      return false;
    },
  },
};

Core.mixins.Client.push(module.exports);
