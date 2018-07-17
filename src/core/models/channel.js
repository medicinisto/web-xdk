/*
 * A Channel object represents a dialog amongst a large set
 * of participants.
 *
 * ```
 * var channel = client.createChannel({
 *   name: "frodo-the-dodo",
 *   members: ["layer:///identities/samwise", "layer:///identities/orc-army"],
 *   metadata: {
 *     subtopic: "Sauruman is the man.  And a Saurian",
 *     tooMuchInfo: {
 *       nose: "stuffed"
 *     }
 *   }
 * });
 *
 * channel.createMessage("Please don't eat me").send();
 * ```
 * NOTE: Sending a Message creates the Channel; this avoids having lots of unused channels being created.
 *
 * Key methods, events and properties for getting started:
 *
 * Properties:
 *
 * * Layer.Core.Channel.id: this property is worth being familiar with; it identifies the
 *   Channel and can be used in `client.getChannel(id)` to retrieve it.
 * * Layer.Core.Channel.name: this property names the channel; this may be human readable, though for localization purposes,
 *   you may instead want to use a common name that is distinct from your displayed name.  There can only be a single
 *   channel with a given name per app.
 * * Layer.Core.Channel.membership: Contains status information about your user's role in this Channel.
 * * Layer.Core.Channel.isCurrentParticipant: Shorthand for determining if your user is a member of the Channel.
 *
 * Methods:
 *
 * * Layer.Core.Channel.join() to join the Channel
 * * Layer.Core.Channel.leave() to leave the Channel
 * * Layer.Core.Channel.on() and Layer.Core.Channel.off(): event listeners built on top of the `backbone-events-standalone` npm project
 * * Layer.Core.Channel.createMessage() to send a message on the Channel.
 *
 * Events:
 *
 * * `channels:change`: Useful for observing changes to Channel name
 *   and updating rendering of your Channel
 *
 * Finally, to access a list of Messages in a Channel, see Layer.Core.Query.
 *
 * @class  Layer.Core.Channel
 * @experimental This feature is incomplete, and available as Preview only.
 * @extends Layer.Core.Container
 * @author  Michael Kantor
 */
import Settings from '../../settings';
import Core from '../namespace';
import Root from '../root';
import Syncable from './syncable';
import Container from './container';
import ChannelMessage from './channel-message';
import { ErrorDictionary } from '../layer-error';
import LayerEvent from '../layer-event';
import * as Util from '../../utils';
import { STANDARD_MIME_TYPES, SYNC_STATE } from '../../constants';

const { getClient } = Settings;

export default class Channel extends Container {
  constructor(options = {}) {
    // Setup default values
    if (!options.membership) options.membership = {};
    super(options);
    this._members = getClient()._fixIdentities(options.members || []).map(item => item.id);
    this._register();
  }

  /**
   * Destroy the local copy of this Channel, cleaning up all resources
   * it consumes.
   *
   * @method destroy
   */
  destroy() {
    this.lastMessage = null;
    getClient()._removeChannel(this);
    super.destroy();
    this.membership = null;
  }

  /**
   * Create a new Layer.Core.Message.ChannelMessage instance within this conversation
   *
   *      var message = channel.createMessage('hello');
   *
   *      var message = channel.createMessage({
   *          parts: [new Layer.Core.MessagePart({
   *                      body: 'hello',
   *                      mimeType: 'text/plain'
   *                  })]
   *      });
   *
   * See Layer.Core.Message.ChannelMessage for more options for creating the message.
   *
   * @method createMessage
   * @param  {String|Object} options - If its a string, a MessagePart is created around that string.
   * @param {Layer.Core.MessagePart[]} options.parts - A Set or array of MessageParts. If its a string, it will be turned into a Textual Message Part.
   * @return {Layer.Core.Message.ChannelMessage}
   */
  createMessage(options = {}) {
    let messageConfig;
    if (typeof options === 'string') {
      messageConfig = {
        parts: [{
          body: JSON.stringify({ text: options }),
          mimeType: STANDARD_MIME_TYPES.TEXT + ';role=root',
        }],
      };
    } else {
      messageConfig = options;
    }
    messageConfig.conversationId = this.id;
    messageConfig._loadType = 'websocket'; // treat this the same as a websocket loaded object

    return new ChannelMessage(messageConfig);
  }

  _setupMessage(message) {
    message.position = Channel.nextPosition;
    Channel.nextPosition += 8192;
  }

