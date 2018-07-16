/**
 * Adds Conversation handling to the Layer.Core.Client.
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import Conversation from '../models/conversation';
import { ErrorDictionary } from '../layer-error';
import ConversationMessage from '../models/conversation-message';
import Core from '../namespace';

const ClientConversation =  {
  events: [
    /**
     * One or more Layer.Core.Conversation objects have been added to the client.
     *
     * They may have been added via the websocket, or via the user creating
     * a new Conversation locally.
     *
     *      client.on('conversations:add', function(evt) {
     *          evt.conversations.forEach(function(conversation) {
     *              myView.addConversation(conversation);
     *          });
     *      });
     *
     * @event conversations:add
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.Conversation[]} evt.conversations - Array of conversations added
     */
    'conversations:add',

    /**
     * One or more Layer.Core.Conversation objects have been removed.
     *
     * A removed Conversation is not necessarily deleted, its just
     * no longer being held in local memory.
     *
     * Note that typically you will want the `conversations:delete` event
     * rather than `conversations:remove`.
     *
     *      client.on('conversations:remove', function(evt) {
     *          evt.conversations.forEach(function(conversation) {
     *              myView.removeConversation(conversation);
     *          });
     *      });
     *
     * @event conversations:remove
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.Conversation[]} evt.conversations - Array of conversations removed
     */
    'conversations:remove',

    /**
     * The conversation is now on the server.
     *
     * Called after creating the conversation
     * on the server.  The Result property is one of:
     *
     * * Layer.Core.Conversation.CREATED: A new Conversation has been created
     * * Layer.Core.Conversation.FOUND: A matching Distinct Conversation has been found
     * * Layer.Core.Conversation.FOUND_WITHOUT_REQUESTED_METADATA: A matching Distinct Conversation has been found
     *                       but note that the metadata is NOT what you requested.
     *
     * All of these results will also mean that the updated property values have been
     * copied into your Conversation object.  That means your metadata property may no
     * longer be its initial value; it will be the value found on the server.
     *
     *      client.on('conversations:sent', function(evt) {
     *          switch(evt.result) {
     *              case Conversation.CREATED:
     *                  alert(evt.target.id + ' Created!');
     *                  break;
     *              case Conversation.FOUND:
     *                  alert(evt.target.id + ' Found!');
     *                  break;
     *              case Conversation.FOUND_WITHOUT_REQUESTED_METADATA:
     *                  alert(evt.target.id + ' Found, but does not have the requested metadata!');
     *                  break;
     *          }
     *      });
     *
     * @event conversations:sent
     * @param {Layer.Core.LayerEvent} event
     * @param {string} event.result
     * @param {Layer.Core.Conversation} target
     */
    'conversations:sent',

    /**
     * A conversation failed to load or create on the server.
     *
     *      client.on('conversations:sent-error', function(evt) {
     *          alert(evt.data.message);
     *      });
     *
     * @event conversations:sent-error
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.LayerEvent} evt.data
     * @param {Layer.Core.Conversation} target
     */
    'conversations:sent-error',

    /**
     * A conversation had a change in its properties.
     *
     * This change may have been delivered from a remote user
     * or as a result of a local operation.
     *
     *      client.on('conversations:change', function(evt) {
     *          var metadataChanges = evt.getChangesFor('metadata');
     *          var participantChanges = evt.getChangesFor('participants');
     *          if (metadataChanges.length) {
     *              myView.renderTitle(evt.target.metadata.title);
     *          }
     *          if (participantChanges.length) {
     *              myView.renderParticipants(evt.target.participants);
     *          }
     *      });
     *
     * NOTE: Typically such rendering is done using Events on Layer.Core.Query.
     *
     * @event conversations:change
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.Conversation} evt.target
     * @param {Object[]} evt.changes
     * @param {Mixed} evt.changes.newValue
     * @param {Mixed} evt.changes.oldValue
     * @param {string} evt.changes.property - Name of the property that has changed
     */
    'conversations:change',

    /**
     * A call to Layer.Core.Conversation.load has completed successfully
     *
     * ```
     * // Returns empty conversation object if not locally cached
     * var conversation = client.getConversation(id, true);
     *
     * // This event handler will be called whether its locally cached or not
     * conversation.on("conversations:loaded", function() {
     *    console.log(conversation.participants); // returns participants
     * });
     * ```
     *
     * @event conversations:loaded
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.Conversation} evt.target
     */
    'conversations:loaded',

    /**
     * A Conversation has been deleted from the server.
     *
     * Caused by either a successful call to Layer.Core.Conversation.delete() on the Conversation
     * or by a remote user.
     *
     *      client.on('conversations:delete', function(evt) {
     *          myView.removeConversation(evt.target);
     *      });
     *
     * @event conversations:delete
     * @param {Layer.Core.LayerEvent} evt
     * @param {Layer.Core.Conversation} evt.target
     */
    'conversations:delete',
  ],
  lifecycle: {
    constructor(options) {
      this._models.conversations = {};
    },
    cleanup() {
      Object.keys(this._models.conversations || {}).forEach((id) => {
        const conversation = this._models.conversations[id];
        if (conversation && !conversation.isDestroyed) {
          conversation.destroy();
        }
      });
      this._models.conversations = null;
    },

    reset() {
      this._models.conversations = {};
    },
  },
  methods: {
    /**
     * Retrieve a conversation by Identifier.
     *
     *      var c = client.getConversation('layer:///conversations/uuid');
     *
     * If there is not a conversation with that id, it will return null.
     *
     * If you want it to load it from cache and then from server if not in cache, use the `canLoad` parameter.
     * If loading from the server, the method will return
     * a Layer.Core.Conversation instance that has no data; the `conversations:loaded` / `conversations:loaded-error` events
     * will let you know when the conversation has finished/failed loading from the server.
     *
     *      var c = client.getConversation('layer:///conversations/123', true)
     *      .on('conversations:loaded', function() {
     *          // Render the Conversation with all of its details loaded
     *          myrerender(c);
     *      });
     *      // Render a placeholder for c until the details of c have loaded
     *      myrender(c);
     *
     * Note in the above example that the `conversations:loaded` event will trigger even if the Conversation has previously loaded.
     *
     * @method getConversation
     * @param  {string} id
     * @param  {boolean} [canLoad=false] - Pass true to allow loading a conversation from
     *                                    the server if not found
     * @return {Layer.Core.Conversation}
     */
    getConversation(id, canLoad) {
      let result = null;
      if (typeof id !== 'string') throw new Error(ErrorDictionary.idParamRequired);
      if (!Conversation.isValidId(id)) {
        id = Conversation.prefixUUID + id;
      }
      if (this._models.conversations[id]) {
        result = this._models.conversations[id];
      } else if (canLoad) {
        if (!this.isReady) throw new Error(ErrorDictionary.clientMustBeReady);
        result = Conversation.load(id);
      }
      if (canLoad) result._loadType = 'fetched';
      return result;
    },

    /**
     * Adds a conversation to the client.
     *
     * Typically, you do not need to call this; the following code
     * automatically calls _addConversation for you:
     *
     *      var conv = client.createConversation(['a', 'b']);
     *
     * @method _addConversation
     * @protected
     * @param  {Layer.Core.Conversation} c
     */
    _addConversation(conversation) {
      const id = conversation.id;
      if (!this._models.conversations[id]) {
        // Register the Conversation
        this._models.conversations[id] = conversation;

        // Make sure the client is set so that the next event bubbles up
        this._triggerAsync('conversations:add', { conversations: [conversation] });
      }
    },

    /**
     * Removes a conversation from the client.
     *
     * Typically, you do not need to call this; the following code
     * automatically calls _removeConversation for you:
     *
     *      conversation.destroy();
     *
     * @method _removeConversation
     * @protected
     * @param  {Layer.Core.Conversation} c
     */
    _removeConversation(conversation) {
      // Insure we do not get any events, such as message:remove
      conversation.off(null, null, this);

      if (this._models.conversations[conversation.id]) {
        delete this._models.conversations[conversation.id];
        this._triggerAsync('conversations:remove', { conversations: [conversation] });
      }

      // Remove any Message associated with this Conversation
      Object.keys(this._models.messages).forEach((id) => {
        if (this._models.messages[id].conversationId === conversation.id) {
          this._models.messages[id].destroy();
        }
      });
    },

    /**
     * If the Conversation ID changes, we need to reregister the Conversation
     *
     * @method _updateConversationId
     * @protected
     * @param  {Layer.Core.Conversation} conversation - Conversation whose ID has changed
     * @param  {string} oldId - Previous ID
     */
    _updateConversationId(conversation, oldId) {
      if (this._models.conversations[oldId]) {
        this._models.conversations[conversation.id] = conversation;
        delete this._models.conversations[oldId];

        // This is a nasty way to work... but need to find and update all
        // conversationId properties of all Messages or the Query's won't
        // see these as matching the query.
        Object.keys(this._models.messages)
          .filter(id => this._models.messages[id].conversationId === oldId)
          .forEach(id => (this._models.messages[id].conversationId = conversation.id));
      }
    },


    /**
     * Searches locally cached conversations for a matching conversation.
     *
     * Iterates over conversations calling a matching function until
     * the conversation is found or all conversations tested.
     *
     *      var c = client.findCachedConversation(function(conversation) {
     *          if (conversation.participants.indexOf('a') != -1) return true;
     *      });
     *
     * @method findCachedConversation
     * @param  {Function} f - Function to call until we find a match
     * @param  {Layer.Core.Conversation} f.conversation - A conversation to test
     * @param  {boolean} f.return - Return true if the conversation is a match
     * @param  {Object} [context] - Optional context for the *this* object
     * @return {Layer.Core.Conversation}
     *
     * @deprecated
     * This should be replaced by iterating over your Layer.Core.Query data.
     */
    findCachedConversation(func, context) {
      const test = context ? func.bind(context) : func;
      const list = Object.keys(this._models.conversations);
      const len = list.length;
      for (let index = 0; index < len; index++) {
        const key = list[index];
        const conversation = this._models.conversations[key];
        if (test(conversation, index)) return conversation;
      }
      return null;
    },

    /**
     * This method is recommended way to create a Conversation.
     *
     * There are a few ways to invoke it; note that the default behavior is to create a Distinct Conversation
     * unless otherwise stated via the Layer.Core.Conversation.distinct property.
     *
     *         client.createConversation({participants: ['a', 'b']});
     *         client.createConversation({participants: [userIdentityA, userIdentityB]});
     *
     *         client.createConversation({
     *             participants: ['a', 'b'],
     *             distinct: false
     *         });
     *
     *         client.createConversation({
     *             participants: ['a', 'b'],
     *             metadata: {
     *                 title: 'I am a title'
     *             }
     *         });
     *
     * If you try to create a Distinct Conversation that already exists,
     * you will get back an existing Conversation, and any requested metadata
     * will NOT be set; you will get whatever metadata the matching Conversation
     * already had.
     *
     * The default value for distinct is `true`.
     *
     * Whether the Conversation already exists or not, a 'conversations:sent' event
     * will be triggered asynchronously and the Conversation object will be ready
     * at that time.  Further, the event will provide details on the result:
     *
     *       var conversation = client.createConversation({
     *          participants: ['a', 'b'],
     *          metadata: {
     *            title: 'I am a title'
     *          }
     *       });
     *       conversation.on('conversations:sent', function(evt) {
     *           switch(evt.result) {
     *               case Conversation.CREATED:
     *                   alert(conversation.id + ' was created');
     *                   break;
     *               case Conversation.FOUND:
     *                   alert(conversation.id + ' was found');
     *                   break;
     *               case Conversation.FOUND_WITHOUT_REQUESTED_METADATA:
     *                   alert(conversation.id + ' was found but it already has a title so your requested title was not set');
     *                   break;
     *            }
     *       });
     *
     * Warning: This method will throw an error if called when you are not (or are no longer) an authenticated user.
     * That means if authentication has expired, and you have not yet reauthenticated the user, this will throw an error.
     *
     *
     * @method createConversation
     * @param  {Object} options
     * @param {string[] | Layer.Core.Identity[]} [options.participants] - Array of UserIDs or UserIdentities
     * @param {Boolean} [options.distinct=true] Is this a distinct Conversation?
     * @param {Object} [options.metadata={}] Metadata for your Conversation
     * @return {Layer.Core.Conversation}
     */
    createConversation(options) {
      // If we aren't authenticated, then we don't yet have a UserID, and won't create the correct Conversation
      if (!this.isAuthenticated) throw new Error(ErrorDictionary.clientMustBeReady);
      if (!('distinct' in options)) options.distinct = true;
      options._loadType = 'websocket'; // treat this the same as a websocket loaded object
      return Conversation.create(options);
    },

    _createConversationMessageFromServer(obj) {
      return ConversationMessage._createFromServer(obj);
    },

    _createConversationFromServer(obj) {
      return Conversation._createFromServer(obj);
    },
  },
};
export default ClientConversation;
Core.mixins.Client.push(ClientConversation);
