/**
 * The Message Class represents Messages sent amongst participants
 * of of a Conversation.
 *
 * The simplest way to create and send a message is:
 *
 *      var m = conversation.createMessage('Hello there').send();
 *      var m = channel.createMessage('Hello there').send();
 *
 * For conversations that involve notifications (primarily for Android and IOS), the more common pattern is:
 *
 *      var m = conversation.createMessage('Hello there').send({text: "Message from Fred: Hello there"});
 *
 * Channels do not at this time support notifications.
 *
 * Typically, rendering would be done as follows:
 *
 *      // Create a Layer.Core.Query that loads Messages for the
 *      // specified Conversation.
 *      var query = client.createQuery({
 *        model: Query.Message,
 *        predicate: 'conversation = "' + conversation.id + '"'
 *      });
 *
 *      // Any time the Query's data changes the 'change'
 *      // event will fire.
 *      query.on('change', function(layerEvt) {
 *        renderNewMessages(query.data);
 *      });
 *
 *      // This will call will cause the above event handler to receive
 *      // a change event, and will update query.data.
 *      conversation.createMessage('Hello there').send();
 *
 * The above code will trigger the following events:
 *
 *  * Message Instance fires
 *    * messages:sending: An event that lets you modify the message prior to sending
 *    * messages:sent: The message was received by the server
 *  * Query Instance fires
 *    * change: The query has received a new Message
 *    * change:add: Same as the change event but does not receive other types of change events
 *
 * When creating a Message there are a number of ways to structure it.
 * All of these are valid and create the same exact Message:
 *
 *      // Full API style:
 *      var m = conversation.createMessage({
 *          parts: [new Layer.Core.MessagePart({
 *              body: 'Hello there',
 *              mimeType: 'text/plain'
 *          })]
 *      });
 *
 *      // Option 1: Pass in an Object instead of an array of Layer.Core.MessageParts
 *      var m = conversation.createMessage({
 *          parts: {
 *              body: 'Hello there',
 *              mimeType: 'text/plain'
 *          }
 *      });
 *
 *      // Option 2: Pass in an array of Objects instead of an array of Layer.Core.MessageParts
 *      var m = conversation.createMessage({
 *          parts: [{
 *              body: 'Hello there',
 *              mimeType: 'text/plain'
 *          }]
 *      });
 *
 *      // Option 3: Pass in a string (automatically assumes mimeType is text/plain)
 *      // instead of an array of objects.
 *      var m = conversation.createMessage({
 *          parts: 'Hello'
 *      });
 *
 *      // Option 4: Pass in an array of strings (automatically assumes mimeType is text/plain)
 *      var m = conversation.createMessage({
 *          parts: ['Hello']
 *      });
 *
 *      // Option 5: Pass in just a string and nothing else
 *      var m = conversation.createMessage('Hello');
 *
 *      // Option 6: Use addPart.
 *      var m = converseation.createMessage();
 *      m.addPart({body: "hello", mimeType: "text/plain"});
 *
 * Key methods, events and properties for getting started:
 *
 * Properties:
 *
 * * Layer.Core.Message.id: this property is worth being familiar with; it identifies the
 *   Message and can be used in `client.getMessage(id)` to retrieve it
 *   at any time.
 * * Layer.Core.Message.internalId: This property makes for a handy unique ID for use in dom nodes.
 *   It is gaurenteed not to change during this session.
 * * Layer.Core.Message.isRead: Indicates if the Message has been read yet; set `m.isRead = true`
 *   to tell the client and server that the message has been read.
 * * Layer.Core.Message.parts: A Set of Layer.Core.MessagePart classes representing the contents of the Message.
 * * Layer.Core.Message.sentAt: Date the message was sent
 * * Layer.Core.Message.sender `userId`: Conversation participant who sent the Message. You may
 *   need to do a lookup on this id in your own servers to find a
 *   displayable name for it.
 *
 * Note that the `message.sender.isMine` boolean property is a frequently useful property:
 *
 * ```
 * if (!message.sender.isMine) {
 *    alert("You didn't send this message");
 * }
 * ```
 *
 * Methods:
 *
 * * Layer.Core.Message.send(): Sends the message to the server and the other participants.
 * * Layer.Core.Message.on() and Layer.Core.Message.off(); event listeners built on top of the `backbone-events-standalone` npm project
 *
 * Events:
 *
 * * `messages:sent`: The message has been received by the server. Can also subscribe to
 *   this event from the Layer.Core.Client which is usually simpler.
 *
 * @class  Layer.Core.Message
 * @extends Layer.Core.Syncable
 */
