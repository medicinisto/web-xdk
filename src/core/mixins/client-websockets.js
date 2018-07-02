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


module.exports = {
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

Core.mixins.Client.push(module.exports);
