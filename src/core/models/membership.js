/*
 * The Membership class represents an Membership of a user within a channel.
 *
 * Identities are created by the System, never directly by apps.
 *
 * @class Layer.Core.Membership
 * @experimental This feature is incomplete, and available as Preview only.
 * @extends Layer.Core.Syncable
 */
import Settings from '../../settings';
import Core from '../namespace';
import Syncable from './syncable';
import Root from '../root';
import { SYNC_STATE } from '../../constants';

const { getClient } = Settings;

export default class Membership extends Syncable {
  constructor(options = {}) {
    // Make sure the ID from handle fromServer parameter is used by the Root.constructor
    if (options.fromServer) {
      options.id = options.fromServer.id;
    } else if (options.id && !options.userId) {
      options.userId = options.id.replace(/^.*\//, '');
    }

    super(options);

    this.isInitializing = true;

    // If the options contains a full server definition of the object,
    // copy it in with _populateFromServer; this will add the Membership
    // to the Client as well.
    if (options && options.fromServer) {
      this._populateFromServer(options.fromServer);
    }

    if (!this.url && this.id) {
      this.url = `${getClient().url}/${this.id.substring(9)}`;
    } else if (!this.url) {
      this.url = '';
    }
    getClient()._addMembership(this);

    this.isInitializing = false;
  }

  destroy() {
    if (getClient()) getClient()._removeMembership(this);
    super.destroy();
  }

  /**
   * Populates this instance using server-data.
   *
   * Side effects add this to the Client.
   *
   * @method _populateFromServer
   * @private
   * @param  {Object} membership - Server representation of the membership
   */
  _populateFromServer(membership) {

    // Disable events if creating a new Membership
    // We still want property change events for anything that DOES change
    this._disableEvents = (this.syncState === SYNC_STATE.NEW);

    this._setSynced();

    this.userId = membership.identity ? membership.identity.user_id || '' : getClient().user.userId;
    this.channelId = membership.channel.id;

    // this.role = getClient()._createObject(membership.role);

    this.identity = membership.identity ? getClient()._createObject(membership.identity) : getClient().user;
    this.identity.on('identities:change', (evt) => {
      this.trigger('change', {
        property: 'identity',
      });
    }, this);

    if (!this.url && this.id) {
      this.url = getClient().url + this.id.substring(8);
    }

    this._disableEvents = false;
  }

  /**
   * Update the property; trigger a change event, IF the value has changed.
   *
   * @method _updateValue
   * @private
   * @param {string} key - Property name
   * @param {Mixed} value - Property value
   */
  _updateValue(key, value) {
    if (value === null || value === undefined) value = '';
    if (this[key] !== value) {
      if (!this.isInitializing) {
        this._triggerAsync('change', {
          property: key,
          oldValue: this[key],
          newValue: value,
        });
      }
      this[key] = value;
    }
  }

  __getUserId() {
    return this.identity ? this.identity.userId : '';
  }

  __updateIdentity(newIdentity, oldIdentity) {
    if (oldIdentity) oldIdentity.off(null, null, this);
  }

  /**
   * Create a new Membership based on a Server description of the user.
   *
   * @method _createFromServer
   * @static
   * @param {Object} membership - Server Membership Object
   * @returns {Layer.Core.Membership}
   */
  static _createFromServer(membership) {
    return new Membership({
      fromServer: membership,
      _fromDB: membership._fromDB,
    });
  }
}

/**
 * User ID that the Membership describes.
 *
 * @property {string} userId
 */
Membership.prototype.userId = '';

/**
 * Channel ID that the membership describes.
 *
 * @property {string} channelId
 */
Membership.prototype.channelId = '';

/**
 * The user's role within the channel
 *
 * @ignore
 * @property {Layer.Core.Role} role
 */
Membership.prototype.role = null;

/**
 * Identity associated with the membership
 *
 * @property {Layer.Core.Identity} identity
 */
Membership.prototype.identity = '';

Membership.inObjectIgnore = Root.inObjectIgnore;

Membership._supportedEvents = [
  'members:change',
  'members:loaded',
  'members:loaded-error',
].concat(Syncable._supportedEvents);

Membership.eventPrefix = 'members';
Membership.prefixUUID = '/members/';

Root.initClass.apply(Membership, [Membership, 'Membership', Core]);
Syncable.subclasses.push(Membership);