import { client as Client } from '../../settings';
import Core from '../namespace';
import Root from '../root';
import Syncable from './syncable';
import MessagePart from './message-part';
import Constants from '../../constants';
import Util from '../../utils';
import Identity from './identity';

class Message extends Syncable {
  /**
   * See Layer.Core.Conversation.createMessage()
   *
   * @method constructor
   * @return {Layer.Core.Message}
   */
  constructor(options = {}) {
    // Unless this is a server representation, this is a developer's shorthand;
    // fill in the missing properties around isRead/isUnread before initializing.
    if (!options.fromServer) {
      if ('isUnread' in options) {
        options.isRead = !options.isUnread && !options.is_unread;
        delete options.isUnread;
      } else {
        options.isRead = true;
      }
    } else {
      options.id = options.fromServer.id;
    }

    const parts = options.parts;
    options.parts = null;

    super(options);

    this.isInitializing = true;
    if (options && options.fromServer) {
      this._populateFromServer(options.fromServer);
      this.__updateParts(this.parts);
    } else {
      this.parts = parts || new Set();
      if (Client) this.sender = Client.user;
      this.sentAt = new Date();
    }
    this._regenerateMimeAttributesMap();
    this.isInitializing = false;
  }


  __adjustUpdatedAt(date) {
    if (typeof date === 'string') return new Date(date);
  }

  /**
   * Turn input into valid Layer.Core.MessageParts.
   *
   * This method is automatically called any time the parts
   * property is set (including during intialization).  This
   * is where we convert strings into MessageParts, and instances
   * into arrays.
   *
   * @method __adjustParts
   * @private
   * @param  {Mixed} parts -- Could be a string, array, object or MessagePart instance
   * @return {Layer.Core.MessagePart[]}
   */
  __adjustParts(parts) {
    const adjustedParts = new Set();
    if (typeof parts === 'string') {
      adjustedParts.add(new MessagePart({
        body: parts,
        mimeType: 'text/plain',
      }));
    } else if (Array.isArray(parts) || parts instanceof Set) {
      parts.forEach((part) => {
        let result;
        if (part instanceof MessagePart) {
          result = part;
        } else if (part.mime_type && !part.mimeType) {
          result = Client._createObject(part);
        } else {
          result = new MessagePart(part);
        }
        adjustedParts.add(result);
      });
    } else if (parts && typeof parts === 'object') {
      adjustedParts.add(new MessagePart(parts));
    }
    this._setupPartIds(adjustedParts);

    // If we already have parts, identify the added/removed parts and process them
    if (adjustedParts) {
      const currentParts = this.parts || new Set();
      const addedParts = [];
      const removedParts = [];
      adjustedParts.forEach((part) => {
        if (!currentParts.has(part)) addedParts.push(part);
      });
      currentParts.forEach((part) => {
        if (!adjustedParts.has(part)) removedParts.push(part);
      });

      addedParts.forEach(part => part.on('messageparts:change', this._onMessagePartChange, this));
      removedParts.forEach(part => part.destroy());
    }
    return adjustedParts;
  }

