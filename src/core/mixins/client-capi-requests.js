/**
 * Adds CAPI REST and Websocket request APIs
 *
 * @class Layer.Core.Client
 */

import { xhr, logger, generateUUID } from '../../utils';
import Core from '../namespace';
import SyncManager from '../sync-manager';
import { XHRSyncEvent, WebsocketSyncEvent } from '../sync-event';
import { timeBetweenReauths } from '../../settings';
import LayerError from '../layer-error';
import { LOCALSTORAGE_KEYS, ACCEPT } from '../../constants';
import version from '../../version';

const MAX_XHR_RETRIES = 3;

module.exports = {
  lifecycle: {

    // Listen for any websocket operations and call our handler
    constructor(options) {
      this.syncManager = new SyncManager({
        onlineManager: this.onlineManager,
        socketManager: this.socketManager,
        requestManager: this.socketRequestManager,
      });
      this._tabId = generateUUID();
    },
    destroy() {
      this.syncManager.destroy();
    },
  },
  properties: {
    /**
     * Service for managing online as well as offline server requests
     * @property {Layer.Core.SyncManager} syncManager
     */
    syncManager: null,

    /**
     * URL to Layer's Web API server.
     *
     * Only muck with this if told to by Layer Staff.
     * @property {String} [url=https://api.layer.com]
     */
    url: 'https://api.layer.com',

    /**
     * URL to Layer's Websocket server.
     *
     * Only muck with this if told to by Layer Staff.
     * @property {String} [websocketUrl=wss://websockets.layer.com]
     */
    websocketUrl: 'wss://websockets.layer.com',

    // Uniquely identify this tab even though the session token might be used in multiple tabs
    _tabId: 0,

  },
  methods: {
    /**
     * Sends a request via Websocket
     *
     * @method sendSocketRequest
     * @protected
     * @param {Object} data
     * @param {Function} callback
     */
    sendSocketRequest(data, callback) {
      const isChangesArray = Boolean(data.isChangesArray);
      if (this._wantsToBeAuthenticated && !this.isAuthenticated) this._connect();

      if (data.sync) {
        const target = data.sync.target;
        let depends = data.sync.depends;
        if (target && !depends) depends = [target];

        this.syncManager.request(new WebsocketSyncEvent({
          data: data.body,
          operation: data.method,
          returnChangesArray: isChangesArray,
          target,
          depends,
          callback,
        }));
      } else {
        if (typeof data.data === 'function') data.data = data.data();
        this.socketRequestManager.sendRequest({ data, isChangesArray, callback });
      }
    },

    /**
     * Main entry point for sending xhr requests or for queing them in the syncManager.
     *
     * This call adjust arguments for our REST server.
     *
     * @method xhr
     * @protected
     * @param  {Object}   options
     * @param  {string}   options.url - URL relative client's url: "/conversations"
     * @param  {Function} callback
     * @param  {Object}   callback.result
     * @param  {Mixed}    callback.result.data - If an error occurred, this is a Layer.Core.LayerEvent;
     *                                          If the response was application/json, this will be an object
     *                                          If the response was text/empty, this will be text/empty
     * @param  {XMLHttpRequest} callback.result.xhr - Native xhr request object for detailed analysis
     * @param  {Object}         callback.result.Links - Hash of Link headers
     * @return {Layer.Core.Client} this
     */
    xhr(options, callback) {
      if (!options.sync || !options.sync.target) {
        options.url = this._xhrFixRelativeUrls(options.url || '');
      }

      options.withCredentials = true;
      if (!options.method) options.method = 'GET';
      if (!options.headers) options.headers = {};
      this._xhrFixHeaders(options.headers);
      this._xhrFixAuth(options.headers);


      // Note: this is not sync vs async; this is syncManager vs fire it now
      if (options.sync === false) {
        this._nonsyncXhr(options, callback, 0);
      } else {
        this._syncXhr(options, callback);
      }
      return this;
    },

    /**
     * For xhr calls that go through the sync manager, queue it up.
     *
     * @method _syncXhr
     * @private
     * @param  {Object}   options
     * @param  {Function} callback
     */
    _syncXhr(options, callback) {
      if (!options.sync) options.sync = {};
      if (this._wantsToBeAuthenticated && !this.isAuthenticated) this._connect();

      const innerCallback = (result) => {
        this._xhrResult(result, callback);
      };
      const target = options.sync.target;
      let depends = options.sync.depends;
      if (target && !depends) depends = [target];

      this.syncManager.request(new XHRSyncEvent({
        url: options.url,
        data: options.data,
        telemetry: options.telemetry,
        method: options.method,
        operation: options.sync.operation || options.method,
        headers: options.headers,
        callback: innerCallback,
        target,
        depends,
      }));
    },

    /**
     * For xhr calls that don't go through the sync manager,
     * fire the request, and if it fails, refire it up to 3 tries
     * before reporting an error.  1 second delay between requests
     * so whatever issue is occuring is a tiny bit more likely to resolve,
     * and so we don't hammer the server every time there's a problem.
     *
     * @method _nonsyncXhr
     * @private
     * @param  {Object}   options
     * @param  {Function} callback
     * @param  {number}   retryCount
     */
    _nonsyncXhr(options, callback, retryCount) {
      xhr(options, (result) => {
        if ([502, 503, 504].indexOf(result.status) !== -1 && retryCount < MAX_XHR_RETRIES) {
          setTimeout(() => this._nonsyncXhr(options, callback, retryCount + 1), 1000);
        } else {
          this._xhrResult(result, callback);
        }
      });
    },

    /**
     * Fix authentication header for an xhr request
     *
     * @method _xhrFixAuth
     * @private
     * @param  {Object} headers
     */
    _xhrFixAuth(headers) {
      if (this.sessionToken && !headers.Authorization) {
        headers.authorization = 'Layer session-token="' + this.sessionToken + '"'; // eslint-disable-line
      }
    },

    /**
     * Fix relative URLs to create absolute URLs needed for CORS requests.
     *
     * @method _xhrFixRelativeUrls
     * @private
     * @param  {string} relative or absolute url
     * @return {string} absolute url
     */
    _xhrFixRelativeUrls(url) {
      let result = url;
      if (url.indexOf('https://') === -1) {
        if (url[0] === '/') {
          result = this.url + url;
        } else {
          result = this.url + '/' + url;
        }
      }
      return result;
    },

    /**
     * Fixup all headers in preparation for an xhr call.
     *
     * 1. All headers use lower case names for standard/easy lookup
     * 2. Set the accept header
     * 3. If needed, set the content-type header
     *
     * @method _xhrFixHeaders
     * @private
     * @param  {Object} headers
     */
    _xhrFixHeaders(headers) {
      // Replace all headers in arbitrary case with all lower case
      // for easy matching.
      const headerNameList = Object.keys(headers);
      headerNameList.forEach((headerName) => {
        if (headerName !== headerName.toLowerCase()) {
          headers[headerName.toLowerCase()] = headers[headerName];
          delete headers[headerName];
        }
      });

      if (!headers.accept) headers.accept = ACCEPT;

      if (!headers['content-type']) headers['content-type'] = 'application/json';

      if (!headers['layer-xdk-version']) headers['layer-xdk-version'] = version;
      if (!headers['client-id']) headers['client-id'] = this._tabId;
    },

    /**
     * Handle the result of an xhr call
     *
     * @method _xhrResult
     * @private
     * @param  {Object}   result     Standard xhr response object from the xhr lib
     * @param  {Function} [callback] Callback on completion
     */
    _xhrResult(result, callback) {
      if (this.isDestroyed) return;

      if (!result.success) {
        // Replace the response with a LayerError instance
        if (result.data && typeof result.data === 'object') {
          this._generateError(result);
        }

        // If its an authentication error, reauthenticate
        // don't call _resetSession as that wipes all data and screws with UIs, and the user
        // is still authenticated on the customer's app even if not on Layer.
        if (result.status === 401 && this._wantsToBeAuthenticated) {
          if (this.isAuthenticated) {
            const hasOldSessionToken = result.request.headers && result.request.headers.authorization;
            const oldSessionToken = hasOldSessionToken ?
              result.request.headers.authorization.replace(/^.*"(.*)".*$/, '$1')
              : '';

            // Ignore auth errors if in response to a no longer in use sessionToken
            if (oldSessionToken && this.isReady && this.sessionToken && oldSessionToken !== this.sessionToken) return;

            logger.warn('Client: SESSION EXPIRED!');
            this.isAuthenticated = false;
            this.isReady = false;
            if (global.localStorage) localStorage.removeItem(LOCALSTORAGE_KEYS.SESSIONDATA + this.appId);
            this.trigger('deauthenticated');
            if (result.data && result.data.getNonce) {
              this._authenticate(result.data.getNonce());
            }
          }

          else if (this._lastChallengeTime > Date.now() + timeBetweenReauths) {
            if (result.data && result.data.getNonce) {
              this._authenticate(result.data.getNonce());
            }
          }
        }
      }
      if (callback) callback(result);
    },

    /**
     * Transforms xhr error response into a Layer.Core.LayerEvent instance.
     *
     * Adds additional information to the result object including
     *
     * * url
     * * data
     *
     * @method _generateError
     * @private
     * @param  {Object} result - Result of the xhr call
     */
    _generateError(result) {
      result.data = new LayerError(result.data);
      if (!result.data.httpStatus) result.data.httpStatus = result.status;
      result.data.log();
    },
  },
};

Core.mixins.Client.push(module.exports);
