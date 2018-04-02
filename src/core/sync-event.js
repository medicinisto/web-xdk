/**
 * A Sync Event represents a request to the server.
 * A Sync Event may fire immediately, or may wait in the Layer.Core.SyncManager's
 * queue for a long duration before firing.
 *
 * DO NOT confuse this with Layer.Core.LayerEvent which represents a change notification
 * to your application.  Layer.Core.SyncEvent represents a request to the server that
 * is either in progress or in queue.
 *
 * GET requests are typically NOT done via a SyncEvent as these are typically
 * needed to render a UI and should either fail or succeed promptly.
 *
 * Applications typically do not interact with these objects.
 *
 * @class  Layer.Core.SyncEvent
 * @extends Layer.Core.Root
 */
import { client } from '../settings';
import Util from '../utils';
import Core from './namespace';

class SyncEvent {
  /**
   * Create a Layer.Core.SyncEvent.  See Layer.Core.ClientAuthenticator for examples of usage.
   *
   * @method  constructor
   * @private
   * @return {Layer.Core.SyncEvent}
   */
  constructor(options) {
    let key;
    for (key in options) {
      if (key in this) {
        this[key] = options[key];
      }
    }
    if (!this.depends) this.depends = [];
    if (!this.id) this.id = 'layer:///syncevents/' + Util.generateUUID();
    if (!this.createdAt) this.createdAt = Date.now();
  }

  /**
   * Not strictly required, but nice to clean things up.
   *
   * @method destroy
   */
  destroy() {
    this.target = null;
    this.depends = null;
    this.callback = null;
    this.data = null;
  }

  /**
   * Get the Real parameters for the request.
   *
   * @method _updateData
   * @private
   */
  _updateData() {
    if (!this.target) return;
    const target = client.getObject(this.target);
    if (target && this.operation === 'POST' && target._getSendData) {
      this.data = target._getSendData(this.data);
    }
  }

  /**
   * Returns a POJO version of this object suitable for serializing for the network
   * @method toObject
   * @returns {Object}
   */
  toObject() {
    return { data: this.data };
  }
}


/**
 * The type of operation being performed.
 *
 * Either GET, PATCH, DELETE, POST or PUT
 *
 * @property {String}
 */
SyncEvent.prototype.operation = '';

SyncEvent.prototype.fromDB = false;

SyncEvent.prototype.createdAt = 0;


/**
 * Indicates whether this request currently in-flight.
 *
 * * Set to true by _xhr() method,
 * * set to false on completion by Layer.Core.SyncManager.
 * * set to false automatically after 2 minutes
 *
 * @property {Boolean}
 */
Object.defineProperty(SyncEvent.prototype, 'isFiring', {
  enumerable: true,
  set: function set(value) {
    this.__isFiring = value;
    if (value) this.__firedAt = Date.now();
  },
  get: function get() {
    return Boolean(this.__isFiring && Date.now() - this.__firedAt < SyncEvent.FIRING_EXPIRATION);
  },
});

/**
 * Indicates whether this request currently being validated to insure it wasn't read
 * from IndexedDB and fired by another tab.
 *
 * @property {Boolean}
 */
Object.defineProperty(SyncEvent.prototype, '_isValidating', {
  enumerable: true,
  set: function set(value) {
    this.__isValidating = value;
    if (value) this.__validatedAt = Date.now();
  },
  get: function get() {
    return Boolean(this.__isValidating && Date.now() - this.__validatedAt < SyncEvent.VALIDATION_EXPIRATION);
  },
});

SyncEvent.prototype.id = '';


/**
 * Indicates whether the request completed successfully.
 *
 * Set by Layer.Core.SyncManager.
 * @property {Boolean}
 */
SyncEvent.prototype.success = null;


/**
 * Callback to fire on completing this sync event.
 *
 * WARNING: The nature of this callback may change;
 * a persistence layer that persists the SyncManager's queue
 * must have serializable callbacks (object id + method name; not a function)
 * or must accept that callbacks are not always fired.
 * @property {Function}
 */
SyncEvent.prototype.callback = null;

/**
 * Number of retries on this request.
 *
 * Retries are only counted if its a 502 or 503
 * error.  Set and managed by Layer.Core.SyncManager.
 * @property {Number}
 */
SyncEvent.prototype.retryCount = 0;

/**
 * The target of the request.
 *
 * Any Component; typically a Conversation or Message.
 * @property {Layer.Core.Root}
 */
