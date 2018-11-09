/**
 * This component manages
 *
 * 1. recieving websocket events
 * 2. Processing them
 * 3. Triggering events on completing them
 * 4. Sending them
 *
 * Applications typically do not interact with this component, but may subscribe
 * to the `message` event if they want richer event information than is available
 * through the Layer.Core.Client class.
 *
 * @class  Layer.Core.Websockets.SocketManager
 * @extends Layer.Core.Root
 * @private
 */
import Settings from '../../settings';
import Core from '../namespace';
import Root from '../root';
import * as Util from '../../utils';
import { getNativeSupport } from '../../utils/native-support';
import { ErrorDictionary } from '../layer-error';
import { WEBSOCKET_PROTOCOL } from '../../constants';
import version from '../../version';
import packageName from '../../name';

const { logger } = Util;
const { getClient } = Settings;
let WebSocket = getNativeSupport('Websocket');

export default class SocketManager extends Root {
  /**
   * Create a new websocket manager
   *
   *      var socketManager = new Layer.Core.Websockets.SocketManager({});
   *
   * @method constructor
   * @param  {Object} options
   * @return {Layer.Core.Websockets.SocketManager}
   */
  constructor(options) {
    super(options);

    // Insure that on/off methods don't need to call bind, therefore making it easy
    // to add/remove functions as event listeners.
    this._onMessage = this._onMessage.bind(this);
    this._onOpen = this._onOpen.bind(this);
    this._onSocketClose = this._onSocketClose.bind(this);
    this._onError = this._onError.bind(this);

    // If the client is authenticated, start it up.
    if (getClient().isAuthenticated && getClient().onlineManager.isOnline) {
      this.trigger('connecting', { from: 'constructor', why: 'initialization' });
      this.connect();
    }

    getClient().on('online', this._onlineStateChange, this);

    // Any time the Client triggers a ready event we need to reconnect.
    getClient().on('authenticated', () => {
      this.trigger('connecting', { from: 'constructor', why: 'authenticated' });
      this.connect();
    }, this);

    this._lastTimestamp = 0;
  }

  /**
   * Call this when we want to reset all websocket state; this would be done after a lengthy period
   * of being disconnected.  This prevents Event.replay from being called on reconnecting.
   *
   * @method _reset
   * @private
   */
  _reset() {
    this._lastTimestamp = 0;
    this._lastDataFromServerTimestamp = 0;
    this._hasZeroCounter = false;

    this._needsReplayFrom = null;
  }

  /**
   * Event handler is triggered any time the client's online state changes.
   * If going online we need to reconnect (i.e. will close any existing websocket connections and then open a new connection)
   * If going offline, close the websocket as its no longer useful/relevant.
   * @method _onlineStateChange
   * @private
   * @param {Layer.Core.LayerEvent} evt
   */
  _onlineStateChange(evt) {
    if (!getClient().isAuthenticated) return;
    if (evt.isOnline) {
      this.trigger('connecting', { from: '_onlineStateChange', why: 'detect change to online' });
      this._reconnect(evt.reset);
    } else {
      logger.info('Websocket-Manager: closed due to ambigious connection state');
      this.trigger('disconnecting', { from: '_onlineStateChange', why: 'detect change to offline' });
      this.close();
    }
  }

  /**
   * Reconnect to the server, optionally resetting all data if needed.
   * @method _reconnect
   * @private
   * @param {boolean} reset
   */
  _reconnect(reset) {
    // The sync manager will reissue any requests once it receives a 'connect' event from the websocket manager.
    // There is no need to have an error callback at this time.
    // Note that calls that come from sources other than the sync manager may suffer from this.
    // Once the websocket implements retry rather than the sync manager, we may need to enable it
    // to trigger a callback after sufficient time.  Just delete all callbacks.
    this.close();
    if (reset) this._reset();
    this.connect();
  }