  __updateParts(parts) {
    this._regenerateMimeAttributesMap();
  }
  _regenerateMimeAttributesMap() {
    this._mimeAttributeMap = {};
    if (this.parts) this.parts.forEach(part => this._addToMimeAttributesMap(part));
  }
  _addToMimeAttributesMap(part) {
    const map = this._mimeAttributeMap;
    Object.keys(part.mimeAttributes).forEach((name) => {
      if (!(name in map)) map[name] = [];
      map[name].push({ part, value: part.mimeAttributes[name] });
    });
  }

  /**
   * Add a Layer.Core.MessagePart to this Message.
   *
   * Should only be called on an unsent Message.
   *
   * ```
   * message.addPart({mimeType: 'text/plain', body: 'Frodo really is a Dodo'});
   *
   * // OR
   * message.addPart(new Layer.Core.MessagePart({mimeType: 'text/plain', body: 'Frodo really is a Dodo'}));
   * ```
   *
   * @method addPart
   * @param  {Layer.Core.MessagePart/Object} part - A Layer.Core.MessagePart instance or a `{mimeType: 'text/plain', body: 'Hello'}` formatted Object.
   * @returns {Layer.Core.Message} this
   */
  addPart(part) {
    if (part) {
      const oldValue = this.parts ? [].concat(this.parts) : null;
      const mPart = (part instanceof MessagePart) ? part : new MessagePart(part);
      if (!this.parts.has(mPart)) this.parts.add(mPart);


      mPart.off('messageparts:change', this._onMessagePartChange, this); // if we already subscribed, don't create a redundant subscription
      mPart.on('messageparts:change', this._onMessagePartChange, this);
      if (!part.id) part.id = `${this.id}/parts/${part._tmpUUID || Util.generateUUID()}`;
      this._addToMimeAttributesMap(mPart);
      this.trigger('change', {
        property: 'parts',
        oldValue,
        newValue: this.parts,
      });
      this.trigger('part-added', { part: mPart });
    }
    return this;
  }

  /**
   * Any time a Part changes, the Message has changed; trigger the `messages:change` event.
   *
   * Currently, this only looks at changes to body or mimeType, and does not handle changes to url/rich content.
   *
   * @method _onMessagePartChange
   * @private
   * @param {Layer.Core.LayerEvent} evt
   */
  _onMessagePartChange(evt) {
    evt.changes.forEach((change) => {
      this._triggerAsync('change', {
        property: 'parts.' + change.property,
        oldValue: change.oldValue,
        newValue: change.newValue,
        part: evt.target,
      });

      // A MIME Type change is equivalent to removing the old part and adding a new part for some use cases
      if (change.property === 'mimeType') {
        this._triggerAsync('part-removed', { part: evt.target });
        this._triggerAsync('part-added', { part: evt.target });
      }
    });
  }

  /**
   * Any MessagePart that contains a textual blob should contain a string before we send.
   *
   * If a MessagePart with a Blob or File as its body were to be added to the Client,
   * The Query would receive this, deliver it to apps and the app would crash.
   * Most rendering code expecting text/plain would expect a string not a File.
   *
   * When this user is sending a file, and that file is textual, make sure
   * its actual text delivered to the UI.
   *
   * @method _readAllBlobs
   * @private
   */
  _readAllBlobs(callback) {
    let count = 0;
    const parts = this.filterParts(part => Util.isBlob(part.body) && part.isTextualMimeType());
    parts.forEach((part) => {
      Util.fetchTextFromFile(part.body, (text) => {
        part.body = text;
        count++;
        if (count === parts.length) callback();
      });
    });
    if (!parts.length) callback();
  }

  /**
   * Insures that each part is ready to send before actually sending the Message.
   *
   * @method _preparePartsForSending
   * @private
   * @param  {Object} structure to be sent to the server
   */
  _preparePartsForSending(data) {
    let count = 0;
    const parts = [];
    this.parts.forEach(part => parts.push(part)); // convert set to array so we have the index
    parts.forEach((part, index) => {
      part.once('parts:send', (evt) => {
        data.parts[index] = {
          mime_type: evt.mime_type,
          id: evt.id,
        };
        if (evt.content) data.parts[index].content = evt.content;
        if (evt.body) data.parts[index].body = evt.body;
        if (evt.encoding) data.parts[index].encoding = evt.encoding;

        count++;
        if (count === this.parts.size) {
          this._send(data);
        }
      }, this);
      part._send();
    });
  }

