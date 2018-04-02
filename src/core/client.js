/**
 * The Layer Client; this is the top level component for any Layer based application.

    var client = new Layer.Core.Client({
      appId: 'layer:///apps/staging/ffffffff-ffff-ffff-ffff-ffffffffffff',
      challenge: function(evt) {
        myAuthenticator({
          nonce: evt.nonce,
          onSuccess: evt.callback
        });
      },
      ready: function(client) {
        alert('I am Client; Server: Serve me!');
      }
    }).connect('Fred')
 *
 * You can also initialize this as

    var client = new Layer.Core.Client({
      appId: 'layer:///apps/staging/ffffffff-ffff-ffff-ffff-ffffffffffff'
    });

    client.on('challenge', function(evt) {
      myAuthenticator({
        nonce: evt.nonce,
        onSuccess: evt.callback
      });
    });

    client.on('ready', function(client) {
      alert('I am Client; Server: Serve me!');
    });

    client.connect('Fred');
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
 *     Layer.Core.Client.prototype.logLevel = Layer.Constants.LOG.INFO;
 *
 * or
 *
 *     var client = new Layer.Core.Client({
 *        appId: 'layer:///apps/staging/ffffffff-ffff-ffff-ffff-ffffffffffff',
 *        logLevel: Layer.Constants.LOG.INFO
 *     });
 *
 * @class  Layer.Core.Client
 * @extends Layer.Core.ClientAuthenticator
 * @mixin Layer.Core.mixins.ClientIdentities
 * @mixin Layer.Core.mixins.ClientMembership
 * @mixin Layer.Core.mixins.ClientConversations
 * @mixin Layer.Core.mixins.ClientChannels
 * @mixin Layer.Core.mixins.ClientMessages
 * @mixin Layer.Core.mixins.ClientQueries
 * @mixin Layer.Core.mixins.WebsocketOperations
 * @mixin Layer.Core.mixins.ClientMessageTypeModels
 */

import ClientAuth from './client-authenticator';
import TypingIndicatorListener from './typing-indicators/typing-indicator-listener';
import Util from '../utils';
import version from '../version';
import logger from '../utils/logger';
import Root from './root';
import TypingListener from './typing-indicators/typing-listener';
import TypingPublisher from './typing-indicators/typing-publisher';
import TelemetryMonitor from './telemetry-monitor';
import Identity from './models/identity';
import Core from './namespace';
import Settings from '../settings';

class Client extends ClientAuth {

  /*
   * Adds conversations, messages and websockets on top of the authentication client.
   * jsdocs on parent class constructor.
   */
  constructor(options) {
    super(options);
    Settings.client = this;

    this._models = {};
    this._runMixins('constructor', [options]);

    // Initialize Properties
    this._scheduleCheckAndPurgeCacheItems = [];

    this._initComponents();

    this.on('online', this._connectionRestored.bind(this));

    logger.info(Util.asciiInit(version));
  }

  /* See parent method docs */
  _initComponents() {
    super._initComponents();

    this._typingIndicators = new TypingIndicatorListener({});
    this.telemetryMonitor = new TelemetryMonitor({
      enabled: this.telemetryEnabled,
    });
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
      logger.error(e);
    }