  /**
   * Connect to the websocket server
   *
   * Note that if you'd like to see how dead websockets are handled, you can try something like this:
   *
   * ```
   * var WS = function WebSocket(url) {
      this.url = url;
      this.close = function() {};
      this.send = function(msg) {console.log("SEND ", msg);};
      this.addEventListener = function(name, callback) {
        this["on" + name] = callback;
      };
      this.removeEventListener = function() {};
      this.readyState = 1;
      setTimeout(function() {this.onopen();}.bind(this), 100);
    };
    WS.CONNECTING = 0;
    WS.OPEN = 1;
    WS.CLOSING = 2;
    WS.CLOSED = 3;
    ```
   *
   * @method connect
   * @param  {Layer.Core.SyncEvent} evt - Ignored parameter
   */
  connect(evt) {
    if (getClient().isDestroyed || !getClient().isOnline) return;
    if (this._socket) return this._reconnect();

    this._closing = false;

    // Get the URL and connect to it
    const url = `${getClient().websocketUrl}/?session_token=${getClient().sessionToken}&client-id=${getClient()._tabId}&layer-xdk-version=${packageName}-${version}`;

    logger.info('Websocket-Manager: Connecting');

    // Load up our websocket component or shim. Do it here so that unit tests can easily manipulate this value
    // which it can't do to module-scoped variables
    WebSocket = getNativeSupport('Websocket');
    try {
      this._socket = new WebSocket(url, WEBSOCKET_PROTOCOL);
    } catch (err) {
      // Errors at this point tend to show up in IE11 during unit tests;
      // slow things down a bit if this is throwing errors as the assumption is that
      // unit tests are opening too many connections.
      logger.error('Websocket-Manager: Failed to establish websocket ', err);
      setTimeout(() => this._onError(), 1000);
      return;
    }

    this._socket.addEventListener('message', this._onMessage);
    this._socket.addEventListener('close', this._onSocketClose);
    this._socket.addEventListener('open', this._onOpen);
    this._socket.addEventListener('error', this._onError);

    // Trigger a failure if it takes >= 5 seconds to establish a connection
    this._connectionFailedId = setTimeout(this._connectionFailed.bind(this), 5000);
  }

  /**
   * Clears the scheduled call to _connectionFailed that is used to insure the websocket does not get stuck
   * in CONNECTING state. This call is used after the call has completed or failed.
   *
   * @method _clearConnectionFailed
   * @private
   */
  _clearConnectionFailed() {
    if (this._connectionFailedId) {
      clearTimeout(this._connectionFailedId);
      this._connectionFailedId = 0;
    }
  }

  /**
   * Called after 5 seconds of entering CONNECTING state without getting an error or a connection.
   * Calls _onError which will cause this attempt to be stopped and another connection attempt to be scheduled.
   *
   * @method _connectionFailed
   * @private
   */
  _connectionFailed() {
    this._connectionFailedId = 0;
    const msg = 'Websocket-Manager: failed to connect to server';
    logger.warn(msg);

    // TODO: At this time there is little information on what happens when closing a websocket connection that is stuck in
    // readyState=CONNECTING.  Does it throw an error?  Does it call the onClose or onError event handlers?
    // Remove all event handlers so that calling close won't trigger any calls.
    try {
      this.isOpen = false;
      this._removeSocketEvents();
      if (this._socket) {
        this._socket.close();
        if (this._socket) this._socket = null;
      }
    } catch (e) {
      // No-op
    }

    // Now we can call our error handler.
    this._onError(new Error(msg));
  }

  /**
   * The websocket connection is reporting that its now open.
   *
   * @method _onOpen
   * @private
   */
  _onOpen() {
    this._clearConnectionFailed();
    if (this._isOpen()) {
      // this._lostConnectionCount = 0; // see _onMessage
      this._lastSkippedCounter = 0;
      this.isOpen = true;
      this.trigger('connected', { verified: false });
      logger.debug('Websocket-Manager: Connected');
      if (this._lastTimestamp) {
        this.trigger('replaying-events', { from: 'resync', why: 'reconnected' });
        this.resync(this._lastTimestamp);
      } else {
        this._enablePresence();
        this._reschedulePing();
      }
    }
  }

  /**
   * Tests to see if the websocket connection is open.  Use the isOpen property
   * for external tests.
   * @method _isOpen
   * @private
   * @returns {Boolean}
   */
  _isOpen() {
    if (!this._socket) return false;
    /* istanbul ignore if */
    // if (typeof WebSocket === 'undefined') return true;
    return this._socket && this._socket.readyState === WebSocket.OPEN;
  }

