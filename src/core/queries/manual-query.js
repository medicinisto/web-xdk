/**
 * Query class that does not talk to Layer's servers and instead expects the application to provide it
 * with data directly.
 *
 * ```
 * var manualQuery = client.createQuery({
 *   model: Layer.Core.Query.Manual
 * });
 * manualQuery.addItem(conversation);  // Add a Conversation instance to the end of the list
 * manualQuery.addItem(conversation.toObject());  // Add a conversation-like object to the end of the list
 * manualQuery.addItem(conversation, 0);  // Add a Conversation instance to the top of the list
 *
 * manualQuery.addItems(conversations); // Adds the specified conversations to the end of the list
 * manualQuery.addItems(conversations, 0); // Adds the specified conversations to the start of the list
 *
 * manualQuery.setItems(conversations); // Replaces all data with the specified conversations
 * manualQuery.reset(); // Removes all data
 * manualQuery.removeItem(conversation);
 * maualQuery.removeItems(conversations);
 * ```
 *
 * You can release data held in memory by your queries when done with them:
 *
 * ```
 * query.destroy();
 * ```
 *
 * Note that any Object that is provided must at a minimum provide an `id` field that contains a valid
 * Conversation/Identity/Message ID, and should provide suitable properties from which an instance can
 * be created:
 *
 * ```
 * query.addItem({
 *   id: "layer:///messages/" Layer.Utils.generateUUID(),
 *   sender: new Identity({displayName: "Frodo the Dodo"}),
 *   parts: [{mimeType: "application/vnd.layer.text+json;role=root", body: '{"text": "Hello World"}'}]
 * });
 * ```
 *
 * Any Object specified this way will have an instance created for it, and that instance will be cached
 * and accessable via `client.getIdentity()`, `client.getConversation()` or `client.getMessage()` until the data
 * is removed from the Query.
 *
 * @class  Layer.Core.Query.ManualQuery
 * @extends Layer.Core.Query
 */
import { client } from '../../settings';
import Core from '../namespace';
import Root from '../root';
import Query from './query';
import Util from '../../utils';
import Message from '../models/message';
import Conversation from '../models/conversation';
import Identity from '../models/identity';

class ManualQuery extends Query {
  _prepareItem(item) {
    if (!(item instanceof Root)) {
      switch (Util.typeFromID(item.id || '')) {
        case 'messages':
          item = new Message.ConversationMessage(item);
          client._addMessage(item);
          break;
        case 'conversations':
          item = new Conversation(item);
          client._addConversation(item);
          break;
        case 'identities':
          item = new Identity(item);
          client._addIdentity(item);
          break;
      }
    }
    return this._getData(item);
  }
  addItem(item, index, skipNewObj) {
    if (this._getIndex(item.id) !== -1) return;
    item = this._prepareItem(item);

    // Get new Array if we are treating this as immutable data
    if (!skipNewObj && this.dataType === Query.ObjectDataType) {
      this.data = [].concat(this.data);
    }

    if (index !== undefined) {
      this.data.splice(index, 0, item);
    } else {
      index = this.data.length;
      this.data.push(item);
    }

    this._triggerChange({
      type: 'insert',
      target: item,
      query: this,
      index,
    });
  }

  addItems(items, index) {
    if (index === undefined) index = this.data.length;
    items.forEach((item, i) => this.addItem(item, index + i, i > 0));
  }

  setItems(items) {
    this._reset();
    this.addItems(items, 0);
  }

  removeItem(item, skipNewObj) {
    const index = this._getIndex(item.id);
    if (index === -1) return;

    if (!skipNewObj && this.dataType === Query.ObjectDataType) {
      this.data = [].concat(this.data);
    }

    this.data.splice(index, 1);

    this._triggerChange({
      type: 'remove',
      target: item,
      query: this,
      index,
    });
  }

  removeItems(items) {
    items.forEach((item, i) => this.removeItem(item, i > 0));
  }
}

ManualQuery._supportedEvents = [].concat(Query._supportedEvents);


ManualQuery.MaxPageSize = 500;

ManualQuery.prototype.model = Query.Manual;

Root.initClass.apply(ManualQuery, [ManualQuery, 'ManualQuery', Core.Query]);

module.exports = ManualQuery;