  /**
    * Layer.Core.Message.send() Success Callback.
    *
    * If successfully sending the message; triggers a 'sent' event,
    * and updates the message.id/url
    *
    * @method _sendResult
    * @private
    * @param {Object} messageData - Server description of the message
    */
  _sendResult({ success, data }) {
    Client._triggerAsync('state-change', {
      ended: true,
      type: 'send_' + Util.typeFromID(this.id),
      telemetryId: 'send_' + Util.typeFromID(this.id) + '_time',
      result: success,
      id: this.id,
    });
    if (this.isDestroyed) return;

    if (success) {
      this._populateFromServer(data);
      this._triggerAsync('sent');
      this._triggerAsync('change', {
        property: 'syncState',
        oldValue: Constants.SYNC_STATE.SAVING,
        newValue: Constants.SYNC_STATE.SYNCED,
      });
    } else {
      this.trigger('sent-error', { error: data });
      this.destroy();
    }
    this._setSynced();
  }

  /* NOT FOR JSDUCK
   * Standard `on()` provided by Layer.Core.Root.
   *
   * Adds some special handling of 'messages:loaded' so that calls such as
   *
   *      var m = client.getMessage('layer:///messages/123', true)
   *      .on('messages:loaded', function() {
   *          myrerender(m);
   *      });
   *      myrender(m); // render a placeholder for m until the details of m have loaded
   *
   * can fire their callback regardless of whether the client loads or has
   * already loaded the Message.
   *
   * @method on
   * @param  {string} eventName
   * @param  {Function} eventHandler
   * @param  {Object} context
   * @return {Layer.Core.Message} this
   */
  on(name, callback, context) {
    const hasLoadedEvt = name === 'messages:loaded' ||
      (name && typeof name === 'object' && name['messages:loaded']);

    if (hasLoadedEvt && !this.isLoading) {
      const callNow = name === 'messages:loaded' ? callback : name['messages:loaded'];
      Util.defer(() => callNow.apply(context));
    }
    super.on(name, callback, context);
    return this;
  }

  /**
   * Remove this Message from the system.
   *
   * This will deregister the Message, remove all events
   * and allow garbage collection.
   *
   * @method destroy
   */
  destroy() {
    Client._removeMessage(this);
    this.parts.forEach(part => part.destroy());
    this.__parts = null;

    super.destroy();
  }

  /**
   * Setup message-part ids for parts that lack that id; for locally created parts.
   *
   * @private
   * @method _setupPartIds
   * @param {Layer.Core.MessagePart[]} parts
   */
  _setupPartIds(parts) {
    // Assign IDs to preexisting Parts so that we can call getPartById()
    if (parts) {
      parts.forEach((part) => {
        if (!part.id) part.id = `${this.id}/parts/${part._tmpUUID || Util.generateUUID()}`;
      });
    }
  }