  /**
   * If not isOpen, presumably failed to connect
   * Any other error can be ignored... if the connection has
   * failed, onClose will handle it.
   *
   * @method _onError
   * @private
   * @param  {Error} err - Websocket error
   */
  _onError(err) {
    if (this._closing) return;
    this._clearConnectionFailed();
    logger.debug('Websocket-Manager: Error causing websocket to close', err);
    if (!this.isOpen) {
      this._removeSocketEvents();
      this._lostConnectionCount++;
      this.trigger('schedule-reconnect', { from: '_onError', why: 'websocket failed to open' });
      this._scheduleReconnect();
    } else {
      if (!this._hasZeroCounter) {
        logger.error('An apparrently open connection has closed without any messages; ' +
          'there may be a problem with the websocket services');
        this._lostConnectionCount++;
      }
      this._onSocketClose();
      this._socket.close();
      this._socket = null;
    }
  }

  /**
   * Shortcut method for sending a signal
   *
   *    manager.sendSignal({
          'type': 'typing_indicator',
          'object': {
            'id': this.conversation.id
          },
          'data': {
            'action': state
          }
        });
   *
   * @method sendSignal
   * @param  {Object} body - Signal body
   */
  sendSignal(body) {
    if (this._isOpen()) {
      this._socket.send(JSON.stringify({
        type: 'signal',
        body,
      }));
    }
  }

  /**
   * Shortcut to sending a Counter.read request
   *
   * @method getCounter
   * @param  {Function} callback
   * @param {boolean} callback.success
   * @param {number} callback.lastCounter
   * @param {number} callback.newCounter
   */
  getCounter(callback) {
    const tooSoon = Date.now() - this._lastGetCounterRequest < 1000;
    if (tooSoon) {
      if (!this._lastGetCounterId) {
        this._lastGetCounterId = setTimeout(() => {
          this._lastGetCounterId = 0;
          this.getCounter(callback);
        }, Date.now() - this._lastGetCounterRequest - 1000);
      }
      return;
    }
    this._lastGetCounterRequest = Date.now();
    if (this._lastGetCounterId) {
      clearTimeout(this._lastGetCounterId);
      this._lastGetCounterId = 0;
    }

    logger.debug('Websocket-Manager: getCounter request');
    getClient().socketRequestManager.sendRequest({
      data: {
        method: 'Counter.read',
      },
      callback: (result) => {
        logger.debug('Websocket-Manager: getCounter response: ' + result.data.counter);
        if (callback) {
          if (result.success) {
            callback(true, result.data.counter, result.fullData.counter);
          } else {
            callback(false);
          }
        }
      },
      isChangesArray: false,
    });
  }

  /**
   * Replays all missed change packets since the specified timestamp
   *
   * @method resync
   * @param  {string|number}   timestamp - Iso formatted date string; if number will be transformed into formatted date string.
   * @param  {Function} [callback] - Optional callback for completion
   */
  resync(timestamp, callback) {
    if (!timestamp) throw new Error(ErrorDictionary.valueNotSupported);
    if (typeof timestamp === 'number') timestamp = new Date(timestamp).toISOString();

    // Cancel any prior operation; presumably we lost connection and they're dead anyways,
    // but the callback triggering on these could be disruptive.
    getClient().socketRequestManager.cancelOperation('Event.replay');
    getClient().socketRequestManager.cancelOperation('Presence.sync');
    this._replayEvents(timestamp, () => {
      this._enablePresence(timestamp, () => {
        this.trigger('synced');
        if (callback) callback();
      });
    });
  }

  /**
   * Replays all missed change packets since the specified timestamp
   *
   * @method _replayEvents
   * @private
   * @param  {string|number}   timestamp - Iso formatted date string; if number will be transformed into formatted date string.
   * @param  {Function} [callback] - Optional callback for completion
   */
  _replayEvents(timestamp, callback) {
    // If we are simply unable to replay because we're disconnected, capture the _needsReplayFrom
    if (!this._isOpen() && !this._needsReplayFrom) {
      logger.debug('Websocket-Manager: _replayEvents updating _needsReplayFrom');
      this._needsReplayFrom = timestamp;
    } else {
      logger.info('Websocket-Manager: _replayEvents');
      getClient().socketRequestManager.sendRequest({
        data: {
          method: 'Event.replay',
          data: {
            from_timestamp: timestamp,
          },
        },
        callback: result => this._replayEventsComplete(timestamp, callback, result.success),
        isChangesArray: false,
      });
    }
  }