SyncEvent.prototype.target = null;

/**
 * Components that this request depends upon.
 *
 * A message cannot be sent if its
 * Conversation fails to get created.
 *
 * NOTE: May prove redundant with the target property and needs further review.
 * @property {Layer.Core.Root[]}
 */
SyncEvent.prototype.depends = null;

/**
 * Data field of the xhr call; can be an Object or string (including JSON string)
 * @property {Object}
 */
SyncEvent.prototype.data = null;

/**
 * Disable writing of these requests to the database when offline
 * @property {Boolean}
 */
SyncEvent.prototype.isPersistenceDisabled = false;

/**
 * After firing a request, if that firing state fails to clear after this number of miliseconds,
 * consider it to no longer be firing.  Under normal conditions, firing will be set to false explicitly.
 * This check insures that any failure of that process does not leave us stuck with a firing request
 * blocking the queue.
 * @property {number}
 * @static
 */
SyncEvent.FIRING_EXPIRATION = 1000 * 15;

/**
 * After checking the database to see if this event has been claimed by another browser tab,
 * how long to wait before flagging it as failed, in the event of no-response.  Measured in ms.
 * @property {number}
 * @static
 */
SyncEvent.VALIDATION_EXPIRATION = 500;

/**
 * A Layer.Core.SyncEvent intended to be fired as an XHR request.
 *
 * @class Layer.Core.SyncEvent.XHRSyncEvent
 * @extends Layer.Core.SyncEvent
 */
class XHRSyncEvent extends SyncEvent {

  /**
   * Fire the request associated with this instance.
   *
   * Actually it just returns the parameters needed to make the xhr call:
   *
   *      Layer.Utils.xhr(event._getRequestData());
   *
   * @method _getRequestData
   * @protected
   * @returns {Object}
   */
  _getRequestData() {
    this._updateUrl();
    this._updateData();
    return {
      url: this.url,
      method: this.method,
      headers: this.headers,
      data: this.data,
      telemetry: this.telemetry,
    };
  }

  /**
   * Get the Real URL.
   *
   * If the url property is a function, call it to set the actual url.
   * Used when the URL is unknown until a prior SyncEvent has completed.
   *
   * @method _updateUrl
   * @private
   */
  _updateUrl() {
    if (!this.target) return;
    const target = client.getObject(this.target);
    if (target && !this.url.match(/^http(s):\/\//)) {
      this.url = target._getUrl(this.url);
    }
  }

  toObject() {
    return {
      data: this.data,
      url: this.url,
      method: this.method,
    };
  }

  _getCreateId() {
    return this.operation === 'POST' && this.data ? this.data.id : '';
  }
}

/**
 * How long before the request times out?
 * @property {Number} [timeout=15000]
 */
XHRSyncEvent.prototype.timeout = 15000;

/**
 * URL to send the request to
 */
XHRSyncEvent.prototype.url = '';

/**
 * Counts number of online state changes.
 *
 * If this number becomes high in a short time period, its probably
 * failing due to a CORS error.
 */
XHRSyncEvent.prototype.returnToOnlineCount = 0;

/**
 * Headers for the request
 */
XHRSyncEvent.prototype.headers = null;

/**
 * Request method.
 */
XHRSyncEvent.prototype.method = 'GET';


/**
 * Telemetry data to go with the request.
 */
XHRSyncEvent.prototype.telemetry = null;

/**
 * A Layer.Core.SyncEvent intended to be fired as a websocket request.
 *
 * @class Layer.Core.SyncEvent.WebsocketSyncEvent
 * @extends Layer.Core.SyncEvent
 */
class WebsocketSyncEvent extends SyncEvent {

  /**
   * Get the websocket request object.
   *
   * @method _getRequestData
   * @private
   * @return {Object}
   */
  _getRequestData() {
    this._updateData();
    return this.data;
  }

  toObject() {
    return this.data;
  }

  _getCreateId() {
    return this.operation === 'POST' && this.data.data ? this.data.data.id : '';
  }
}

/**
 * Does this websocket request return a changes array to be processed by the request-manager?
 */
WebsocketSyncEvent.prototype.returnChangesArray = false;

module.exports = { SyncEvent, XHRSyncEvent, WebsocketSyncEvent };
Core.SyncEvent = SyncEvent;
Core.XHRSyncEvent = XHRSyncEvent;
Core.WebsocketSyncEvent = WebsocketSyncEvent;
