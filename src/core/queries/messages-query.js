/**
 * Query class for running a Query on Messages
 *
 *      var messageQuery = client.createQuery({
 *        model: Layer.Core.Query.Message,
 *        predicate: 'conversation.id = "layer:///conversations/UUID"'
 *      });
 *
 * You can change the data selected by your query any time you want using:
 *
 *      query.update({
 *        predicate: 'channel.id = "layer:///channels/UUID2"'
 *      });
 *
 * You can release data held in memory by your queries when done with them:
 *
 *      query.destroy();
 *
 * #### predicate
 *
 * Note that the `predicate` property is only supported for Messages and Layer.Core.Membership, and only supports
 * querying by Conversation or Channel:
 *
 * * `conversation.id = 'layer:///conversations/UUIUD'`
 * * `channel.id = 'layer:///channels/UUIUD'`
 *
 * @class  Layer.Core.Query.MessagesQuery
 * @extends Layer.Core.Query
 */
import Settings from '../../settings';
import Core from '../namespace';
import Root from '../root';
import { ErrorDictionary } from '../layer-error';
import * as Util from '../../utils';
import Query from './query';

const { logger } = Util;
const { getClient } = Settings;

const findConvIdRegex = new RegExp(
  /^conversation.id\s*=\s*['"]((layer:\/\/\/conversations\/)?.{8}-.{4}-.{4}-.{4}-.{12})['"]$/);
const findChannelIdRegex = new RegExp(
  /^channel.id\s*=\s*['"]((layer:\/\/\/channels\/)?.{8}-.{4}-.{4}-.{4}-.{12})['"]$/);

export default class MessagesQuery extends Query {
  _fixPredicate(inValue) {
    if (inValue === '') return '';
    if (inValue.indexOf('conversation.id') !== -1) {
      let conversationId = inValue.match(findConvIdRegex) ? inValue.replace(findConvIdRegex, '$1') : null;
      if (!conversationId) throw new Error(ErrorDictionary.invalidPredicate);
      if (conversationId.indexOf('layer:///conversations/') !== 0) conversationId = 'layer:///conversations/' + conversationId;
      return `conversation.id = '${conversationId}'`;
    } else if (inValue.indexOf('channel.id') !== -1) {
      let channelId = inValue.match(findChannelIdRegex) ? inValue.replace(findChannelIdRegex, '$1') : null;
      if (!channelId) throw new Error(ErrorDictionary.invalidPredicate);
      if (channelId.indexOf('layer:///channels/') !== 0) channelId = 'layer:///channels/' + channelId;
      return `channel.id = '${channelId}'`;
    } else {
      throw new Error(ErrorDictionary.invalidPredicate);
    }
  }


  _fetchData(pageSize) {
    const predicateIds = this._getConversationPredicateIds();

    // Do nothing if we don't have a conversation to query on
    if (!predicateIds) {
      if (this.predicate && !this.predicate.match(/['"]/)) {
        logger.error('Query: This query may need to quote its value');
      }
      return;
    }

    switch (predicateIds.type) {
      case Query.Conversation:
        this._fetchConversationMessages(pageSize, predicateIds);
        break;
      case Query.Channel:
        this._fetchChannelMessages(pageSize, predicateIds);
        break;
    }
  }

  _getSortField() {
    return 'position';
  }

  /**
   * Get the Conversation UUID from the predicate property.
   *
   * Extract the Conversation's UUID from the predicate... or returned the cached value.
   *
   * @method _getConversationPredicateIds
   * @private
   */
  _getConversationPredicateIds() {
    if (this.predicate.indexOf('conversation.id') !== -1) {
      if (this.predicate.match(findConvIdRegex)) {
        const conversationId = this.predicate.replace(findConvIdRegex, '$1');

        // We will already have a this._predicate if we are paging; else we need to extract the UUID from
        // the conversationId.
        const uuid = (this._predicate || conversationId).replace(/^layer:\/\/\/conversations\//, '');
        if (uuid) {
          return {
            uuid,
            id: conversationId,
            type: Query.Conversation,
          };
        }
      }
    } else if (this.predicate.indexOf('channel.id') !== -1) {
      if (this.predicate.match(findChannelIdRegex)) {
        const channelId = this.predicate.replace(findChannelIdRegex, '$1');

        // We will already have a this._predicate if we are paging; else we need to extract the UUID from
        // the channelId.
        const uuid = (this._predicate || channelId).replace(/^layer:\/\/\/channels\//, '');
        if (uuid) {
          return {
            uuid,
            id: channelId,
            type: Query.Channel,
          };
        }
      }
    }
  }

  _fetchConversationMessages(pageSize, predicateIds) {
    const conversationId = 'layer:///conversations/' + predicateIds.uuid;
    if (!this._predicate) this._predicate = predicateIds.id;
    const conversation = getClient().getConversation(conversationId);

    // Retrieve data from db cache in parallel with loading data from server
    if (getClient().dbManager) {
      getClient().dbManager.loadMessages(conversationId, this._nextDBFromId, pageSize, (messages) => {
        if (messages.length) this._appendResults({ data: messages }, true);
      });
    }

    const newRequest = `conversations/${predicateIds.uuid}/messages?page_size=${pageSize}` +
      (this._nextServerFromId ? '&from_id=' + this._nextServerFromId : '');

    // Don't query on unsaved conversations, nor repeat still firing queries
    // If we have a conversation ID but no conversation object, try the query anyways.
    if ((!conversation || conversation.isSaved()) && newRequest !== this._firingRequest) {
      this.isFiring = true;
      this._firingRequest = newRequest;
      getClient().xhr({
        telemetry: {
          name: 'message_query_time',
        },
        url: newRequest,
        method: 'GET',
        sync: false,
      }, results => this._processRunResults(results, newRequest, pageSize));
    }

    if (conversation && !conversation.isSaved()) {
      this.pagedToEnd = true;
    }

    // If there are no results, then its a new query; automatically populate it with the Conversation's lastMessage.
    if (this.data.length === 0) {
      if (conversation && conversation.lastMessage) {
        const lastMessage = conversation.lastMessage;
        if (!this.filter || this.filter(lastMessage)) {
          this.data = [this._getData(lastMessage)];
          // Trigger the change event
          this._triggerChange({
            type: 'data',
            pagedToEnd: this.pagedToEnd,
            data: [this._getData(lastMessage)],
            query: this,
            target: getClient(),
          });
        }
      }
    }
  }

  _fetchChannelMessages(pageSize, predicateIds) {
    const channelId = 'layer:///channels/' + predicateIds.uuid;
    if (!this._predicate) this._predicate = predicateIds.id;
    const channel = getClient().getChannel(channelId);

    // Retrieve data from db cache in parallel with loading data from server
    if (getClient().dbManager) {
      getClient().dbManager.loadMessages(channelId, this._nextDBFromId, pageSize, (messages) => {
        if (messages.length) this._appendResults({ data: messages }, true);
      });
    }

    const newRequest = `channels/${predicateIds.uuid}/messages?page_size=${pageSize}` +
      (this._nextServerFromId ? '&from_id=' + this._nextServerFromId : '');

    // Don't query on unsaved channels, nor repeat still firing queries
    if ((!channel || channel.isSaved()) && newRequest !== this._firingRequest) {
      this.isFiring = true;
      this._firingRequest = newRequest;
      getClient().xhr({
        url: newRequest,
        method: 'GET',
        sync: false,
      }, results => this._processRunResults(results, newRequest, pageSize));
    }

    if (channel && !channel.isSaved()) {
      this.pagedToEnd = true;
    }
  }

  // TODO: Is this as efficient as it could be? Should index start at the end of the list?
  _getInsertIndex(message, data) {
    let index;
    for (index = 0; index < data.length; index++) {
      if (message.position > data[index].position) {
        break;
      }
    }
    return index;
  }


  _handleEvents(eventName, evt) {
    switch (eventName) {

      // If a Conversation's ID has changed, check our predicate, and update it automatically if needed.
      case 'conversations:change':
        this._handleConvIdChangeEvent(evt);
        break;

      // If a Message has changed and its in our result set, replace
      // it with a new immutable object
      case 'messages:change':
      case 'messages:read':
        this._handleChangeEvent('messages', evt);
        break;

      // If Messages are added, and they aren't already in our result set
      // add them.
      case 'messages:add':
        this._handleAddEvent('messages', evt);
        break;

      // If a Message is deleted and its in our result set, remove it
      // and trigger an event
      case 'messages:remove':
        this._handleRemoveEvent('messages', evt);
        break;
    }
  }

  /**
   * A Conversation or Channel ID changes if a matching Distinct Conversation or named Channel was found on the server.
   *
   * If this Query's Conversation's ID has changed, update the predicate.
   *
   * @method _handleConvIdChangeEvent
   * @param {Layer.Core.LayerEvent} evt - A Message Change Event
   * @private
   */
  _handleConvIdChangeEvent(evt) {
    const cidChanges = evt.getChangesFor('id');
    if (cidChanges.length) {
      if (this._predicate === cidChanges[0].oldValue) {
        this._predicate = cidChanges[0].newValue;
        this.predicate = "conversation.id = '" + this._predicate + "'";
        this._run();
      }
    }
  }

  /**
   * If the ID of the message has changed, then the position property has likely changed as well.
   *
   * This method tests to see if changes to the position property have impacted the message's position in the
   * data array... and updates the array if it has.
   *
   * @method _handlePositionChange
   * @private
   * @param {Layer.Core.LayerEvent} evt  A Message Change event
   * @param {number} index  Index of the message in the current data array
   * @return {boolean} True if a data was changed and a change event was emitted
   */
  _handlePositionChange(evt, index) {
    // If the message is not in the current data, then there is no change to our query results.
    if (index === -1) return false;

    // Create an array without our data item and then find out where the data item Should be inserted.
    // Note: we could just lookup the position in our current data array, but its too easy to introduce
    // errors where comparing this message to itself may yield index or index + 1.
    const newData = [
      ...this.data.slice(0, index),
      ...this.data.slice(index + 1),
    ];
    const newIndex = this._getInsertIndex(evt.target, newData);

    // If the data item goes in the same index as before, then there is no change to be handled here;
    // else insert the item at the right index, update this.data and fire a change event
    if (newIndex !== index) {
      newData.splice(newIndex, 0, this._getData(evt.target));
      this.data = newData;
      this._triggerChange({
        type: 'property',
        target: this._getData(evt.target),
        query: this,
        isChange: true,
        changes: evt.changes,
      });
      return true;
    }
    return false;
  }

  _handleChangeEvent(name, evt) {
    let index = this._getIndex(evt.target.id);
    const positionChanges = evt.getChangesFor('position');

    // If there are position changes, handle them.  If all the changes are position changes,
    // exit when done.
    if (positionChanges.length) {
      if (this._handlePositionChange(evt, index)) {
        if (positionChanges.length === evt.changes.length) return;
        index = this._getIndex(evt.target.id); // Get the updated position
      }
    }

    if (index !== -1) {
      if (this.dataType === Query.ObjectDataType) {
        this.data = [
          ...this.data.slice(0, index),
          evt.target.toObject(),
          ...this.data.slice(index + 1),
        ];
      }
      this._triggerChange({
        type: 'property',
        target: this._getData(evt.target),
        query: this,
        isChange: true,
        changes: evt.changes,
      });
    }
  }

  /*
   * Note: Earlier versions of this iterated over each item, inserted it and when all items were inserted,
   * triggered events indicating the index at which they were inserted.
   *
   * This caused the following problem:
   *
   * 1. Insert messages newest message at position 0 and second newest message at position 1
   * 2. Trigger events in the order they arrive: second newest gets inserted at index 1, newest gets inserted at index 0
   * 3. UI on receiving the second newest event does yet have the newest event, and on inserting it at position 1
   *    is actually inserting it at the wrong place because position 0 is occupied by an older message at this time.
   *
   * Solution: We must iterate over all items, and process them entirely one at a time.
   * Drawback: After an Event.replay we may get a lot of add events, we may need a way to do an event that inserts a set of messages
   * instead of triggering lots of individual rendering-causing events
   */
  _handleAddEvent(name, evt) {
    // Only use added messages that are part of this Conversation
    // and not already in our result set
    const list = evt[name]
      // Filter so that we only see Messages if doing a Messages query or Announcements if doing an Announcements Query.
      .filter((message) => {
        const type = Util.typeFromID(message.id);
        return (type === 'messages' && this.model === Query.Message) ||
                (type === 'announcements' && this.model === Query.Announcement);
      })
      // Filter out Messages that aren't part of this Conversation
      .filter((message) => {
        const type = Util.typeFromID(message.id);
        return type === 'announcements' || message.conversationId === this._predicate;
      })
      // Filter out Messages that are already in our data set
      .filter(message => this._getIndex(message.id) === -1)
      .map(message => this._getData(message))
      .filter(message => !this.filter || this.filter(message));


    // Add them to our result set and trigger an event for each one
    if (list.length) {
      const data = this.data = this.dataType === Query.ObjectDataType ? [].concat(this.data) : this.data;
      list.forEach((item) => {
        const index = this._getInsertIndex(item, data);
        data.splice(index, 0, item);
        if (index !== 0) {
          logger.warn(`Query: Index of ${item.id} is ${index}; position is ${item.position}; compared to ${data[0].position}`);
        }

        this.totalSize += 1;

        this._triggerChange({
          type: 'insert',
          target: item,
          query: this,
          index,
        });
      });
    }
  }

  _handleRemoveEvent(name, evt) {
    const removed = [];
    evt[name].forEach((message) => {
      const index = this._getIndex(message.id);
      if (index !== -1) {
        if (message.id === this._nextDBFromId) this._nextDBFromId = this._updateNextFromId(index);
        if (message.id === this._nextServerFromId) this._nextServerFromId = this._updateNextFromId(index);
        removed.push({
          data: message,
          index,
        });
        if (this.dataType === Query.ObjectDataType) {
          this.data = [
            ...this.data.slice(0, index),
            ...this.data.slice(index + 1),
          ];
        } else {
          this.data.splice(index, 1);
        }
      }
    });

    this.totalSize -= removed.length;
    removed.forEach((removedObj) => {
      this._triggerChange({
        type: 'remove',
        target: this._getData(removedObj.data),
        index: removedObj.index,
        query: this,
      });
    });
  }
}

MessagesQuery._supportedEvents = [
].concat(Query._supportedEvents);


MessagesQuery.MaxPageSize = 100;

MessagesQuery.prototype.model = Query.Message;

Root.initClass.apply(MessagesQuery, [MessagesQuery, 'MessagesQuery', Core.Query]);