  /**
   * Callback for handling completion of replay.
   *
   * @method _replayEventsComplete
   * @private
   * @param  {Date}     timestamp
   * @param  {Function} callback
   * @param  {Boolean}   success
   */
  _replayEventsComplete(timestamp, callback, success) {
    if (SocketManager.ENABLE_REPLAY_RETRIES) {
      this._replayEventsCompleteWithRetries(timestamp, callback, success);
    } else {
      this._replayEventsCompleteWithoutRetries(timestamp, callback, success);
    }
  }

  /**
   * Callback for handling completion of replay if retries are disabled using
   * `SocketManager.ENABLE_REPLAY_RETRIES`
   *
   * @method _replayEventsCompleteWithRetries
   * @private
   * @param  {Date}     timestamp
   * @param  {Function} callback
   * @param  {Boolean}   success
   */
  _replayEventsCompleteWithoutRetries(timestamp, callback, success) {
    if (success) {
      this._replayRetryCount = 0;
      this._needsReplayFrom = null;
      logger.info('Websocket replay complete');
      if (callback) callback();
    } else {
      this._needsReplayFrom = null;
      logger.warn('Websocket Event.replay has failed');
    }
  }

  /**
   * Callback for handling completion of replay if retries are enabled using
   * `SocketManager.ENABLE_REPLAY_RETRIES`
   *
   * @method _replayEventsCompleteWithRetries
   * @private
   * @param  {Date}     timestamp
   * @param  {Function} callback
   * @param  {Boolean}   success
   */
  _replayEventsCompleteWithRetries(timestamp, callback, success) {
    if (success) {
      this._replayRetryCount = 0;

      // If replay was completed, and no other requests for replay, then we're done.
      if (!this._needsReplayFrom) {
        logger.info('Websocket-Manager: replay complete');
        if (callback) callback();
      }

      // If replayEvents was called during a replay, then replay
      // from the given timestamp.  If request failed, then we need to retry from _lastTimestamp
      else if (this._needsReplayFrom) {
        logger.info('Websocket-Manager: replay partially complete');
        const t = this._needsReplayFrom;
        this._needsReplayFrom = null;
        this.trigger('replaying-events', { from: '_replayEventsComplete', why: '_needsReplayFrom: ' + t });
        this._replayEvents(t);
      }
    }

    // We never got a done event; but either got an error from the server or the request timed out.
    // Use exponential backoff incremented integers that getExponentialBackoffSeconds mapping to roughly
    // 0.4 seconds - 12.8 seconds, and then stops retrying.
    else if (this._replayRetryCount < 8) {
      const maxDelay = 20;
      const backoffCounter = Math.min(this._replayRetryCount + 4, 11);
      const delay = Util.getExponentialBackoffSeconds(maxDelay, backoffCounter);
      logger.info('Websocket-Manager: replay retry in ' + delay + ' seconds');
      setTimeout(() => {
        this.trigger('replaying-events',
          { from: '_replayEventsComplete', why: '_replayRetryCount: ' + this._replayRetryCount });
        this._replayEvents(timestamp);
      }, delay * 1000);
      this._replayRetryCount++;
    } else {
      logger.error('Websocket-Manager: Event.replay has failed');
    }
  }

  /**
   * Resubscribe to presence and replay missed presence changes.
   *
   * @method _enablePresence
   * @private
   * @param  {Date}     timestamp
   * @param  {Function} callback
   */
  _enablePresence(timestamp, callback) {
    getClient().socketRequestManager.sendRequest({
      data: {
        method: 'Presence.subscribe',
      },
      callback: null,
      isChangesArray: false,
    });

    if (getClient().isPresenceEnabled) {
      getClient().socketRequestManager.sendRequest({
        data: {
          method: 'Presence.update',
          data: [
            { operation: 'set', property: 'status', value: 'auto' },
          ],
        },
        callback: null,
        isChangesArray: false,
      });

      // Once PLAT-3580 has been fixed, this entire call can be removed;
      // Server should deliver presence as a `change` event in response to the above `Presence.update`
      setTimeout(() => {
        getClient().socketRequestManager.sendRequest({
          data: {
            method: 'Presence.sync',
            data: { ids: [getClient().user.id] },
          },
          isChangesArray: true,
          operation: 'READ',
          target: null,
          depends: [],
          isPersistenceDisabled: true,
        });
      }, 200);
    }

    if (timestamp && getClient().isPresenceEnabled) {
      this.syncPresence(timestamp, callback);
    } else if (callback) {
      callback({ success: true });
    }
  }

