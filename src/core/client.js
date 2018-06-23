/**
 * The Layer Client; this is the top level component for any Layer based application.
 *
 * ```
 * var client = new Layer.Core.Client({
 *   appId: 'layer:///apps/staging/ffffffff-ffff-ffff-ffff-ffffffffffff'
 * });
 *
 * client.on('challenge', function(evt) {
 *   myAuthenticator({
 *     nonce: evt.nonce,
 *     onSuccess: evt.callback
 *   });
 * });
 *
 * client.on('ready', function(client) {
 *   alert('I am Client; Server: Serve me!');
 * });
 *
 * client.connect('Fred');
 * ```
 *
 * ## API Synopsis:
 *
 * The following Properties, Methods and Events are the most commonly used ones.  See the full API below
 * for the rest of the API.
 *
 * ### Properties:
 *
 * * Layer.Core.Client.userId: User ID of the authenticated user
 * * Layer.Core.Client.appId: The ID for your application
 *
 *
 * ### Methods:
 *
 * * Layer.Core.Client.createConversation(): Create a new Layer.Core.Conversation.
 * * Layer.Core.Client.createQuery(): Create a new Layer.Core.Query.
 * * Layer.Core.Client.getMessage(): Input a Message ID, and output a Layer.Core.Message or Layer.Core.Announcement from cache.
 * * Layer.Core.Client.getConversation(): Input a Conversation ID, and output a Layer.Core.Conversation from cache.
 * * Layer.Core.Client.on() and Layer.Core.Conversation.off(): event listeners
 * * Layer.Core.Client.destroy(): Cleanup all resources used by this client, including all Messages and Conversations.
 *
 * ### Events:
 *
 * * `challenge`: Provides a nonce and a callback; you call the callback once you have an Identity Token.
 * * `ready`: Your application can now start using the Layer services
 * * `messages:notify`: Used to notify your application of new messages for which a local notification may be suitable.
 *
 * ## Logging:
 *
 * There are two ways to change the log level for Layer's logger:
 *
 * ```
 * Layer.Core.Client.prototype.logLevel = Layer.Constants.LOG.INFO;
 * ```
 *
 * or
 *
 * ```
 * var client = new Layer.Core.Client({
 *   appId: 'layer:///apps/staging/ffffffff-ffff-ffff-ffff-ffffffffffff',
 *   logLevel: Layer.Constants.LOG.INFO
 * });
 * ```
 *
 * @class Layer.Core.Client
 * @extends Layer.Core.Root
 */

import Util from '../utils';
import version from '../version';
import logger from '../utils/logger';
import Root from './root';
import Identity from './models/identity';
import Core from './namespace';
import Settings from '../settings';

class Client extends Root {

  /**
   * Create a new Client.
   *
   * This should be called via `Layer.init()`:
   *
   *      var client = Layer.init({
   *          appId: "layer:///apps/staging/uuid"
   *      });
   *
   * For trusted devices, you can enable storage of data to indexedDB and localStorage with the `isTrustedDevice` and `isPersistenceEnabled` property:
   *
   *      var client = Layer.init({
   *          appId: "layer:///apps/staging/uuid",
   *          isTrustedDevice: true,
   *          isPersistenceEnabled: true
   *      });
   *
   * @method constructor
   * @param  {Object} options
   * @param  {string} options.appId           - "layer:///apps/production/uuid"; Identifies what
   *                                            application we are connecting to.
   * @param  {string} [options.url=https://api.layer.com] - URL to log into a different REST server
   * @param {number} [options.logLevel=ERROR] - Provide a log level that is one of Layer.Constants.LOG.NONE, Layer.Constants.LOG.ERROR,
   *                                            Layer.Constants.LOG.WARN, Layer.Constants.LOG.INFO, Layer.Constants.LOG.DEBUG
   * @param {boolean} [options.isTrustedDevice=false] - If this is not a trusted device, no data will be written to indexedDB nor localStorage,
   *                                            regardless of any values in Layer.Core.Client.persistenceFeatures.
   * @param {Object} [options.isPersistenceEnabled=false] If Layer.Core.Client.isPersistenceEnabled is true, then indexedDB will be used to manage a cache
   *                                            allowing Query results, messages sent, and all local modifications to be persisted between page reloads.
   */
  constructor(options) {
    super(options);
    Settings.client = this;
    this._isReadyObj = {};

    this._models = {};
    this._runMixins('constructor', [options]);

    logger.info(Util.asciiInit(version));
  }

  /**
   * The client is now authenticated, and doing some setup
   * before calling _clientReady.
   *
   * @method _clientAuthenticated
   * @private
   */
  _clientAuthenticated() {
    this._isReadyObj = {};
    this.isAuthenticated = true;
    this._runMixins('authenticated');
    this.trigger('authenticated');
    this._clientReadyCheck();
  }

