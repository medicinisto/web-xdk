/**
 * Adds managing an Online Manager to the Client
 *
 * @class Layer.Core.Client
 */

import Core from '../namespace';
import OnlineManager from '../online-state-manager';
import { resetAfterOfflineDuration } from '../../settings';


module.exports = {
  events: [
    /**
     * @event online
     *
     * This event is used to detect when the client is online (connected to the server)
     * or offline (still able to accept API calls but no longer able to sync to the server).
     *
     *      client.on('online', function(evt) {
     *         if (evt.isOnline) {
     *             statusDiv.style.backgroundColor = 'green';
     *         } else {
     *             statusDiv.style.backgroundColor = 'red';
     *         }
     *      });
     *
     * @param {Object} event
     * @param {boolean} event.isOnline
     */
    'online',
  ],
  lifecycle: {

    // Listen for any websocket operations and call our handler
    constructor(options) {
      this.onlineManager = new OnlineManager({
        socketManager: this.socketManager,
      });

      this.onlineManager.on('connected', this._handleOnlineChange, this);
      this.onlineManager.on('disconnected', this._handleOnlineChange, this);
      this.on('online', this._connectionRestored.bind(this));
    },
    destroy() {
      this.onlineManager.destroy();
    },
  },
  properties: {
    /**
     * Service for managing online/offline state and events
     * @property {Layer.Core.OnlineStateManager} onlineManager
     */
    onlineManager: null,

    /**
     * Is true if the client is authenticated and connected to the server;
     *
     * Typically used to determine if there is a connection to the server.
     *
     * Typically used in conjunction with the `online` event.
     *
     * @property {boolean} [isOnline=false]
     * @readonly
     */
    isOnline: false,
  },
  methods: {
    __getIsOnline() {
      return this.onlineManager && this.onlineManager.isOnline;
    },

    /**
     * This event handler receives events from the Online State Manager and generates an event for those subscribed
     * to client.on('online')
     *
     * @method _handleOnlineChange
     * @private
     * @param {Layer.Core.LayerEvent} evt
     */
    _handleOnlineChange(evt) {
      if (!this._wantsToBeAuthenticated) return;
      const duration = evt.offlineDuration;
      const isOnline = evt.eventName === 'connected';
      const obj = { isOnline };
      if (isOnline) {
        obj.reset = duration > resetAfterOfflineDuration;

        // TODO: Use a cached nonce if it hasn't expired
        if (!this.isAuthenticated) this._connect();
      }
      this.trigger('online', obj);
    },
  },
};

Core.mixins.Client.push(module.exports);