  /**
   * Synchronize all presence data or catch up on missed presence data.
   *
   * Typically this is called by {@link Layer.Core.Websockets.SocketManager#_enablePresence} automatically,
   * but there may be occasions where an app wants to directly trigger this action.
   *
   * @method syncPresence
   * @param {String} timestamp    `Date.toISOString()` formatted string, returns all presence changes since that timestamp.  Returns all followed presence
   *       if no timestamp is provided.
   * @param {Function} [callback]   Function to call when sync is completed.
   */
  syncPresence(timestamp, callback) {
    if (timestamp) {
      // Return value for use in unit tests
      return getClient().socketRequestManager.sendRequest({
        data: {
          method: 'Presence.sync',
          data: {
            since: timestamp,
          },
        },
        isChangesArray: true,
        callback,
      });
    }
  }

  /**
   * Handles a new websocket packet from the server
   *
   * @method _onMessage
   * @private
   * @param  {Object} evt - Message from the server
   */
  _onMessage(evt) {
    this._lostConnectionCount = 0;
    try {
      const msg = JSON.parse(evt.data);
      const hasZero = msg.counter === 0;
      const isNewConnection = !this._hasZeroCounter && hasZero;
      this._hasZeroCounter = this._hasZeroCounter || hasZero;

      this._lastDataFromServerTimestamp = Date.now();

      // If we're seeing counter of 0 for the second time, our connection has been reset
      if (hasZero && !isNewConnection) {
        this.trigger('replaying-events', { from: '_onMessage', why: 'Zero Counter' });
        this.resync(this._lastTimestamp);
      } else {
        this._lastTimestamp = new Date(msg.timestamp).getTime();
        if (hasZero && isNewConnection) {
          this.trigger('connected', {
            verified: true,
          });
        }
      }

      this.trigger('message', {
        data: msg,
      });

      this._reschedulePing();
    } catch (err) {
      logger.error('Websocket-Manager:: Failed to handle websocket message: ' + err + '\n', evt.data);
    }
  }

  /**
   * Reschedule a ping request which helps us verify that the connection is still alive,
   * and that we haven't missed any events.
   *
   * @method _reschedulePing
   * @private
   */
  _reschedulePing() {
    if (this._nextPingId) {
      clearTimeout(this._nextPingId);
    }
    this._nextPingId = setTimeout(this._ping.bind(this), this.pingFrequency);
  }

  /**
   * Send a counter request to the server to verify that we are still connected and
   * have not missed any events.
   *
   * @method _ping
   * @private
   */
  _ping() {
    logger.debug('Websocket-Manager: ping');
    this._nextPingId = 0;
    if (this._isOpen()) {
      // NOTE: onMessage will already have called reschedulePing, but if there was no response, then the error handler would NOT have called it.
      this.getCounter(this._reschedulePing.bind(this));
    }
  }


  /**
   * Close the websocket.
   *
   * @method close
   */
  close() {
    logger.debug('Websocket-Manager: close requested');
    this._closing = true;
    this.isOpen = false;
    if (this._socket) {
      // Close all event handlers and set socket to null
      // without waiting for browser event to call
      // _onSocketClose as the next command after close
      // might require creating a new socket
      this._onSocketClose();
      this._socket.close();
      this._socket = null;
    }
  }

  /**
   * Send a packet across the websocket
   * @method send
   * @param {Object} obj
   */
  send(obj) {
    this._socket.send(JSON.stringify(obj));
  }

  destroy() {
    this.trigger('disconnecting', { from: 'destroy', why: 'client is being destroyed' });
    this.close();
    if (this._nextPingId) clearTimeout(this._nextPingId);
    super.destroy();
  }

