/**
 * Adds handling of custom websocket operations.
 *
 * This is handled by a Client mixin rather than:
 *
 * * The Client itself so we can keep the client simple and clean
 * * The Websocket Change Manager so that the change manager does not need to know
 *   how to handle any operation on any data.  Its primarily aimed at insuring websocket
 *   events get processed, not knowing minute details of the objects.
 *
 * @class Layer.Core.Client
 */

import Util, { logger } from '../../utils';
import Core from '../namespace';
import { LOCALSTORAGE_KEYS } from '../../constants';
import { ErrorDictionary } from '../layer-error';
import Identity from '../models/identity';


module.exports = {
  events: [
    /**
     * The client is ready for action
     *
     *      client.on('ready', function(evt) {
     *          renderMyUI();
     *      });
     *
     * @event ready
     */
    'ready',

    /**
     * Fired when connected to the server.
     * Currently just means we have a nonce.
     * Not recommended for typical applications.
     * @event connected
     */
    'connected',

    /**
     * Fired when unsuccessful in obtaining a nonce.
     *
     * Not recommended for typical applications.
     * @event connected-error
     * @param {Object} event
     * @param {Layer.Core.LayerEvent} event.error
     */
    'connected-error',

    /**
     * We now have a session and any requests we send aught to work.
     * Typically you should use the ready event instead of the authenticated event.
     * @event authenticated
     */
    'authenticated',

    /**
     * Failed to authenticate your client.
     *
     * Either your identity-token was invalid, or something went wrong
     * using your identity-token.
     *
     * @event authenticated-error
     * @param {Object} event
     * @param {Layer.Core.LayerEvent} event.error
     */
    'authenticated-error',

    /**
     * This event fires when a session has expired or when `Layer.Core.Client.logout` is called.
     * Typically, it is enough to subscribe to the challenge event
     * which will let you reauthenticate; typical applications do not need
     * to subscribe to this.
     *
     * @event deauthenticated
     */
    'deauthenticated',

    /**
     * @event challenge
     * Verify the user's identity.
     *
     * This event is where you verify that the user is who we all think the user is,
     * and provide an identity token to validate that.
     *
     * ```javascript
     * client.on('challenge', function(evt) {
     *    myGetIdentityForNonce(evt.nonce, function(identityToken) {
     *      evt.callback(identityToken);
     *    });
     * });
     * ```
     *
     * @param {Object} event
     * @param {string} event.nonce - A nonce for you to provide to your identity provider
     * @param {Function} event.callback - Call this once you have an identity-token
     * @param {string} event.callback.identityToken - Identity token provided by your identity provider service
     */
    'challenge',

    /**
     * @event session-terminated
     * If your session has been terminated in such a way as to prevent automatic reconnect,
     *
     * this event will fire.  Common scenario: user has two tabs open;
     * one tab the user logs out (or you call client.logout()).
     * The other tab will detect that the sessionToken has been removed,
     * and will terminate its session as well.  In this scenario we do not want
     * to automatically trigger a challenge and restart the login process.
     */
    'session-terminated',
  ],
  lifecycle: {
    constructor() {
      this.on('ready', () => {
        setTimeout(() => {
          this._requireEvent('challenge'); // Require an event handler for reauthentication, even after ready is declared
        }, 1000);
      });
    },
    /*
     * The client is now authenticated, and doing some setup
     * before calling _clientReady.
     *
     * @method authenticated
     * @private
     */
    authenticated() {
      this._isReadyObj['load-user'] = false;

      // Before calling _clientReady, load the session owner's full Identity.
      // Or let the db-manager handle this if its been loaded (yuck, not proud of this part of the architecture)
      if (this.hasLifecycleMethod('load-user-after-auth')) {
        this._runMixins('load-user-after-auth');
      } else {
        this._loadUser();
      }
    },
  },
  properties: {
    /**
     * State variable; indicates that client is currently authenticated by the server.
     * Should never be true if isConnected is false.
     * @property {Boolean} [isAuthenticated=false]
     * @readonly
     */
    isAuthenticated: false,

    /**
     * State variable; indicates that client is currently connected to server
     * (may not be authenticated yet)
     * @property {Boolean} [isConnected=false]
     * @readonly
     */
    isConnected: false,

    /**
     * State variable; indicates that client is ready for the app to use.
     * Use the 'ready' event to be notified when this value changes to true.
     *
     * @property {boolean} [isReady=false]
     * @readonly
     */
    isReady: false,

    /**
     * State variable; indicates if the WebSDK thinks that the app WANTS to be connected.
     *
     * An app wants to be connected if it has called `connect()` or `connectWithSession()`
     * and has not called `logout()`.  A client that is connected will receive reauthentication
     * events in the form of `challenge` events.
     *
     * @property {boolean} [_wantsToBeAuthenticated=false]
     * @readonly
     */
    _wantsToBeAuthenticated: false,

    /**
     * Your Layer Application ID. Can not be changed once connected.
     *
     * To find your Layer Application ID, see your Layer Developer Dashboard.
     *
     * @property {String} appId
     */
    appId: '',

    /**
     * Your current session token that authenticates your requests.
     *
     * @property {String} [sessionToken]
     * @readonly
     */
    sessionToken: '',

    /**
     * Time that the last challenge was issued
     *
     * @property {Number} [_lastChallengeTime=0]
     * @private
     */
    _lastChallengeTime: 0,

    /**
     * If this is a trusted device, then we can write personal data to persistent memory.
     * @property {boolean} [isTrustedDevice=false]
     */
    isTrustedDevice: false,
  },
  methods: {
    /**
     * Is Persisted Session Tokens disabled?
     *
     * @method _isPersistedSessionsDisabled
     * @returns {Boolean}
     * @private
     */
    _isPersistedSessionsDisabled() {
      return !global.localStorage || (this.persistenceFeatures && !this.persistenceFeatures.sessionToken);
    },

    /**
     * Restore the sessionToken from localStorage.
     *
     * This sets the sessionToken rather than returning the token.
     *
     * @method _restoreLastSession
     * @private
     */
    _restoreLastSession() {
      if (this._isPersistedSessionsDisabled()) return;
      try {
        const sessionData = global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId];
        if (!sessionData) return;
        const parsedData = JSON.parse(sessionData);
        if (parsedData.expires < Date.now()) {
          global.localStorage.removeItem(LOCALSTORAGE_KEYS.SESSIONDATA + this.appId);
        } else {
          this.sessionToken = parsedData.sessionToken;
        }
      } catch (error) {
        // No-op
      }
    },

    /**
     * Restore the Identity for the session owner from localStorage.
     *
     * @method _restoreLastSession
     * @private
     * @return {Layer.Core.Identity}
     */
    _restoreLastUser() {
      try {
        const sessionData = global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId];
        if (!sessionData) return null;
        const userObj = JSON.parse(sessionData).user;
        return new Identity({
          isMine: true,
          fromServer: userObj,
        });
      } catch (error) {
        return null;
      }
    },

    /**
     * Has the userID changed since the last login?
     *
     * @method _hasUserIdChanged
     * @param {string} userId
     * @returns {boolean}
     * @private
     */
    _hasUserIdChanged(userId) {
      try {
        const sessionData = global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId];
        if (!sessionData) return true;
        return JSON.parse(sessionData).user.user_id !== userId;
      } catch (error) {
        return true;
      }
    },

    /**
     * Get a nonce and start the authentication process
     *
     * @method _connect
     * @private
     */
    _connect() {

      this._triggerAsync('state-change', {
        started: true,
        type: 'authentication',
        telemetryId: 'auth_time',
        id: null,
      });
      this.xhr({
        url: '/nonces',
        method: 'POST',
        sync: false,
      }, result => this._connectionResponse(result));
    },

    /**
     * Initiates the connection.
     *
     * Called by constructor().
     *
     * Will either attempt to validate the cached sessionToken by getting conversations,
     * or if no sessionToken, will call /nonces to start process of getting a new one.
     *
     * ```javascript
     * var client = Layer.init({appId: myAppId});
     * client.connect('Frodo-the-Dodo');
     * ```
     *
     * @method connect
     * @param {string} userId - User ID of the user you are logging in as
     * @returns {Layer.Core.Client} this
     */
    connect(userId = '') {
      if (!this.appId) throw new Error(ErrorDictionary.appIdMissing);
      if (this.isAuthenticated) return this;

      let user;
      this.isConnected = false;
      this._lastChallengeTime = 0;
      this._wantsToBeAuthenticated = true;
      this.user = null;
      this.onlineManager.start();
      if (!this.isTrustedDevice || !userId || this._isPersistedSessionsDisabled() || this._hasUserIdChanged(userId)) {
        this._clearStoredData();
      }


      if (this.isTrustedDevice && userId) {
        this._restoreLastSession(userId);
        user = this._restoreLastUser();
        if (user) this.user = user;
      }

      if (!this.user) {
        this.user = new Identity({
          userId,
          isMine: true,
          id: userId ? Identity.prefixUUID + encodeURIComponent(userId) : '',
        });
      }

      if (this.sessionToken && this.user.userId) {
        this._sessionTokenRestored();
      } else {
        this._connect();
      }
      return this;
    },

    /**
     * Called when authenticating new user/deauthenticating old user to clear out persistent memory.
     *
     * @method _clearStoredData
     * @private
     * @param {Function} callback
     */
    _clearStoredData(callback) {
      if (global.localStorage) localStorage.removeItem(LOCALSTORAGE_KEYS.SESSIONDATA + this.appId);
      const waitForCallback = this._runMixins('clear-stored-data', [callback]);
      if (!waitForCallback && callback) callback();
    },

    /**
     * Initiates the connection with a session token.
     *
     * This call is for use when you have received a Session Token from some other source; such as your server,
     * and wish to use that instead of doing a full auth process.
     *
     * The Client will presume the token to be valid, and will asynchronously trigger the `ready` event.
     * If the token provided is NOT valid, this won't be detected until a request is made using this token,
     * at which point the `challenge` method will trigger.
     *
     * NOTE: The `connected` event will not be triggered on this path.
     *
     * ```javascript
     * var client = Layer.init({appId: myAppId});
     * client.connectWithSession('Frodo-the-Dodo', mySessionToken);
     * ```
     *
     * @method connectWithSession
     * @param {String} userId
     * @param {String} sessionToken
     * @returns {Layer.Core.Client} this
     */
    connectWithSession(userId, sessionToken) {
      if (!this.appId) throw new Error(ErrorDictionary.appIdMissing);
      if (this.isAuthenticated) return this;

      let user;
      this.isConnected = false;
      this.user = null;
      this._lastChallengeTime = 0;
      this._wantsToBeAuthenticated = true;
      if (!userId || !sessionToken) throw new Error(ErrorDictionary.sessionAndUserRequired);
      if (!this.isTrustedDevice || this._isPersistedSessionsDisabled() || this._hasUserIdChanged(userId)) {
        this._clearStoredData();
      }
      if (this.isTrustedDevice) {
        user = this._restoreLastUser();
        if (user) this.user = user;
      }

      this.onlineManager.start();

      if (!this.user) {
        this.user = new Identity({
          userId,
          isMine: true,
        });
      }

      this.isConnected = true;
      setTimeout(() => {
        if (!this.isAuthenticated) {
          this._authComplete({ session_token: sessionToken }, false);
        }
      }, 1);
      return this;
    },

    /**
     * Called when our request for a nonce gets a response.
     *
     * If there is an error, calls _connectionError.
     *
     * If there is nonce, calls _connectionComplete.
     *
     * @method _connectionResponse
     * @private
     * @param  {Object} result
     */
    _connectionResponse(result) {
      if (!result.success) {
        this._connectionError(result.data);
      } else {
        this._connectionComplete(result.data);
      }
    },

    /**
     * We are now connected (we have a nonce).
     *
     * If we have successfully retrieved a nonce, then
     * we have entered a "connected" but not "authenticated" state.
     * Set the state, trigger any events, and then start authentication.
     *
     * @method _connectionComplete
     * @private
     * @param  {Object} result
     * @param  {string} result.nonce - The nonce provided by the server
     *
     * @fires connected
     */
    _connectionComplete(result) {
      this.isConnected = true;
      this.trigger('connected');
      this._authenticate(result.nonce);
    },

    /**
     * Called when we fail to get a nonce.
     *
     * @method _connectionError
     * @private
     * @param  {Layer.Core.LayerEvent} err
     *
     * @fires connected-error
     */
    _connectionError(error) {
      this.trigger('connected-error', { error });
    },


    /* CONNECT METHODS END */

    /* AUTHENTICATE METHODS BEGIN */

    /**
     * Start the authentication step.
     *
     * We start authentication by triggering a "challenge" event that
     * tells the app to use the nonce to obtain an identity_token.
     *
     * @method _authenticate
     * @private
     * @param  {string} nonce - The nonce to provide your identity provider service
     *
     * @fires challenge
     */
    _authenticate(nonce) {
      this._lastChallengeTime = Date.now();
      if (nonce) {
        this._requireEvent('challenge');
        this.trigger('challenge', {
          nonce,
          callback: this.answerAuthenticationChallenge.bind(this),
        });
      }
    },

    /**
     * Accept an identityToken and use it to create a session.
     *
     * Typically, this method is called using the function pointer provided by
     * the challenge event, but it can also be called directly.
     *
     *      getIdentityToken(nonce, function(identityToken) {
     *          client.answerAuthenticationChallenge(identityToken);
     *      });
     *
     * @method answerAuthenticationChallenge
     * @param  {string} identityToken - Identity token provided by your identity provider service
     */
    answerAuthenticationChallenge(identityToken) {
      // Report an error if no identityToken provided
      if (!identityToken) {
        logger.error('Client: ' + ErrorDictionary.identityTokenMissing);
        throw new Error(ErrorDictionary.identityTokenMissing);
      } else {
        const userData = Util.decode(identityToken.split('.')[1]);
        const identityObj = JSON.parse(userData);

        if (!identityObj.prn) {
          // TODO: Move to dictionary
          const err = 'Your identity token prn (user id) is empty';
          logger.error('Client: ', err);
          throw new Error(err);
        }

        if (this.user.userId && this.user.userId !== identityObj.prn) {
          logger.error('Client: ' + ErrorDictionary.invalidUserIdChange, ` '${this.user.userId}' `, ` '${identityObj.prn}' `);
          throw new Error(ErrorDictionary.invalidUserIdChange);
        }

        this.user._setUserId(identityObj.prn);

        if (identityObj.display_name) this.user.displayName = identityObj.display_name;
        if (identityObj.avatar_url) this.user.avatarUrl = identityObj.avatar_url;

        this.xhr({
          url: '/sessions',
          method: 'POST',
          sync: false,
          data: {
            identity_token: identityToken,
            app_id: this.appId,
          },
        }, result => this._authResponse(result, identityToken));
      }
    },

    /**
     * Called when our request for a sessionToken receives a response.
     *
     * @private
     * @method _authResponse
     * @param  {Object} result
     * @param  {string} identityToken
     */
    _authResponse(result, identityToken) {
      this._triggerAsync('state-change', {
        ended: true,
        type: 'authentication',
        telemetryId: 'auth_time',
        result: result.success,
      });
      if (!result.success) {
        this._authError(result.data, identityToken);
      } else {
        this._authComplete(result.data, false);
      }
    },


    /**
     * Authentication is completed, update state and trigger events.
     *
     * @method _authComplete
     * @private
     * @param  {Object} result
     * @param  {Boolean} fromPersistence
     * @param  {string} result.session_token - Session token received from the server
     *
     * @fires authenticated
     */
    _authComplete(result, fromPersistence) {
      if (this.isDestroyed) return;
      if (!result || !result.session_token) {
        throw new Error(ErrorDictionary.sessionTokenMissing);
      }
      this.sessionToken = result.session_token;

      // If _authComplete was called because we accepted an auth loaded from storage
      // we don't need to update storage.
      if (!this._isPersistedSessionsDisabled() && !fromPersistence) {
        try {
          Identity.toDbObjects([this.user], (userObjs) => {
            global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId] = JSON.stringify({
              sessionToken: this.sessionToken || '',
              user: userObjs[0],
              expires: Date.now() + (30 * 60 * 60 * 24 * 1000),
            });
          });
        } catch (e) {
          // Do nothing
        }
      }

      this._clientAuthenticated();
    },

    /**
     * Authentication has failed.
     *
     * @method _authError
     * @private
     * @param  {Layer.Core.LayerEvent} result
     * @param  {string} identityToken Not currently used
     *
     * @fires authenticated-error
     */
    _authError(error, identityToken) {
      this.trigger('authenticated-error', { error });
    },

    /**
     * Sets state and triggers events for both connected and authenticated.
     *
     * If reusing a sessionToken cached in localStorage,
     * use this method rather than _authComplete.
     *
     * @method _sessionTokenRestored
     * @private
     *
     * @fires connected, authenticated
     */
    _sessionTokenRestored() {
      this.isConnected = true;
      this.trigger('connected');
      this._clientAuthenticated();
    },

    /**
     * Load the session owner's full identity.
     *
     * Note that failure to load the identity will not prevent
     * _clientReady, but is certainly not a desired outcome.
     *
     * @method _loadUser
     */
    _loadUser() {
      // We're done if we got the full identity from localStorage.
      if (this.user.isFullIdentity) {
        this._isReadyObj['load-user'] = true;
        this._clientReadyCheck();
      } else {
        // load the user's full Identity so we have presence;
        this.user._load();
        this.user.once('identities:loaded', () => {
          this.user.off('identities:loaded-error', null, this);
          if (!this._isPersistedSessionsDisabled()) {
            this._writeSessionOwner();
            this.user.on('identities:change', this._writeSessionOwner, this);
          }
          this._isReadyObj['load-user'] = true;
          this._clientReadyCheck();
        }, this)
          .once('identities:loaded-error', (evt) => {
            this.user.off('identities:loaded', null, this);
            if (evt.error.id !== 'authentication_required') {
              if (!this.user.displayName) this.user.displayName = this.defaultOwnerDisplayName;
              this._isReadyObj['load-user'] = true;
              this._clientReadyCheck();
            }
          }, this);
      }
    },

    /**
     * Write the latest state of the Session's Identity object to localStorage
     *
     * @method _writeSessionOwner
     * @private
     */
    _writeSessionOwner() {
      try {
        // Update the session data in localStorage with our full Identity.
        const sessionData = JSON.parse(global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId]);
        Identity.toDbObjects([this.user], users => (sessionData.user = users[0]));
        global.localStorage[LOCALSTORAGE_KEYS.SESSIONDATA + this.appId] = JSON.stringify(sessionData);
      } catch (e) {
        // no-op
      }
    },

    /**
     * Deletes your sessionToken from the server, and removes all user data from the Client.
     * Call `client.connect()` to restart the authentication process.
     *
     * This call is asynchronous; some browsers (ahem, safari...) may not have completed the deletion of
     * persisted data if you
     * navigate away from the page.  Use the callback to determine when all necessary cleanup has completed
     * prior to navigating away.
     *
     * Note that while all data should be purged from the browser/device, if you are offline when this is called,
     * your session token will NOT be deleted from the web server.  Why not? Because it would involve retaining the
     * request after all of the user's data has been deleted, or NOT deleting the user's data until we are online.
     *
     * @method logout
     * @param {Function} callback
     * @return {Layer.Core.Client} this
     */
    logout(callback) {
      this._wantsToBeAuthenticated = false;
      let callbackCount = 1;
      let counter = 0;
      if (this.isAuthenticated) {
        callbackCount++;
        this.xhr({
          method: 'DELETE',
          url: '/sessions/' + escape(this.sessionToken),
          sync: false,
        }, () => {
          counter++;
          if (counter === callbackCount && callback) callback();
        });
      }

      // Clear data even if isAuthenticated is false
      // Session may have expired, but data still cached.
      this._clearStoredData(() => {
        counter++;
        if (counter === callbackCount && callback) callback();
      });

      this._resetSession();
      return this;
    },

    /**
     * Log out/clear session information.
     *
     * Use this to clear the sessionToken and all information from this session.
     *
     * @method _resetSession
     * @private
     */
    _resetSession() {
      this.isReady = false;
      this.isConnected = false;
      this.isAuthenticated = false;

      if (this.sessionToken) {
        this.sessionToken = '';
        if (global.localStorage) {
          localStorage.removeItem(LOCALSTORAGE_KEYS.SESSIONDATA + this.appId);
        }
      }

      this.trigger('deauthenticated');
      this.onlineManager.stop();

      // If the session has been reset, dump all data.
      this._cleanup();
      this._runMixins('reset', []);
    },

    /**
     * __ Methods are automatically called by property setters.
     *
     * Any attempt to execute `this.userAppId = 'xxx'` will cause an error to be thrown
     * if the client is already connected.
     *
     * @private
     * @method __adjustAppId
     * @param {string} value - New appId value
     */
    __adjustAppId() {
      if (this.isConnected || this._wantsToBeAuthenticated) throw new Error(ErrorDictionary.cantChangeIfConnected);
    },

    /**
     * __ Methods are automatically called by property setters.
     *
     * Any attempt to execute `this.user = userIdentity` will cause an error to be thrown
     * if the client is already connected.
     *
     * @private
     * @method __adjustUser
     * @param {string} user - new Identity object
     */
    __adjustUser(user) {
      if (this.isConnected && user.id !== this.__user.id) {
        throw new Error(ErrorDictionary.cantChangeIfConnected);
      }
    },
  },
};

Core.mixins.Client.push(module.exports);