  /**
   * Gets the data for a Create request.
   *
   * The Layer.Core.SyncManager needs a callback to create the Conversation as it
   * looks NOW, not back when `send()` was called.  This method is called
   * by the Layer.Core.SyncManager to populate the POST data of the call.
   *
   * @method _getSendData
   * @private
   * @return {Object} Websocket data for the request
   */
  _getSendData(data) {
    const isMetadataEmpty = Util.isEmpty(this.metadata);
    const members = this._members || [];
    if (members.indexOf(getClient().user.id) === -1) members.push(getClient().user.id);
    return {
      method: 'Channel.create',
      data: {
        name: this.name,
        metadata: isMetadataEmpty ? null : this.metadata,
        id: this.id,
        members,
      },
    };
  }

  /**
   * Populates this instance using server-data.
   *
   * Side effects add this to the Client.
   *
   * @method _populateFromServer
   * @private
   * @param  {Object} channel - Server representation of the channel
   */
  _populateFromServer(channel) {
    this._inPopulateFromServer = true;

    // Disable events if creating a new Conversation
    // We still want property change events for anything that DOES change
    this._disableEvents = (this.syncState === SYNC_STATE.NEW);
    this.name = channel.name;

    this.isCurrentParticipant = Boolean(channel.membership);
    this.membership = !channel.membership ||
      !channel.membership.id ? null : getClient()._createObject(channel.membership);

    super._populateFromServer(channel);
    this._register();

    this._disableEvents = false;
  }

  _createResultConflict(data) {
    const channel = data.data;
    if (channel) {
      this._createSuccess(channel);
    } else {
      this.syncState = SYNC_STATE.NEW;
      this._syncCounter = 0;
      this.trigger('sent-error', { error: data });
    }

    this._inPopulateFromServer = false;
  }

  /**
   * Validation done on the name; triggered via setter before value is written.
   *
   * @method __adjustName
   * @private
   * @param {String} newValue
   */
  __adjustName(newValue) {
    if (this._inPopulateFromServer || this._inLayerParser || this.isNew() || this.isLoading) return;
    throw new Error(ErrorDictionary.permissionDenied);
  }

  /**
   * __ Methods are automatically called by property setters.
   *
   * Any change in the name property will call this method and fire a
   * change event.
   *
   * @method __updateName
   * @private
   * @param  {string} newValue
   * @param  {string} oldValue
   */
  __updateName(newValue, oldValue) {
    this._triggerAsync('change', {
      property: 'name',
      oldValue,
      newValue,
    });
  }