  /**
   * If the socket has closed (or if the close method forces it closed)
   * Remove all event handlers and if appropriate, schedule a retry.
   *
   * @method _onSocketClose
   * @private
   */
  _onSocketClose() {
    logger.debug('Websocket-Manager: closed');
    this.isOpen = false;
    this._hasZeroCounter = false;
    if (!this._closing) {
      this.trigger('schedule-reconnect', { from: '_onSocketClose', why: 'Socket closed' });
      this._scheduleReconnect();
    }

    this._removeSocketEvents();
    this.trigger('disconnected');
  }

  /**
   * Removes all event handlers on the current socket.
   *
   * @method _removeSocketEvents
   * @private
   */
  _removeSocketEvents() {
    /* istanbul ignore if */
    if (typeof WebSocket !== 'undefined' && this._socket) {
      this._socket.removeEventListener('message', this._onMessage);
      this._socket.removeEventListener('close', this._onSocketClose);
      this._socket.removeEventListener('open', this._onOpen);
      this._socket.removeEventListener('error', this._onError);
    } else if (this._socket) {
      this._socket.onmessage = null;
      this._socket.onclose = null;
      this._socket.onopen = null;
      this._socket.onerror = null;
    }
    this._clearConnectionFailed();
  }

  /**
   * Schedule an attempt to reconnect to the server.  If the onlineManager
   * declares us to be offline, don't bother reconnecting.  A reconnect
   * attempt will be triggered as soon as the online manager reports we are online again.
   *
   * Note that the duration of our delay can not excede the onlineManager's ping frequency
   * or it will declare us to be offline while we attempt a reconnect.
   *
   * @method _scheduleReconnect
   * @private
   */
  _scheduleReconnect() {
    if (this.isDestroyed || !getClient() || !getClient().isOnline ||
      !getClient().isAuthenticated || this._isOpen()) return;

    const backoffCounter = Math.min(this._lostConnectionCount + 4, 11);


    const delay = Util.getExponentialBackoffSeconds(this.maxDelaySecondsBetweenReconnect, backoffCounter);
    this.trigger('scheduling-reconnect', { counter: backoffCounter, delay });
    logger.warn('Websocket-Manager: Reconnect in ' + delay + ' seconds');
    if (!this._reconnectId) {
      this._reconnectId = setTimeout(() => {
        this._reconnectId = 0;
        this._validateSessionBeforeReconnect();
      }, delay * 1000);
    }
  }

  /**
   * Before the scheduled reconnect can call `connect()` validate that we didn't lose the websocket
   * due to loss of authentication.
   *
   * @method _validateSessionBeforeReconnect
   * @private
   */
  _validateSessionBeforeReconnect() {
    if (this.isDestroyed || !getClient().isOnline || !getClient().isAuthenticated || this._isOpen()) return;

    getClient().xhr({
      url: '/?action=validateConnectionForWebsocket&client=' + packageName + '-' + version,
      method: 'GET',
      sync: false,
    }, (result) => {
      if (result.success) {
        this.trigger('connecting',
          { from: '_validateSessionBeforeReconnect', why: 'has valid session token' });
        this.connect();
      } else if (result.status === 401) {
        // client-authenticator.js captures this state and handles it; `connect()` will be called once reauthentication completes
      } else {
        this.trigger('schedule-reconnect',
          { from: '_validateSessionBeforeReconnect', why: 'Unexpected error: ' + result.status });
        this._scheduleReconnect();
      }
    });
  }
}

/**
 * Is the websocket connection currently open?
 * @property {Boolean} [isOpen=false]
 */
SocketManager.prototype.isOpen = false;

/**
 * setTimeout ID for calling connect()
 * @private
 * @property {Number} _reconnectId
 */
SocketManager.prototype._reconnectId = 0;

/**
 * setTimeout ID for calling _connectionFailed()
 * @private
 * @property {Number} _connectionFailedId
 */
SocketManager.prototype._connectionFailedId = 0;

SocketManager.prototype._lastTimestamp = 0;
SocketManager.prototype._lastDataFromServerTimestamp = 0;
SocketManager.prototype._hasZeroCounter = false;

SocketManager.prototype._needsReplayFrom = null;

SocketManager.prototype._replayRetryCount = 0;