    if (this.socketManager) this.socketManager.close();
    this._inCleanup = false;
  }

  destroy() {
    // Cleanup all resources (Conversations, Messages, etc...)
    this._cleanup();

    this._destroyComponents();
    this.telemetryMonitor.destroy();

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
    const infoEvents = [
      'conversations:add', 'conversations:remove', 'conversations:change',
      'messages:add', 'messages:remove', 'messages:change',
      'identities:add', 'identities:remove', 'identities:change',
      'challenge', 'ready',
    ];
    if (infoEvents.indexOf(eventName) !== -1) {
      if (evt && evt.isChange) {
        logger.info(`Client Event: ${eventName} ${evt.changes.map(change => change.property).join(', ')}`);
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
        logger.info(`Client Event: ${eventName} ${text}`);
      }
      if (evt) logger.debug(evt);
    } else {
      logger.debug(eventName, evt);
    }
  }

  /**
   * If the session has been reset, dump all data.
   *
   * @method _resetSession
   * @private
   */
  _resetSession() {
    this._cleanup();
    this._runMixins('reset', []);
    return super._resetSession();
  }


  /**
   * Check to see if the specified objects can safely be removed from cache.
   *
   * Removes from cache if an object is not part of any Query's result set.
   *
   * @method _checkAndPurgeCache
   * @private
   * @param  {Layer.Core.Root[]} objects - Array of Messages or Conversations
   */
  _checkAndPurgeCache(objects) {
    this._inCheckAndPurgeCache = true;
    objects.forEach((obj) => {
      if (!obj.isDestroyed && !this._isCachedObject(obj)) {
        if (obj instanceof Root === false) obj = this.getObject(obj.id);
        if (obj) obj.destroy();
      }
    });
    this._inCheckAndPurgeCache = false;
  }

  /**
   * Schedules _runScheduledCheckAndPurgeCache if needed, and adds this object
   * to the list of objects it will validate for uncaching.
   *
   * Note that any object that does not exist on the server (!isSaved()) is an object that the
   * app created and can only be purged by the app and not by the SDK.  Once its been
   * saved, and can be reloaded from the server when needed, its subject to standard caching.
   *
   * @method _scheduleCheckAndPurgeCache
   * @private
   * @param {Layer.Core.Root} object
   */
  _scheduleCheckAndPurgeCache(object) {
    if (object.isSaved()) {
      if (this._scheduleCheckAndPurgeCacheAt < Date.now()) {
        this._scheduleCheckAndPurgeCacheAt = Date.now() + Client.CACHE_PURGE_INTERVAL;
        setTimeout(() => this._runScheduledCheckAndPurgeCache(), Client.CACHE_PURGE_INTERVAL);
      }
      this._scheduleCheckAndPurgeCacheItems.push(object);
    }
  }

  /**
   * Calls _checkAndPurgeCache on accumulated objects and resets its state.
   *
   * @method _runScheduledCheckAndPurgeCache
   * @private
   */
  _runScheduledCheckAndPurgeCache() {
    if (this.isDestroyed) return; // Primarily triggers during unit tests
    const list = this._scheduleCheckAndPurgeCacheItems;
    this._scheduleCheckAndPurgeCacheItems = [];
    this._checkAndPurgeCache(list);
    this._scheduleCheckAndPurgeCacheAt = 0;
  }

  /**
   * Returns true if the specified object should continue to be part of the cache.
   *
   * Result is based on whether the object is part of the data for a Query.
   *
   * @method _isCachedObject
   * @private
   * @param  {Layer.Core.Root} obj - A Message or Conversation Instance
   * @return {Boolean}
   */
  _isCachedObject(obj) {
    const list = Object.keys(this._models.queries);
    for (let i = 0; i < list.length; i++) {
      const query = this._models.queries[list[i]];
      if (query._getItem(obj.id)) return true;
    }
    return false;
  }

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
    if (evt.reset) {
      logger.debug('Client Connection Restored; Resetting all Queries');
      if (this.dbManager) {
        this.dbManager.deleteTables(() => {
          this.dbManager._open();
          Object.keys(this._models.queries).forEach((id) => {
            const query = this._models.queries[id];
            if (query) query.reset();
          });
        });
      } else {
        Object.keys(this._models.queries).forEach((id) => {
          const query = this._models.queries[id];
          if (query) query.reset();
        });
      }
    }
  }

  /**
   * Creates a Layer.Core.TypingIndicators.TypingListener instance
   * bound to the specified dom node.
   *
   *      var typingListener = client.createTypingListener(document.getElementById('myTextBox'));
   *      typingListener.setConversation(mySelectedConversation);
   *
   * Use this method to instantiate a listener, and call
   * Layer.Core.TypingIndicators.TypingListener.setConversation every time you want to change which Conversation
   * it reports your user is typing into.
   *
   * @method createTypingListener
   * @param  {HTMLElement} inputNode - Text input to watch for keystrokes
   * @return {Layer.Core.TypingIndicators.TypingListener}
   */
  createTypingListener(inputNode) {
    return new TypingListener({
      input: inputNode,
    });
  }

  /**
   * Creates a Layer.Core.TypingIndicators.TypingPublisher.
   *
   * The TypingPublisher lets you manage your Typing Indicators without using
   * the Layer.Core.TypingIndicators.TypingListener.
   *
   *      var typingPublisher = client.createTypingPublisher();
   *      typingPublisher.setConversation(mySelectedConversation);
   *      typingPublisher.setState(Layer.Core.TypingIndicators.STARTED);
   *
   * Use this method to instantiate a listener, and call
   * Layer.Core.TypingIndicators.TypingPublisher.setConversation every time you want to change which Conversation
   * it reports your user is typing into.
   *
   * Use Layer.Core.TypingIndicators.TypingPublisher.setState to inform other users of your current state.
   * Note that the `STARTED` state only lasts for 2.5 seconds, so you
   * must repeatedly call setState for as long as this state should continue.
   * This is typically done by simply calling it every time a user hits
   * a key.
   *
   * @method createTypingPublisher
   * @return {Layer.Core.TypingIndicators.TypingPublisher}
   */
  createTypingPublisher() {
    return new TypingPublisher({});
  }

  /**
   * Get the current typing indicator state of a specified Conversation.
   *
   * Typically used to see if anyone is currently typing when first opening a Conversation.
   *
   * @method getTypingState
   * @param {String} conversationId
   */
  getTypingState(conversationId) {
    return this._typingIndicators.getState(conversationId);
  }
}

