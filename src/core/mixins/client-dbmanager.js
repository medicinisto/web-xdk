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
 * @class Layer.Core.mixins.WebsocketOperations
 */

import Core from '../namespace';
import DbManager from '../db-manager';

module.exports = {
  roles: ['handles-load-user'],
  lifecycle: {
    constructor() {
      this.on('online', this._resetDb.bind(this));

    },

    // Listen for any websocket operations and call our handler
    destroy() {
      if (this.dbManager) this.dbManager.destroy();
    },

    authenticated() {
      if (!this.isTrustedDevice) this.isPersistenceEnabled = false;
      this._setupDbSettings();
    },

    'load-users-after-auth': function() {
      if (this.isPersistenceEnabled && this.dbManager) {
        this.dbManager.onOpen(() => this._loadUser());
      } else {
        this._loadUser();
      }
    },
    'clear-stored-data': function(callback) {
      if (this.dbManager) {
        this.dbManager.deleteTables(callback);
        return true;
      } else if (callback) {
        callback();
        return true;
      }
      return false;
    },
  },
  properties: {
    /**
     * To enable indexedDB storage of query data, set this true.  Experimental.
     *
     * @property {boolean} [isPersistenceEnabled=false]
     */
    isPersistenceEnabled: false,

    /**
     * If this Layer.Core.Client.isTrustedDevice is true, then you can control which types of data are persisted.
     *
     * Note that values here are ignored if `isPersistenceEnabled` hasn't been set to `true`.
     *
     * Properties of this Object can be:
     *
     * * identities: Write identities to indexedDB? This allows for faster initialization.
     * * conversations: Write conversations to indexedDB? This allows for faster rendering
     *                  of a Conversation List
     * * messages: Write messages to indexedDB? This allows for full offline access
     * * syncQueue: Write requests made while offline to indexedDB?  This allows the app
     *              to complete sending messages after being relaunched.
     * * sessionToken: Write the session token to localStorage for quick reauthentication on relaunching the app.
     *
     *      Layer.init({
     *        isTrustedDevice: true,
     *        persistenceFeatures: {
     *          conversations: true,
     *          identities: true,
     *          messages: false,
     *          syncQueue: false,
     *          sessionToken: true
     *        }
     *      });
     *
     * @property {Object}
     */
    persistenceFeatures: null,

    /**
     * Database Manager for read/write to IndexedDB
     * @property {Layer.Core.DbManager}
     */
    dbManager: null,
  },
  methods: {
    _setupDbSettings() {
      // If no persistenceFeatures are specified, set them all
      // to true or false to match isTrustedDevice.
      if (!this.persistenceFeatures || !this.isPersistenceEnabled) {
        let sessionToken;
        if (this.persistenceFeatures && 'sessionToken' in this.persistenceFeatures) {
          sessionToken = Boolean(this.persistenceFeatures.sessionToken);
        } else {
          sessionToken = this.isTrustedDevice;
        }
        this.persistenceFeatures = {
          conversations: this.isPersistenceEnabled,
          channels: this.isPersistenceEnabled,
          messages: this.isPersistenceEnabled,
          identities: this.isPersistenceEnabled,
          syncQueue: this.isPersistenceEnabled,
          sessionToken,
        };
      }

      // Setup the Database Manager
      if (!this.dbManager) {
        if (!DbManager) {
          if (this.isPersistenceEnabled && this.isTrustedDevice) {
            throw new Error(ErrorDictionary.dbManagerNotLoaded);
          }
        } else {
          this.dbManager = new DbManager({
            tables: this.persistenceFeatures,
            enabled: this.isPersistenceEnabled,
          });
        }
      }
    },

    _resetDb(evt) {
      if (evt.reset) {
        if (this.dbManager) {
          this.dbManager.deleteTables(() => {
            this.dbManager._open();
            this._resetAllQueries();
          });
        }
      }
    }
  },
};

Core.mixins.Client.push(module.exports);