  /**
   * Add the following members to the Channel.
   *
   * Unlike Conversations, Channels do not maintain state information about their members.
   * As such, if the operation fails there is no actual state change
   * for the channel.  Currently the only errors exposed are from the Layer.Core.Client.SyncManager.
   *
   * @method addMembers
   * @param {String[]} members   Identity IDs of users to add to this Channel
   * @return {Layer.Core.Channel} this
   *
   *
   *
   *
   *
   * @ignore until server supports it
   */
  addMembers(members) {
    members = getClient()._fixIdentities(members).map(item => item.id);
    if (this.syncState === SYNC_STATE.NEW) {
      this._members = this._members.concat(members);
      return this;
    }

    // TODO: Should use the bulk operation when it becomes available.
    members.forEach((identityId) => {
      this._xhr({
        url: '/members/' + identityId.replace(/^layer:\/\/\/identities\//, ''),
        method: 'PUT',
      });
    });
    return this;
  }

  /**
   * Remove the following members from the Channel.
   *
   * Not yet supported.
   *
   * @method removeMembers
   * @param {String[]} members   Identity IDs of users to remove from this Channel
   * @return {Layer.Core.Channel} this
   *
   *
   *
   *
   *
   * @ignore until server supports it
   */
  removeMembers(members) {
    members = getClient()._fixIdentities(members).map(item => item.id);

    if (this.syncState === SYNC_STATE.NEW) {
      members.forEach((id) => {
        const index = this._members.indexOf(id);
        if (index !== -1) this._members.splice(index, 1);
      });
      return this;
    }

    // TODO: Should use the bulk operation when it becomes available.
    members.forEach((identityId) => {
      this._xhr({
        url: '/members/' + identityId.replace(/^layer:\/\/\/identities\//, ''),
        method: 'DELETE',
      });
    });
    return this;
  }

  /**
   * Add the current user to this channel.
   *
   * @method join
   * @return {Layer.Core.Channel} this
   *
   *
   *
   *
   *
   * @ignore until server supports it
   */
  join() {
    return this.addMembers([getClient().user.id]);
  }

  /**
   * remove the current user from this channel.
   *
   * @method leave
   * @return {Layer.Core.Channel} this
   *
   *
   *
   *
   * @ignore until server supports it
   */
  leave() {
    return this.removeMembers([getClient().user.id]);
  }

  /**
   * Return a Membership object for the specified Identity ID.
   *
   * If `members:loaded` is triggered, then your membership object
   * has been populated with data.
   *
   * If `members:loaded-error` is triggered, then your membership object
   * could not be loaded, either you have a connection error, or the user is not a member.
   *
   * ```
   * var membership = channel.getMember('FrodoTheDodo');
   * membership.on('membership:loaded', function(evt) {
   *    alert('He IS a member, quick, kick him out!');
   * });
   * membership.on('membership:loaded-error', function(evt) {
   *    if (evt.error.id === 'not_found') {
   *      alert('Sauruman, he is with the Elves!');
   *    } else {
   *      alert('Sauruman, would you please pick up your Palantir already? I can't connect!');
   *    }
   * });
   * ```
   * @method getMember
   * @param {String} identityId
   * @returns {Layer.Core.Membership}
   */
  getMember(identityId) {
    identityId = getClient()._fixIdentities([identityId])[0].id;
    const membershipId = this.id + '/members/' + identityId.replace(/layer:\/\/\/identities\//, '');
    return getClient().getMember(membershipId, true);
  }

  /**
   * Delete the channel; not currently supported.
   *
   * @method delete
   */
  delete() {
    this._delete('');
  }

  /**
   * LayerPatch will call this after changing any properties.
   *
   * Trigger any cleanup or events needed after these changes.
   *
   * TODO: Move this to Layer.Core.Container
   *
   * @method _handlePatchEvent
   * @private
   * @param  {Mixed} newValue - New value of the property
   * @param  {Mixed} oldValue - Prior value of the property
   * @param  {string[]} paths - Array of paths specifically modified: ['participants'], ['metadata.keyA', 'metadata.keyB']
   */
  _handlePatchEvent(newValue, oldValue, paths) {
    // Certain types of __update handlers are disabled while values are being set by
    // layer patch parser because the difference between setting a value (triggers an event)
    // and change a property of a value (triggers only this callback) result in inconsistent
    // behaviors.  Enable them long enough to allow __update calls to be made
    this._inLayerParser = false;
    try {
      const events = this._disableEvents;
      this._disableEvents = false;
      super._handlePatchEvent(newValue, oldValue, paths);
      this._disableEvents = events;
    } catch (err) {
      // do nothing
    }
    this._inLayerParser = true;
  }

  /**
   * Register this Channel with the Client
   *
   * @method _register
   * @private
   */
  _register() {
    getClient()._addChannel(this);
  }

  _deleteResult(result, id) {
    if (!result.success &&
        (!result.data || (result.data.id !== 'not_found' && result.data.id !== 'authentication_required'))) {
      Channel.load(id);
    }
  }

  /**
   * Returns a plain object.
   *
   * Object will have all the same public properties as this
   * Conversation instance.  New object is returned any time
   * any of this object's properties change.
   *
   * @method toObject
   * @return {Object} POJO version of this.
   */
  toObject() {
    if (!this._toObject) {
      this._toObject = super.toObject();
      this._toObject.membership = Util.clone(this.membership);
    }
    return this._toObject;
  }

  /**
   * Create a channel instance from a server representation of the channel.
   *
   * If the Channel already exists, will update the existing copy with
   * presumably newer values.
   *
   * @method _createFromServer
   * @protected
   * @static
   * @param  {Object} channel - Server representation of a Channel
   * @return {Layer.Core.Channel}
   */
  static _createFromServer(channel) {
    return new Channel({
      fromServer: channel,
      _fromDB: channel._fromDB,
    });
  }

  /**
   * Find or create a new Channel.
   *
   *      var channel = Layer.Core.Channel.create({
   *          members: ['a', 'b'],
   *          private: true,
   *          metadata: {
   *              titleDetails: 'I am not a detail!'
   *          },
   *          'channels:loaded': function(evt) {
   *
   *          }
   *      });
   *
   * Recommend using `client.createChannel({...})`
   * instead of `Channel.create({...})`.
   *
   * @method create
   * @static
   * @protected
   * @param  {Object} options
   * @param  {string[] | Layer.Core.Identity[]} options.members - Array of Participant IDs or Layer.Core.Identity objects to create a channel with.
   * @param {boolean} [options.private=false] - Create a private channel
   * @param {Object} [options.metadata={}] - Initial metadata for Channel
   * @return {Layer.Core.Channel}
   */
  static create(options) {
    if (!options.name) options.name = 'channel-' + String(Math.random()).replace(/\./, '');
    const newOptions = {
      name: options.name,
      private: options.private,
      members: options.members ? getClient()._fixIdentities(options.members).map(item => item.id) : [],
      metadata: options.metadata,
    };

    const channel = getClient().findCachedChannel(aChannel => aChannel.name === newOptions.name);

    if (channel) {
      channel._sendDistinctEvent = new LayerEvent({
        target: channel,
        result: !options.metadata || Util.doesObjectMatch(options.metadata, channel.metadata) ?
          Channel.FOUND : Channel.FOUND_WITHOUT_REQUESTED_METADATA,
      }, 'channels:sent');
    }

    return channel || new Channel(newOptions);
  }
}

/**
 * The Channel's name; this must be unique.
 *
 * Note that while you can use a displayable human readable name, you may also choose to use this
 * as an ID that you can easily localize to different languages.
 *
 * Must not be a UUID.
 *
 * @property {String} name
 */
Channel.prototype.name = '';

/**
 * The `membership` object contains details of this user's membership within this channel.
 *
 * NOTE: Initially, only `isMember` will be available.
 *
 * ```
 * {
 *     "isMember": true,
 *     "role": "user",
 *     "lastUnreadMessageId: "layer:///messages/UUID"
 * }
 * ```
 * @property {Object} membership
 */
Channel.prototype.membership = null;

Channel.prototype._members = null;

Channel.eventPrefix = 'channels';

// Math.pow(2, 64); a number larger than Number.MAX_SAFE_INTEGER, and larger than Java's Max Unsigned Long. And an easy to work with
// factor of 2
Channel.nextPosition = 18446744073709552000;

/**
 * Prefix to use when generating an ID for instances of this class
 * @property {String} [prefixUUID=layer:///channels]
 * @static
 * @private
 */
Channel.prefixUUID = 'layer:///channels/';

Channel._supportedEvents = [

  /**
   * The conversation is now on the server.
   *
   * Called after successfully creating the conversation
   * on the server.  The Result property is one of:
   *
   * * Channel.CREATED: A new Channel has been created
   * * Channel.FOUND: A matching named Channel has been found
   *
   * @event channels:sent
   * @param {Layer.Core.LayerEvent} event
   * @param {string} event.result
   */
  'channels:sent',

  /**
   * An attempt to send this channel to the server has failed.
   * @event channels:sent-error
   * @param {Layer.Core.LayerEvent} event
   * @param {Layer.Core.LayerEvent} event.error
   */
  'channels:sent-error',

  /**
   * The conversation is now loaded from the server.
   *
   * Note that this is only used in response to the Layer.Core.Channel.load() method.
   * from the server.
   *
   * @event channels:loaded
   * @param {Layer.Core.LayerEvent} event
   */
  'channels:loaded',

  /**
   * An attempt to load this conversation from the server has failed.
   *
   * Note that this is only used in response to the Layer.Core.Channel.load() method.
   * @event channels:loaded-error
   * @param {Layer.Core.LayerEvent} event
   * @param {Layer.Core.LayerEvent} event.error
   */
  'channels:loaded-error',

  /**
   * The conversation has been deleted from the server.
   *
   * Caused by either a successful call to delete() on this instance
   * or by a remote user.
   * @event channels:delete
   * @param {Layer.Core.LayerEvent} event
   */
  'channels:delete',

  /**
   * This channel has changed.
   *
   * @event channels:change
   * @param {Layer.Core.LayerEvent} event
   * @param {Object[]} event.changes - Array of changes reported by this event
   * @param {Mixed} event.changes.newValue
   * @param {Mixed} event.changes.oldValue
   * @param {string} event.changes.property - Name of the property that changed
   * @param {Layer.Core.Conversation} event.target
   */
  'channels:change'].concat(Syncable._supportedEvents);


Root.initClass.apply(Channel, [Channel, 'Channel', Core]);
Syncable.subclasses.push(Channel);