/**
 * Array of items to be checked to see if they can be uncached.
 *
 * @private
 * @property {Layer.Core.Root[]}
 */
Client.prototype._scheduleCheckAndPurgeCacheItems = null;

/**
 * Time that the next call to _runCheckAndPurgeCache() is scheduled for in ms since 1970.
 *
 * @private
 * @property {number}
 */
Client.prototype._scheduleCheckAndPurgeCacheAt = 0;


/**
 * Set to false to disable telemetry gathering.
 *
 * No content nor identifiable information is gathered, only
 * usage and performance metrics.
 *
 * @property {Boolean}
 */
Client.prototype.telemetryEnabled = true;

/**
 * Gather usage and responsiveness statistics
 *
 * @private
 */
Client.prototype.telemetryMonitor = null;

/**
 * Any  Message that is part of a Query's results are kept in memory for as long as it
 * remains in that Query.  However, when a websocket event delivers new Messages  that
 * are NOT part of a Query, how long should they stick around in memory?  Why have them stick around?
 * Perhaps an app wants to post a notification of a new Message or Conversation... and wants to keep
 * the object local for a little while.  Default is 2 hours before checking to see if
 * the object is part of a Query or can be uncached.  Value is in miliseconds.
 * @static
 * @property {number}
 */

Client.CACHE_PURGE_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours * 60 minutes per hour * 60 seconds per minute * 1000 miliseconds/second

Client._ignoredEvents = [
  'conversations:loaded',
  'conversations:loaded-error',
];

Client._supportedEvents = [
  /**
   * A Typing Indicator state has changed.
   *
   * Either a change has been received
   * from the server, or a typing indicator state has expired.
   *
   *      client.on('typing-indicator-change', function(evt) {
   *          if (evt.conversationId === myConversationId) {
   *              alert(evt.typing.join(', ') + ' are typing');
   *              alert(evt.paused.join(', ') + ' are paused');
   *          }
   *      });
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   * @param {string} conversationId - ID of the Conversation users are typing into
   * @param {string[]} typing - Array of user IDs who are currently typing
   * @param {string[]} paused - Array of user IDs who are currently paused;
   *                            A paused user still has text in their text box.
   */
  'typing-indicator-change',

].concat(ClientAuth._supportedEvents);

Client.mixins = Core.mixins.Client;

Root.initClass.apply(Client, [Client, 'Client', Core]);
module.exports = Client;
