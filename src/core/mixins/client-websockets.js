/**
 * Adds use of websocket classes to the Client
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import Core from '../namespace';
import SocketManager from '../websockets/socket-manager';
import WebsocketChangeManager from '../websockets/change-manager';
import WebsocketRequestManager from '../websockets/request-manager';


const ClientWebsockets = {
  events: [
    /**
     * An operation has been received via the websocket.
     *
     * Used for custom/complex operations that cannot be handled via `udpate` requests.
     *
     * @event websocket:operation
     * @private
     */
    'websocket:operation',

    /**
     * Websocket connection request is about to be made
     * @event websocket:connecting
     */
    'websocket:connecting',

    /**
     * Websocket is being closed
     *
     * @event websocket:disconnecting
     * @param {Layer.Core.LayerEvent} evt
     * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
     * @param {String} evt.why   Provides detail on why the call was made from there
     */
    'websocket:disconnecting',

    /**
     * Websocket Event.replay is about to be issued
     * @event websocket:replaying-events
     * @param {Layer.Core.LayerEvent} evt
     * @param {String} evt.from  Describes where the call to Event.replay originated from
     * @param {String} evt.why   Provides detail on why the call was made from there
     */
    'websocket:replaying-events',

    /**
     * scheduleReconnect has been called
     *
     * @event websocket:scheduling-reconnect
     * @param {Layer.Core.LayerEvent} evt
     * @param {Number} evt.counter
     * @param {Number} evt.delay
     */
    'websocket:scheduling-reconnect',

    /**
     * Websocket reconnect has been scheduled
     *
     * @event websocket:schedule-reconnect
     * @param {Layer.Core.LayerEvent} evt
     * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
     * @param {String} evt.why   Provides detail on why the call was made from there
     */
    'websocket:schedule-reconnect',

    /**
     * Websocket ignored skipped counters without checking for missed websocket data
     *
     * @event websocket:ignore-skipped-counter
     * @param {Layer.Core.LayerEvent} evt
     * @param {String} evt.from  Describes where the call to scheduleReconnect originated from
     * @param {String} evt.why   Provides detail on why the call was made from there
     */
    'websocket:ignore-skipped-counter',
  ],
  lifecycle: {

    // Listen for any websocket operations and call our handler
    constructor(options) {
      // Setup the websocket manager; won't connect until we trigger an authenticated event
      this.socketManager = new SocketManager({
      });

      this.socketChangeManager = new WebsocketChangeManager({
        socketManager: this.socketManager,
      });

      this.socketRequestManager = new WebsocketRequestManager({
        socketManager: this.socketManager,
      });

      this.socketManager.on('connecting', evt => this.trigger('websocket:connecting'));
      this.socketManager.on('disconnecting', evt => this.trigger('websocket:disconnecting', {
        from: evt.from, why: evt.why,
      }));
      this.socketManager.on('replaying-events', evt => this.trigger('websocket:replaying-events', {
        from: evt.from, why: evt.why,
      }));
      this.socketManager.on('schedule-reconnect', evt => this.trigger('websocket:schedule-reconnect', {
        from: evt.from, why: evt.why,
      }));
      this.socketManager.on('scheduling-reconnect', evt => this.trigger('websocket:scheduling-reconnect', {
        counter: evt.counter, delay: evt.delay,
      }));
      this.socketManager.on('ignore-skipped-counter', evt => this.trigger('websocket:ignore-skipped-counter', {
        from: evt.from, why: evt.why,
      }));
    },
    destroy() {
      this.socketManager.destroy();
      this.socketChangeManager.destroy();
      this.socketRequestManager.destroy();
    },
    cleanup() {
      if (this.socketManager) this.socketManager.close();
    },
  },
  properties: {
    /**
     * Web Socket Manager
     * @property {Layer.Core.Websockets.SocketManager} socketManager
     */
    socketManager: null,

    /**
     * Web Socket Request Manager
     * @property {Layer.Core.Websockets.RequestManager} socketRequestManager
     */
    socketRequestManager: null,

    /**
     * Web Socket Manager
     * @property {Layer.Core.Websockets.ChangeManager} socketChangeManager
     */
    socketChangeManager: null,
  },
};
export default ClientWebsockets;
Core.mixins.Client.push(ClientWebsockets);