  /**
   * Populates this instance with the description from the server.
   *
   * Can be used for creating or for updating the instance.
   *
   * @method _populateFromServer
   * @protected
   * @param  {Object} m - Server description of the message
   */
  _populateFromServer(message) {
    this._inPopulateFromServer = true;
    this._runMixins('populate-from-server', [message]);
    this.id = message.id;
    this.url = message.url;
    const oldPosition = this.position;
    this.position = message.position;
    this._setupPartIds(message.parts);
    const parts = new Set();
    message.parts.forEach((part) => {
      const existingPart = this.getPartById(part.id);
      if (existingPart) {
        existingPart._populateFromServer(part);
        parts.add(existingPart);
      } else {
        const mPart = MessagePart._createFromServer(part);
        parts.add(mPart);
      }
    });
    this.parts = parts;

    this.recipientStatus = message.recipient_status || {};

    this.isRead = 'is_unread' in message ? !message.is_unread : true;

    this.sentAt = new Date(message.sent_at);
    this.receivedAt = message.received_at ? new Date(message.received_at) : undefined;
    if (!this.updatedAt || this.updatedAt.toISOString() !== message.updated_at) {
      this.updatedAt = message.updated_at ? new Date(message.updated_at) : null;
    }

    let sender;
    if (message.sender.id) {
      sender = Client.getIdentity(message.sender.id);
    }

    // Because there may be no ID, we have to bypass client._createObject and its switch statement.
    if (!sender) {
      sender = Identity._createFromServer(message.sender);
    }
    this.sender = sender;

    this._setSynced();

    if (oldPosition && oldPosition !== this.position) {
      this._triggerAsync('change', {
        oldValue: oldPosition,
        newValue: this.position,
        property: 'position',
      });
    }
    this._inPopulateFromServer = false;
  }

  /**
   * Returns the Message's Layer.Core.MessagePart with the specified the part ID.
   *
   * ```
   * var part = client.getMessagePart('layer:///messages/6f08acfa-3268-4ae5-83d9-6ca00000000/parts/0');
   * ```
   *
   * @method getPartById
   * @param {string} partId
   * @return {Layer.Core.MessagePart}
   */
  getPartById(partId) {
    const part = this.parts ? this.filterParts(aPart => aPart.id === partId)[0] : null;
    return part || null;
  }

  /**
   * Utility for filtering Message Parts since the Javascript Set object lacks a `filter` method.
   *
   * ```
   * var parts = message.filterParts(part => part.mimeType == "just/ducky");
   * ```
   *
   * @method filterParts
   * @param {Function} fn
   * @param {Set} [optionalParts]   If searching on parts from somewhere other than `this.parts`
   */
  filterParts(fn, optionalParts) {
    const result = [];
    (optionalParts || this.parts).forEach((part) => {
      if (!fn || fn(part)) result.push(part);
    });
    return result;
  }

  /**
   * Utility for filtering Message Parts by MIME Type.
   *
   * ```
   * var parts = message.filterPartsByMimeType("text/plain");
   * ```
   *
   * @method filterPartsByMimeType
   * @param {Function} fn
   */
  filterPartsByMimeType(mimeType) {
    return this.filterParts(part => part.mimeType === mimeType);
  }

  /**
   * Utility for filtering Message Parts and returning a single part.
   *
   * If no function provided just returns the first part found.
   *
   * ```
   * var randomPart = message.findPart();
   * var specificPart = message.findPart(part => part.mimeType == "dog/cat");
   * ```
   *
   * @method findPart
   * @param {Function} [fn]
   */
  findPart(fn) {
    const result = this.filterParts((part) => {
      if (fn) return fn(part);
      return true;
    });
    return result[0];
  }

  /**
   * Utility for running `map` on Message Parts  since the Javascript Set object lacks a `filter` method.
   *
   * ```
   * var parts = message.mapParts(part => part.toObject());
   * ```
   *
   * @method mapParts
   * @param {Function} fn
   * @param {Set} [optionalParts]   If searching on parts from somewhere other than `this.parts`
   */
  mapParts(fn, optionalParts) {
    const result = [];
    (optionalParts || this.parts).forEach((part) => {
      result.push(fn(part));
    });
    return result;
  }