  /**
   * Tests to see if the client is _really_ ready, and if so triggers the `ready` event.
   *
   * @method _clientReadyCheck
   * @private
   */
  _clientReadyCheck() {
    const notReady = Object.keys(this._isReadyObj).filter(keyName => !this._isReadyObj[keyName]);
    if (!notReady.length) this._clientReady();
  }

  /**
   * Sets the client to be ready and triggers the `ready` event
   *
   * @method _clientReady
   * @private
   */
  _clientReady() {
    if (!this.isReady) {
      this.isReady = true;
      this.trigger('ready');
    }
  }

  /**
   * Cleanup all resources (Conversations, Messages, etc...) prior to destroy or reauthentication.
   *
   * @method _cleanup
   * @private
   */
  _cleanup() {
    if (this.isDestroyed) return;
    this._inCleanup = true;

    try {
      this._runMixins('cleanup', []);
    } catch (e) {
      logger.error('Client: _cleanup Error', e);
    }

    this._inCleanup = false;
  }

  destroy() {
    // Cleanup all resources (Conversations, Messages, etc...)
    this._cleanup();

    try {
      this._runMixins('destroy', []);
    } catch (e) {
      logger.error('Client: destroy Error', e);
    }

    super.destroy();
    this._inCleanup = false;

    Settings.client = null;
  }

  /**
   * Takes an array of Identity instances, User IDs, Identity IDs, Identity objects,
   * or Server formatted Identity Objects and returns an array of Identity instances.
   *
   * @method _fixIdentities
   * @private
   * @param {Mixed[]} identities - Something that tells us what Identity to return
   * @return {Layer.Core.Identity[]}
   */
  _fixIdentities(identities) {
    return identities.map((identity) => {
      if (identity instanceof Identity) return identity;
      if (typeof identity === 'string') {
        return this.getIdentity(identity, true);
      } else if (identity && typeof identity === 'object') {
        if ('userId' in identity) {
          return this.getIdentity(identity.id || identity.userId);
        } else if ('user_id' in identity) {
          return this._createObject(identity);
        }
      }
      return null;
    }).filter(identity => identity);
  }


  /**
   * Takes as input an object id, and either calls getConversation() or getMessage() as needed.
   *
   * Will only get cached objects, will not get objects from the server.
   *
   * This is not a public method mostly so there's no ambiguity over using getXXX
   * or getObject.  getXXX typically has an option to load the resource, which this
   * does not.
   *
   * @method getObject
   * @param  {string} id - Message, Conversation or Query id
   * @param  {boolean} [canLoad=false] - Pass true to allow loading a object from
   *                                     the server if not found (not supported for all objects)
   * @return {Layer.Core.Message|Layer.Core.Conversation|Layer.Core.Query}
   */
  getObject(id, canLoad = false) {
    switch (Util.typeFromID(id || '')) {
      case 'messages':
      case 'announcements':
        return this.getMessage(id, canLoad);
      case 'parts':
        return this.getMessagePart(id);
      case 'conversations':
        return this.getConversation(id, canLoad);
      case 'channels':
        return this.getChannel(id, canLoad);
      case 'queries':
        return this.getQuery(id);
      case 'identities':
        return this.getIdentity(id, canLoad);
      case 'members':
        return this.getMember(id, canLoad);
    }
    return null;
  }


  /**
   * Takes an object description from the server and either updates it (if cached)
   * or creates and caches it .
   *
   * @method _createObject
   * @protected
   * @param  {Object} obj - Plain javascript object representing a Message or Conversation
   */
  _createObject(obj) {
    const item = this.getObject(obj.id);
    if (item) {
      item._populateFromServer(obj);
      return item;
    } else {
      switch (Util.typeFromID(obj.id)) {
        case 'parts':
          return this._createMessagePartFromServer(obj);
        case 'messages':
          if (obj.conversation) {
            return this._createConversationMessageFromServer(obj);
          } else if (obj.channel) {
            return this._createChannelMessageFromServer(obj);
          }
          break;
        case 'announcements':
          return this._createAnnouncementFromServer(obj);
        case 'conversations':
          return this._createConversationFromServer(obj);
        case 'channels':
          return this._createChannelFromServer(obj);
        case 'identities':
          return this._createIdentityFromServer(obj);
        case 'members':
          return this._createMembershipFromServer(obj);
      }
    }
    return null;
  }

