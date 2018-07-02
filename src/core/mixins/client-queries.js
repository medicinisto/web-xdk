/**
 *
 * Adds Query handling to the Layer.Core.Client.
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import Query from '../queries/query';
import IdentitiesQuery from '../queries/identities-query';
import ConversationsQuery from '../queries/conversations-query';
import MessagesQuery from '../queries/messages-query';
import ManualQuery from '../queries/manual-query';
import { ErrorDictionary } from '../layer-error';
import Core from '../namespace';

module.exports = {
  events: [

  ],
  lifecycle: {
    constructor(options) {
      this._models.queries = {};
    },
    cleanup() {
      Object.keys(this._models.queries || {}).forEach((id) => {
        const query = this._models.queries[id];
        if (query && !query.isDestroyed) {
          query.destroy();
        }
      });
      this._models.queries = null;
    },
    reset() {
      this._models.queries = {};
    },

  },
  methods: {
    /**
     * Retrieve the query by query id.
     *
     * Useful for finding a Query when you only have the ID
     *
     * @method getQuery
     * @param  {string} id              - layer:///queries/uuid
     * @return {Layer.Core.Query}
     */
    getQuery(id) {
      if (typeof id !== 'string') throw new Error(ErrorDictionary.idParamRequired);
      return this._models.queries[id] || null;
    },

    /**
     * There are two options to create a new Layer.Core.Query instance.
     *
     * The direct way:
     *
     *     var query = client.createQuery({
     *         model: Layer.Core.Query.Message,
     *         predicate: 'conversation.id = '' + conv.id + ''',
     *         paginationWindow: 50
     *     });
     *
     * A Builder approach that allows for a simpler syntax:
     *
     *     var qBuilder = QueryBuilder
     *      .messages()
     *      .forConversation('layer:///conversations/ffffffff-ffff-ffff-ffff-ffffffffffff')
     *      .paginationWindow(100);
     *     var query = client.createQuery(qBuilder);
     *
     * @method createQuery
     * @param  {Layer.Core.QueryBuilder|Object} options - Either a Layer.Core.QueryBuilder instance, or parameters for the Layer.Core.Query constructor
     * @return {Layer.Core.Query}
     */
    createQuery(options) {
      let query;

      if (typeof options.build === 'function') {
        options = options.build();
      }
      switch (options.model) {
        case Query.Identity:
          query = new IdentitiesQuery(options);
          break;
        case Query.Conversation:
          query = new ConversationsQuery(options);
          break;
        case Query.Channel:
          query = this._createChannelsQuery(options);
          break;
        case Query.Membership:
          query = this._createMembersQuery(options);
          break;
        case Query.Message:
          query = new MessagesQuery(options);
          break;
        case Query.Announcement:
          query = this._createAnnouncementsQuery(options);
          break;
        case Query.Manual:
          query = new ManualQuery(options);
          break;
        default:
          query = new Query(options);
      }
      this._addQuery(query);
      return query;
    },

    /**
     * Register the Layer.Core.Query.
     *
     * @method _addQuery
     * @private
     * @param  {Layer.Core.Query} query
     */
    _addQuery(query) {
      this._models.queries[query.id] = query;
    },

    /**
     * Deregister the Layer.Core.Query.
     *
     * @method _removeQuery
     * @private
     * @param  {Layer.Core.Query} query [description]
     */
    _removeQuery(query) {
      if (query) {
        delete this._models.queries[query.id];
        if (!this._inCleanup) {
          const data = query.data
            .map(obj => this.getObject(obj.id))
            .filter(obj => obj);
          this._checkAndPurgeCache(data);
        }
        this.off(null, null, query);
      }
    },
  },
};

Core.mixins.Client.push(module.exports);