  /**
   * Returns array of Layer.Core.MessagePart that have the specified MIME Type attribute.
   *
   * ```
   * // get all parts where mime type has "lang=en-us" in it
   * var enUsParts = message.getPartsMatchingAttribute({'lang': 'en-us'});
   *
   * // Get all parts with the specified role AND parent-node-id
   * var sourcePart = message.getPartsMatchingAttribute({'parent-node-id': 'image1', 'role': 'source'});
   * ```
   *
   * @method getPartsMatchingAttribute
   * @param {Object} matches
   * @returns {Layer.Core.MessagePart[]}
   */
  getPartsMatchingAttribute(matches) {
    let first = true;
    let results = [];
    Object.keys(matches).forEach((attributeName) => {
      const attributeValue = matches[attributeName];
      const tmpResults = (this._mimeAttributeMap[attributeName] || [])
        .filter(item => item.value === attributeValue).map(item => item.part);
      if (first) {
        results = tmpResults;
        first = false;
      } else {
        results = results.filter(item => tmpResults.indexOf(item) !== -1);
      }
    });
    return results;
  }

  /**
   * Return the Layer.Core.MessagePart that represents the root of the Message Part Tree structure for this Message.
   *
   * ```
   * var part = message.getRootPart();
   * ```
   *
   * @method getRootPart
   * @returns {Layer.Core.MessagePart}
   */
  getRootPart() {
    if (!this._rootPart) {
      this._rootPart = this.getPartsMatchingAttribute({ role: 'root' })[0] || null;
    }
    return this._rootPart;
  }

  /**
   * Creates a new Layer.Core.MessageTypeModel that represents this Message (or returns a cached version of the same).
   *
   * ```
   * var model = message.createModel();
   * ```
   *
   * @method createModel
   * @returns {Layer.Core.MessageTypeModel}
   */
  createModel() {
    if (!this._messageTypeModel) {
      const rootPart = this.getRootPart();
      if (rootPart) {
        this._messageTypeModel = rootPart.createModel();
      }
    }
    return this._messageTypeModel;
  }

  /**
   * Return the name of the Layer.Core.MessageTypeModel class that represents this Message; for use in simple tests.
   *
   * ```
   * if (message.getModelName() === "TextModel") {
   *    console.log("Yet another text message");
   * }
   * ```
   *
   * @method getModelName
   * @returns {String}
   */
  getModelName() {
    const model = this.createModel();
    return model ? model.getModelName() : '';
  }

  /**
   * If there is a single message part that has the named attribute, return its value.
   *
   * If there are 0 or more than one message parts with this attribute, returns `null` instead.
   *
   * @method getAttributeValue
   * @param {String} name
   * @returns {String}
   */
  getAttributeValue(name) {
    if (!this._mimeAttributeMap[name] || this._mimeAttributeMap[name].length > 1) return null;
    return this._mimeAttributeMap[name][0].value;
  }

  /**
   * Accepts json-patch operations for modifying recipientStatus.
   *
   * @method _handlePatchEvent
   * @private
   * @param  {Object[]} data - Array of operations
   */
  _handlePatchEvent(newValue, oldValue, paths) {
    this._inLayerParser = false;
    if (paths[0].indexOf('recipient_status') === 0) {
      this.__updateRecipientStatus(this.recipientStatus, oldValue);
    } else if (paths[0] === 'parts') {
      oldValue = this.filterParts(null, oldValue);// transform to array
      newValue = this.filterParts(null, newValue);
      const oldValueParts = oldValue.map(part => Client.getMessagePart(part.id)).filter(part => part);
      const removedParts = oldValue.filter(part => !Client.getMessagePart(part.id));
      const addedParts = newValue.filter(part => oldValueParts.indexOf(part) === -1);

      addedParts.forEach(part => this.addPart(part));

      // TODO: Should fire "messages:change" event
      removedParts.forEach(partObj => this.trigger('part-removed', { part: partObj }));
    }
    this._inLayerParser = true;
  }

  /**
   * Returns absolute URL for this resource.
   * Used by sync manager because the url may not be known
   * at the time the sync request is enqueued.
   *
   * @method _getUrl
   * @param {String} url - relative url and query string parameters
   * @return {String} full url
   * @private
   */
  _getUrl(url) {
    return this.url + (url || '');
  }