  /**
   * When a Layer.Core.Container's ID changes, we need to update
   * a variety of things and trigger events.
   *
   * @method _updateContainerId
   * @param {Layer.Core.Container} container
   * @param {String} oldId
   */
  _updateContainerId(container, oldId) {
    if (container.id.match(/\/conversations\//)) {
      this._updateConversationId(container, oldId);
    } else {
      this._updateChannelId(container, oldId);
    }
  }

  /**
   * Merge events into smaller numbers of more complete events.
   *
   * Before any delayed triggers are fired, fold together all of the conversations:add
   * and conversations:remove events so that 100 conversations:add events can be fired as
   * a single event.
   *
   * @method _processDelayedTriggers
   * @private
   */
  _processDelayedTriggers() {
    if (this.isDestroyed) return;

    const addConversations = this._delayedTriggers.filter(evt => evt[0] === 'conversations:add');
    const removeConversations = this._delayedTriggers.filter(evt => evt[0] === 'conversations:remove');
    this._foldEvents(addConversations, 'conversations', this);
    this._foldEvents(removeConversations, 'conversations', this);

    const addMessages = this._delayedTriggers.filter(evt => evt[0] === 'messages:add');
    const removeMessages = this._delayedTriggers.filter(evt => evt[0] === 'messages:remove');

    this._foldEvents(addMessages, 'messages', this);
    this._foldEvents(removeMessages, 'messages', this);

    const addIdentities = this._delayedTriggers.filter(evt => evt[0] === 'identities:add');
    const removeIdentities = this._delayedTriggers.filter(evt => evt[0] === 'identities:remove');

    this._foldEvents(addIdentities, 'identities', this);
    this._foldEvents(removeIdentities, 'identities', this);

    super._processDelayedTriggers();
  }

  trigger(eventName, evt) {
    this._triggerLogger(eventName, evt);
    return super.trigger(eventName, evt);
  }

  /**
   * Does logging on all triggered events.
   *
   * All logging is done at `debug` or `info` levels.
   *
   * @method _triggerLogger
   * @private
   */
  _triggerLogger(eventName, evt) {
    if (Client.LoggedEvents.indexOf(eventName) !== -1) {
      if (evt && evt.isChange) {
        logger.info(`${eventName}: (${evt.changes.map(change => change.property).join(', ')})`, evt.target);
      } else {
        let text = '';
        if (evt) {
          // If the triggered event has these messages, use a simpler way of rendering info about them
          if (evt.message) text = evt.message.id;
          if (evt.messages) text = evt.messages.length + ' messages';
          if (evt.conversation) text = evt.conversation.id;
          if (evt.conversations) text = evt.conversations.length + ' conversations';
          if (evt.channel) text = evt.channel.id;
          if (evt.channels) text = evt.channels.length + ' channels';
        }
        logger.info(`${eventName}: ${text}`, evt ? evt.target : null);
      }
      if (evt) logger.debug(eventName, evt);
    }
  }

  _checkAndPurgeCache() {} // No-op; see Mixins
  _scheduleCheckAndPurgeCache() {} // No-op; see Mixins

  /**
   * On restoring a connection, determine what steps need to be taken to update our data.
   *
   * A reset boolean property is passed; set based on  Layer.Core.ClientAuthenticator.ResetAfterOfflineDuration.
   *
   * Note it is possible for an application to have logic that causes queries to be created/destroyed
   * as a side-effect of Layer.Core.Query.reset destroying all data. So we must test to see if queries exist.
   *
   * @method _connectionRestored
   * @private
   * @param {boolean} reset - Should the session reset/reload all data or attempt to resume where it left off?
   */
  _connectionRestored(evt) {
    if (evt.reset && !this.dbManager) {
      this._resetAllQueries();
    }
  }

  _resetAllQueries() {
    logger.debug('Client Connection Restored; Resetting all Queries');
    Object.keys(this._models.queries).forEach((id) => {
      const query = this._models.queries[id];
      if (query) query.reset();
    });
  }
}

/**
 * Log levels; one of:
 *
 *    * Layer.Constants.LOG.NONE
 *    * Layer.Constants.LOG.ERROR
 *    * Layer.Constants.LOG.WARN
 *    * Layer.Constants.LOG.INFO
 *    * Layer.Constants.LOG.DEBUG
 *
 * @property {number} logLevel
 */
Object.defineProperty(Client.prototype, 'logLevel', {
  enumerable: false,
  get: function get() { return logger.level; },
  set: function set(value) { logger.level = value; },
});

Client._ignoredEvents = [
  'conversations:loaded',
  'conversations:loaded-error',
];

Client._supportedEvents = [
  /**
   * @event analytics
   * See https://docs.layer.com for more details on these events
   */
  'analytics',
].concat(Root._supportedEvents);

/**
 * List of event names that get logged by the Client whenever the Client triggers them.
 *
 * @property {String[]} LoggedEvents
 * @static
 */
Client.LoggedEvents = [
  'conversations:add', 'conversations:remove', 'conversations:change',
  'messages:add', 'messages:remove', 'messages:change',
  'identities:add', 'identities:remove', 'identities:change',
  'challenge', 'ready',
];

Client.mixins = Core.mixins.Client;

Root.initClass.apply(Client, [Client, 'Client', Core]);
module.exports = Client;