SocketManager.prototype._lastGetCounterRequest = 0;
SocketManager.prototype._lastGetCounterId = 0;

/**
 * Frequency with which the websocket checks to see if any websocket notifications
 * have been missed.  This test is done by calling `getCounter`
 *
 * @property {Number} [pingFrequency=30000]
 */
SocketManager.prototype.pingFrequency = 30000;

/**
 * Delay between reconnect attempts
 *
 * @property {Number} [maxDelaySecondsBetweenReconnect=600]
 */
SocketManager.prototype.maxDelaySecondsBetweenReconnect = 600;

/**
 * The Socket Connection instance
 * @property {WebSocket} _socket
 */
SocketManager.prototype._socket = null;

/**
 * Is the websocket connection being closed by a call to close()?
 * If so, we can ignore any errors that signal the socket as closing.
 * @property {Boolean} [_closing=false]
 */
SocketManager.prototype._closing = false;

/**
 * Number of failed attempts to reconnect.
 * @property {Number} _lostConnectionCount
 */
SocketManager.prototype._lostConnectionCount = 0;

/**
 * Time (via Date.getTime()) of the last mismatched websocket counter that was detected.
 *
 * @property {Number} _lastSkippedCounter
 */
SocketManager.prototype._lastSkippedCounter = 0;

/**
 * If multiple websocket counter mismatches during this interval, refuse to try to Event.replay.
 *
 * @static
 * @property {Number} [IGNORE_SKIPPED_COUNTER_INTERVAL=60000]
 */
SocketManager.IGNORE_SKIPPED_COUNTER_INTERVAL = 60000;


/**
 * If enabled, a failure in replaying missed events will be retried. Otherwise,
 * a failure to replay missed events will accept that some data may have been lost this session,
 * but will be available next time queries refire.
 *
 * @static
 * @property {Boolean} [ENABLE_REPLAY_RETRIES=false]
 */
SocketManager.ENABLE_REPLAY_RETRIES = false;

SocketManager._supportedEvents = [
  /**
   * A data packet has been received from the server.
   * @event message
   * @param {Layer.Core.LayerEvent} layerEvent
   * @param {Object} layerEvent.data - The data that was received from the server
   */
  'message',

  /**
   * The websocket is now connected.
   * @event connected
   * @protected
   */
  'connected',

  /**
   * The websocket is no longer connected
   * @event disconnected
   * @protected
   */
  'disconnected',

  /**
   * Websocket events were missed; we are resyncing with the server
   * @event replay-begun
   */
  'syncing',

  /**
   * Websocket events were missed; we resynced with the server and are now done
   * @event replay-begun
   */
  'synced',

  /**
   * Websocket connection request is about to be made
   * @event connecting
   */
  'connecting',

  /**
   * Websocket is being closed
   *
   * @event disconnecting
   * @param {Layer.Core.LayerEvent} evt
   * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
   * @param {String} evt.why   Provides detail on why the call was made from there
   */
  'disconnecting',

  /**
   * Websocket Event.replay is about to be issued
   * @event replaying-events
   * @param {Layer.Core.LayerEvent} evt
   * @param {String} evt.from  Describes where the call to Event.replay originated from
   * @param {String} evt.why   Provides detail on why the call was made from there
   */
  'replaying-events',

  /**
   * scheduleReconnect has been called
   *
   * @event scheduling-reconnect
   * @param {Layer.Core.LayerEvent} evt
   * @param {Number} evt.counter
   * @param {Number} evt.delay
   */
  'scheduling-reconnect',

  /**
   * Websocket reconnect has been scheduled
   *
   * @event schedule-reconnect
   * @param {Layer.Core.LayerEvent} evt
   * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
   * @param {String} evt.why   Provides detail on why the call was made from there
   */
  'schedule-reconnect',

  /**
   * Websocket ignored skipped counters without checking for missed websocket data
   *
   * @event ignore-skipped-counter
   * @param {Layer.Core.LayerEvent} evt
   * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
   * @param {String} evt.why   Provides detail on why the call was made from there
   */
  'ignore-skipped-counter',
].concat(Root._supportedEvents);
Root.initClass.apply(SocketManager, [SocketManager, 'SocketManager', Core.Websockets]);