  // The sync object is a hint to the sync-manager
  _setupSyncObject(sync) {
    if (sync !== false) {
      sync = super._setupSyncObject(sync);
      if (!sync.depends) {
        sync.depends = [this.conversationId];
      } else if (sync.depends.indexOf(this.id) === -1) {
        sync.depends.push(this.conversationId);
      }
    }
    return sync;
  }


  /**
   * Get all text parts of the Message.
   *
   * Utility method for extracting all of the text/plain parts
   * and concatenating all of their bodys together into a single string.
   *
   * @method getText
   * @param {string} [joinStr='.  '] If multiple message parts of type text/plain, how do you want them joined together?
   * @return {string}
   * @removed
   */

  /**
   * Identifies whether a Message receiving the specified patch data should be loaded from the server.
   *
   * Applies only to Messages that aren't already loaded; used to indicate if a change event is
   * significant enough to load the Message and trigger change events on that Message.
   *
   * At this time there are no properties that are patched on Messages via websockets
   * that would justify loading the Message from the server so as to notify the app.
   *
   * Only recipient status changes and maybe is_unread changes are sent;
   * neither of which are relevant to an app that isn't rendering that message.
   *
   * @method _loadResourceForPatch
   * @static
   * @private
   */
  static _loadResourceForPatch(patchData) {
    return false;
  }
}

/**
 * Conversation ID or Channel ID that this Message belongs to.
 *
 * @property {string}
 * @readonly
 */
Message.prototype.conversationId = '';

/**
 * Set of Layer.Core.MessagePart objects.
 *
 * Use {@link #addPart} to modify this Set.
 *
 * @property {Layer.Core.MessagePart[]}
 * @readonly
 */
Message.prototype.parts = null;

/**
 * Time that the message was sent.
 *
 * Note that a locally created Layer.Core.Message will have a `sentAt` value even
 * though its not yet sent; this is so that any rendering code doesn't need
 * to account for `null` values.  Sending the Message may cause a slight change
 * in the `sentAt` value.
 *
 * @property {Date}
 * @readonly
 */
Message.prototype.sentAt = null;

/**
 * Time that the first delivery receipt was sent by your
 * user acknowledging receipt of the message.
 * @property {Date}
 * @readonly
 */
Message.prototype.receivedAt = null;

/**
 * Identity object representing the sender of the Message.
 *
 * Most commonly used properties of Identity are:
 * * displayName: A name for your UI
 * * userId: Name for the user as represented on your system
 * * name: Represents the name of a service if the sender was an automated system.
 *
 *      <span class='sent-by'>
 *        {message.sender.displayName || message.sender.name}
 *      </span>
 *
 * @property {Layer.Core.Identity}
 * @readonly
 */
Message.prototype.sender = null;

/**
 * Position of this message within the conversation.
 *
 * NOTES:
 *
 * 1. Deleting a message does not affect position of other Messages.
 * 2. A position is not gaurenteed to be unique (multiple messages sent at the same time could
 * all claim the same position)
 * 3. Each successive message within a conversation should expect a higher position.
 *
 * @property {Number}
 * @readonly
 */
Message.prototype.position = 0;

/**
 * Hint used by Layer.Core.Client on whether to trigger a messages:notify event.
 *
 * @property {boolean}
 * @private
 */
Message.prototype._notify = false;

/**
 * This property is here for convenience only; it will always be the opposite of isRead.
 * @property {Boolean}
 * @readonly
 */
Object.defineProperty(Message.prototype, 'isUnread', {
  enumerable: true,
  get: function get() {
    return !this.isRead;
  },
});

/**
 * A map of every Message Part attribute.
 *
 * Structure is:
 *
 * ```
 * {
 *    attributeName: [
 *      {
 *        part: partWithThisValue,
 *        value: theValue
 *      },
 *      {
 *        part: partWithThisValue,
 *        value: theValue
 *      }
 *    ],
 *    attributeName2: [...]
 * }
 * ```
 * @property {Object}
 * @private
 */
Message.prototype._mimeAttributeMap = null;

