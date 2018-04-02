/**
 * The Syncable abstract clas represents resources that are syncable with the server.
 * This is currently used for Messages and Conversations.
 * It represents the state of the object's sync, as one of:
 *
 *  * Layer.Constants.SYNC_STATE.NEW: Newly created; local only.
 *  * Layer.Constants.SYNC_STATE.SAVING: Newly created; being sent to the server
 *  * Layer.Constants.SYNC_STATE.SYNCING: Exists on both client and server, but changes are being sent to server.
 *  * Layer.Constants.SYNC_STATE.SYNCED: Exists on both client and server and is synced.
 *  * Layer.Constants.SYNC_STATE.LOADING: Exists on server; loading it into client.
 *
 * @class Layer.Core.Syncable
 * @extends Layer.Core.Root
 * @abstract
 */

import Core from '../namespace';
import Root from '../root';
import { ErrorDictionary } from '../layer-error';
import { SYNC_STATE } from '../../constants';
import { client as Client } from '../../settings';

class Syncable extends Root {
  constructor(options = {}) {
    super(options);
    this.localCreatedAt = new Date();
  }

  /**
   * Fire an XHR request using the URL for this resource.
   *
   * For more info on xhr method parameters see {@link Layer.Core.Client#xhr}
   *
   * @method _xhr
   * @protected
   * @return {Layer.Core.Syncable} this
   */
  _xhr(options, callback) {
    // initialize
    if (!options.url) options.url = '';
    if (!options.method) options.method = 'GET';

    // Validatation
    if (this.isDestroyed) throw new Error(ErrorDictionary.isDestroyed);
    if (!this.constructor.enableOpsIfNew &&
      options.method !== 'POST' && options.method !== 'GET' &&
      this.syncState === SYNC_STATE.NEW) return this;

    if (!options.url.match(/^http(s):\/\//)) {
      if (options.url && !options.url.match(/^(\/|\?)/)) options.url = '/' + options.url;
      if (!options.sync) options.url = this.url + options.url;
    }

    // Setup sync structure
    options.sync = this._setupSyncObject(options.sync);

    if (options.method !== 'GET') {
      this._setSyncing();
    }

    Client.xhr(options, (result) => {
      if (result.success && options.method !== 'GET' && !this.isDestroyed) {
        this._setSynced();
      }
      if (callback) callback(result);
    });
    return this;
  }

  _getBubbleEventsTo() {
    return Client;
  }

  /**
   * Setup an object to pass in the `sync` parameter for any sync requests.
   *
   * @method _setupSyncObject
   * @private
   * @param {Object} sync - Known parameters of the sync object to be returned; or null.
   * @return {Object} fleshed out sync object
   */
  _setupSyncObject(sync) {
    if (sync !== false) {
      if (!sync) sync = {};
      if (!sync.target) sync.target = this.id;
    }
    return sync;
  }

  /**
   * A websocket event has been received specifying that this resource
   * has been deleted.
   *
   * @method handleWebsocketDelete
   * @protected
   * @param {Object} data
   */
  _handleWebsocketDelete(data) {
    this._deleted();
    this.destroy();
  }

  /**
   * The Object has been deleted.
   *
   * Destroy must be called separately, and handles most cleanup.
   *
   * @method _deleted
   * @protected
   */
  _deleted() {
    this.trigger(this.constructor.eventPrefix + ':delete');
  }


  /**
   * Load the resource identified via a Layer ID.
   *
   * Will load the requested resource from persistence or server as needed,
   * and trigger `type-name:loaded` when its loaded.  Instance returned by this
   * method will have only ID and URL properties, all others are unset until
   * the `conversations:loaded`, `messages:loaded`, etc... event has fired.
   *
   * ```
   * var message = Layer.Core.Message.load(messageId);
   * message.once('messages:loaded', function(evt) {
   *    alert("Message loaded");
   * });
   * ```
   *
   * @method load
   * @static
   * @param {string} id - `layer:///messages/UUID`
   * @return {Layer.Core.Syncable} - Returns an empty object that will be populated once data is loaded.
   */
  static load(id) {

    const obj = {
      id,
      url: Client.url + id.substring(8),
    };

    if (!Syncable.sortedSubclasses) {
      Syncable.sortedSubclasses = Syncable.subclasses.filter(item => item.prefixUUID)
        .sort((a, b) => a.prefixUUID.length - b.prefixUUID.length);
    }

    const ConstructorClass = Syncable.sortedSubclasses.filter((aClass) => {
      if (aClass.prefixUUID.indexOf('layer:///') === 0) {
        return obj.id.indexOf(aClass.prefixUUID) === 0;
      } else {
        return obj.id.indexOf(aClass.prefixUUID) !== -1;
      }
    })[0];
    const syncItem = new ConstructorClass(obj);
    const typeName = ConstructorClass.eventPrefix;

    if (typeName) {
      if (!Client.dbManager) {
        if (!Client.isReady) {
          syncItem.syncState = SYNC_STATE.LOADING;
          Client.once('ready', () => syncItem._load(), syncItem);
        } else {
          syncItem._load();
        }
      } else {
        Client.dbManager.getObject(typeName, id, (item) => {
          if (syncItem.isDestroyed) return;
          if (item) {
            syncItem._populateFromServer(item);
            syncItem.trigger(typeName + ':loaded');
          } else if (!Client.isReady) {
            syncItem.syncState = SYNC_STATE.LOADING;
            Client.once('ready', () => syncItem._load(), syncItem);
          } else {
            syncItem._load();
          }
        });
      }
    } else {
      syncItem._load();
    }

    syncItem.syncState = SYNC_STATE.LOADING;
    return syncItem;
  }

  /**
   * Load this resource from the server.
   *
   * Called from the static Layer.Core.Syncable.load() method
   *
   * @method _load
   * @private
   */
  _load() {
    this.syncState = SYNC_STATE.LOADING;
    this._xhr({
      method: 'GET',
      sync: false,
    }, result => this._loadResult(result));
  }


  _loadResult(result) {
    if (this.isDestroyed) return;
    const prefix = this.constructor.eventPrefix;
    if (!result.success) {
      this.syncState = SYNC_STATE.NEW;
      this._triggerAsync(prefix + ':loaded-error', { error: result.data });
      setTimeout(() => {
        if (!this.isDestroyed) this.destroy();
      }, 100); // Insure destroyed AFTER loaded-error event has triggered
    } else {
      this._populateFromServer(result.data);
      this._loaded(result.data);
      this.trigger(prefix + ':loaded');
    }
  }

  /**
   * Processing the result of a _load() call.
   *
   * Typically used to register the object and cleanup any properties not handled by _populateFromServer.
   *
   * @method _loaded
   * @private
   * @param  {Object} data - Response data from server
   */
  _loaded(data) {

  }

  /**
   * Object is new, and is queued for syncing, but does not yet exist on the server.
   *
   * That means it is currently out of sync with the server.
   *
   * @method _setSyncing
   * @private
   */
  _setSyncing() {
    this._clearObject();
    switch (this.syncState) {
      case SYNC_STATE.SYNCED:
        this.syncState = SYNC_STATE.SYNCING;
        break;
      case SYNC_STATE.NEW:
        this.syncState = SYNC_STATE.SAVING;
        break;
    }
    this._syncCounter++;
  }

  /**
   * Object is synced with the server and up to date.
   *
   * @method _setSynced
   * @private
   */
  _setSynced() {
    this._clearObject();
    if (this._syncCounter > 0) this._syncCounter--;

    this.syncState = this._syncCounter === 0 ? SYNC_STATE.SYNCED :
      SYNC_STATE.SYNCING;
    this.isSending = false;
  }

  /**
   * Any time the instance changes, we should clear the cached toObject value
   *
   * @method _clearObject
   * @private
   */
  _clearObject() {
    this._toObject = null;
  }

  // Any time there is an event triggered, assume that its state has changed and clear its cached object.
  // See parent class for docs
  _triggerAsync(evtName, args) {
    this._clearObject();
    super._triggerAsync(evtName, args);
  }

  // Any time there is an event triggered, assume that its state has changed and clear its cached object.
  // See parent class for docs
  trigger(evtName, args) {
    this._clearObject();
    return super.trigger(evtName, args);
  }

  /**
   * Returns a plain object.
   *
   * Object will have all the same public properties as this
   * Syncable instance.  New object is returned any time
   * any of this object's properties change.
   *
   * @method toObject
   * @return {Object} POJO version of this object.
   */
  toObject() {
    if (!this._toObject) {
      this._toObject = super.toObject();
      this._toObject.isNew = this.isNew();
      this._toObject.isSaving = this.isSaving();
      this._toObject.isSaved = this.isSaved();
      this._toObject.isSynced = this.isSynced();
    }
    return this._toObject;
  }

  /**
   * Convert array of Syncable instances into an array of objects that can be inserted into indexedDB.
   *
   * Values should look a lot like they would look when coming from the server.
   *
   * @method toDbObjects
   * @private
   * @param {Layer.Core.Syncable[]} items
   * @param {Function} callback
   * @return {Object[]} items
   */
  static toDbObjects(items, callback) {
    return items.map(item => item.toObject());
  }

  /**
   * Object is new, and is not yet queued for syncing
   *
   * @method isNew
   * @returns {boolean}
   */
  isNew() {
    return this.syncState === SYNC_STATE.NEW;
  }

  /**
   * Object is new, and is queued for syncing
   *
   * @method isSaving
   * @returns {boolean}
   */
  isSaving() {
    return this.syncState === SYNC_STATE.SAVING;
  }

  /**
   * Object exists on server.
   *
   * @method isSaved
   * @returns {boolean}
   */
  isSaved() {
    return !(this.isNew() || this.isSaving());
  }

  /**
   * Object is fully synced.
   *
   * As best we know, server and client have the same values.
   *
   * @method isSynced
   * @returns {boolean}
   */
  isSynced() {
    return this.syncState === SYNC_STATE.SYNCED;
  }
}

/**
 * Unique identifier.
 *
 * @property {string}
 */
Syncable.prototype.id = '';

/**
 * URL to access the object on the server.
 *
 * @property {string}
 * @readonly
 * @protected
 */
Syncable.prototype.url = '';

/**
 * The time that this client created this instance.
 *
 * This value is not tied to when it was first created on the server.  Creating a new instance
 * based on server data will result in a new `localCreateAt` value.
 *
 * @property {Date}
 */
Syncable.prototype.localCreatedAt = null;

/**
 * Temporary property indicating that the instance was loaded from local database rather than server.
 *
 * @property {boolean}
 * @private
 */
Syncable.prototype._fromDB = false;

/**
 * The current sync state of this object.
 *
 * Possible values are:
 *
 *  * Layer.Constants.SYNC_STATE.NEW: Newly created; local only.
 *  * Layer.Constants.SYNC_STATE.SAVING: Newly created; being sent to the server
 *  * Layer.Constants.SYNC_STATE.SYNCING: Exists on both client and server, but changes are being sent to server.
 *  * Layer.Constants.SYNC_STATE.SYNCED: Exists on both client and server and is synced.
 *  * Layer.Constants.SYNC_STATE.LOADING: Exists on server; loading it into client.
 *
 * @property {string}
 */
Syncable.prototype.syncState = SYNC_STATE.NEW;

/**
 * Number of sync requests that have been requested.
 *
 * Counts down to zero; once it reaches zero, all sync
 * requests have been completed.
 *
 * @property {Number}
 * @private
 */
Syncable.prototype._syncCounter = 0;


/**
 * Specifies why this object was loaded.
 *
 * Values are:
 *
 * * fetched
 * * queried
 * * websocket
 *
 * Fetched objects must be destroyed by the fetcher when done.
 *
 * Queried objects can be destroyed once the query no longer uses them.
 *
 * Websocket objects can stick around for a while but must eventually be cleaned up unless they are used by a Query.
 * Currently, a websocket object will stick around for one hour unless its used by a Query.
 * Locally created objects are treated as websocket created objects since
 * once created we get a websocket create event for them.
 *
 * @property {String} [_loadType=queried]
 * @private
 */
Syncable.prototype._loadType = 'queried';

/**
 * Prefix to use when triggering events
 * @private
 * @static
 */
Syncable.eventPrefix = '';

Syncable.enableOpsIfNew = false;

/**
 * Is the object loading from the server?
 *
 * @property {boolean}
 */
Object.defineProperty(Syncable.prototype, 'isLoading', {
  enumerable: true,
  get: function get() {
    return this.syncState === SYNC_STATE.LOADING;
  },
});

/**
 * Array of classes that are subclasses of Syncable.
 *
 * Used by Factory function.
 * @private
 */
Syncable.subclasses = [];

Syncable._supportedEvents = [].concat(Root._supportedEvents);
Syncable.inObjectIgnore = Root.inObjectIgnore;
module.exports = Syncable;
Core.Syncable = Syncable;
