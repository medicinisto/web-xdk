/**
 * Adds use of a database to the Client's behaviors and properties
 *
 * @class Layer.Core.Client
 */

import Core from '../namespace';
import { ErrorDictionary } from '../layer-error';

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

    // After authenticating but before declaring ready, fetch the Identity for the current user
    'load-user-after-auth': function loadMainUser() {
      if (this.isPersistenceEnabled && this.dbManager) {
        this.dbManager.onOpen(() => this._loadUser());
      } else {
        this._loadUser();
      }
    },

    // Clear all database data
    'clear-stored-data': function clearStoredData(callback) {
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
     * @property {Object} [persistenceFeatures]
     */
    persistenceFeatures: null,

    /**
     * Database Manager for read/write to IndexedDB
     * @property {Layer.Core.DbManager} dbManager
     */
    dbManager: null,
  },
  methods: {
    /**
     * Setup which persistence features are enabled/disabled and then instantiate the DbManager.
     *
     * @method _setupDbSettings
     * @private
     */
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
        if (!Core.DbManager) {
          if (this.isPersistenceEnabled && this.isTrustedDevice) {
            throw new Error(ErrorDictionary.dbManagerNotLoaded);
          }
        } else {
          this.dbManager = new Core.DbManager({
            tables: this.persistenceFeatures,
            enabled: this.isPersistenceEnabled,
          });
        }
      }
    },

    /**
     * Deletes all data in the database
     *
     * @method _resetDb
     * @private
     * @param {Layer.Core.LayerEvent} evt
     */
    _resetDb(evt) {
      if (evt.reset) {
        if (this.dbManager) {
          this.dbManager.deleteTables(() => {
            this.dbManager._open();
            this._resetAllQueries();
          });
        }
      }
    },
  },
};

Core.mixins.Client.push(module.exports);