/**
 * Time that the part was last updated.
 *
 * If the part was created after the message was sent, or the part was updated after the
 * part was sent then this will have a value.
 *
 * @property {Date}
 */
Message.prototype.updatedAt = null;

Message.prototype._toObject = null;

Message.prototype._rootPart = null;
Message.prototype._messageTypeModel = null;

Message.prototype._inPopulateFromServer = false;

Message.eventPrefix = 'messages';

Message.eventPrefix = 'messages';

Message.prefixUUID = 'layer:///messages/';

Message.inObjectIgnore = Syncable.inObjectIgnore;

Message.imageTypes = [
  'image/gif',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

Message._supportedEvents = [

  /**
   * Message has been loaded from the server.
   *
   * Note that this is only used in response to the Layer.Core.Message.load() method.
   *
   * ```
   * var m = client.getMessage('layer:///messages/123', true)
   *    .on('messages:loaded', function() {
   *        myrerender(m);
   *    });
   * myrender(m); // render a placeholder for m until the details of m have loaded
   * ```
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   */
  'messages:loaded',

  /**
   * The load method failed to load the message from the server.
   *
   * Note that this is only used in response to the Layer.Core.Message.load() method.
   * @event
   * @param {Layer.Core.LayerEvent} evt
   */
  'messages:loaded-error',

  /**
   * Message deleted from the server.
   *
   * Caused by a call to Layer.Core.Message.delete() or a websocket event.
   * @param {Layer.Core.LayerEvent} evt
   * @event
   */
  'messages:delete',

  /**
   * Message is about to be sent.
   *
   * Last chance to modify or validate the message prior to sending.
   *
   *     message.on('messages:sending', function(evt) {
   *        message.addPart({mimeType: 'application/location', body: JSON.stringify(getGPSLocation())});
   *     });
   *
   * Typically, you would listen to this event more broadly using `client.on('messages:sending')`
   * which would trigger before sending ANY Messages.
   *
   * You may also use this event to modify or remove a notification:
   *
   * ```
   * client.on('messages:sending', function(evt) {
   *   if (evt.target.getModelName() === 'ResponseModel') {
   *     evt.detail.notification.text = evt.detail.notification.title = '';
   *   }
   * });
   * ```
   *
   * You may also use this event to prevent the message from being sent; typically you should destroy the message after.
   *
   * ```
   * client.on('messages:sending', function(evt) {
   *   if (evt.target.getModelName() === 'ResponseModel') {
   *     evt.cancel();
   *     evt.target.destroy();
   *    }
   * });
   * ```
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   * @param {Layer.Core.Message} evt.target
   * @param {Object} evt.detail
   * @param {Object} evt.detail.notification
   */
  'messages:sending',

  /**
   * Message has been received by the server.
   *
   * It does NOT indicate delivery to other users.
   *
   * It does NOT indicate messages sent by other users.
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   */
  'messages:sent',

  /**
   * Server failed to receive the Message.
   *
   * Message will be deleted immediately after firing this event.
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   * @param {Layer.Core.LayerEvent} evt.error
   */
  'messages:sent-error',

  /**
   * The recipientStatus property has changed.
   *
   * This happens in response to an update
   * from the server... but is also caused by marking the current user as having read
   * or received the message.
   * @event
   * @param {Layer.Core.LayerEvent} evt
   */
  'messages:change',

  /**
   * A new Message Part has been added
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   * @param {Layer.Core.MessagePart} evt.part
   */
  'messages:part-added',

  /**
   * A new Message Part has been removed
   *
   * @event
   * @param {Layer.Core.LayerEvent} evt
   * @param {Layer.Core.MessagePart} evt.part
   */
  'messages:part-removed',
].concat(Syncable._supportedEvents);

Message.mixins = Core.mixins.Message;

Root.initClass.apply(Message, [Message, 'Message', Core]);
Syncable.subclasses.push(Message);

module.exports = Message;
