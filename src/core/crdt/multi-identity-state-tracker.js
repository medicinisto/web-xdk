import Settings from '../../settings';
import { CRDTStateTracker } from './state-tracker';
import Core from '../namespace';
import { CRDT_TYPES } from '../../constants';
import { ErrorDictionary } from '../layer-error';

const { getClient } = Settings;

/**
 * The Multi Identity tracker class tracks all state related to a given named state across all users.
 *
 * So if multiple users have all sent in values for "myStateName" one Multi Identity Tracker class will be instantiated
 * that will track all users's "myStateName" state.
 *
 * @class Layer.Core.CRDT.MultiIdentityStateTracker
 */
export default class CRDTMultiIdentityStateTracker {

  /**
   *
   * @method constructor
   * @param {Object} options
   * @param {String} name    Name of the state to be tracked
   * @param {String} options.type   The Operation type chosen from Layer.Constants.CRDT_TYPES
   */
  constructor({ name, type }) {
    /**
     * @property {Object} users   Hash of Layer.Core.CRDT.StateTracker objects indexed by Identity ID
     */
    this.users = {};

    /**
     * @property {String} name   Name of the state variable managed by this state tracker
     */
    this.name = name;

    // Too bad Object.values() isn't in IE11...
    const values = Object.keys(CRDT_TYPES).map(typeKey => CRDT_TYPES[typeKey]);
    if (values.indexOf(type) === -1) {
      throw new Error(ErrorDictionary.invalidCRDTType);
    }

    /**
     * @property {String} type   A value from Layer.Constants.CRDT_TYPES
     */
    this.type = type;
  }

  /**
   * If the ResponseSummary MessagePart is removed that contains this data, clear the data.
   *
   * @protected
   * @method reset
   */
  reset() {
    this.users = {};
  }

  /**
   * Adds tracking for the specified user (no-op if already tracked)
   *
   * @method _addUser
   * @private
   * @param {String} identityId
   */
  _addUser(identityId) {
    if (!this.users[identityId]) {
      this.users[identityId] = new CRDTStateTracker({
        type: this.type,
        name: this.name,
        identityId,
      });
    }
  }

  /**
   * Returns the value of this state for the specified Identity
   *
   * @method getValue
   * @param {String} identityId
   * @returns {String|Number|Boolean|String[]|Number[]|Boolean[]}
   */
  getValue(identityId) {
    if (this.users[identityId]) {
      return this.users[identityId].getValue();
    } else if (this.type === CRDT_TYPES.SET) {
      return [];
    } else {
      return null;
    }
  }

  /**
   * Returns the value for all of the specified identities if they have posted a Response Message for this state.
   *
   * A `null` input will return All Identities.
   *
   * @method getValues
   * @param {String[]} [identityIds=null]
   * @return {Object}
   * @return {String} return.identityId
   * @return {String|Number|Boolean|String[]|Number[]|Boolean[]} return.value
   */
  getValues(identityIds) {

    return identityIds
      .map((identityId) => {
        const tracker = this.users[identityId];
        if (tracker) {
          return {
            identityId,
            value: tracker.getValue(),
          };
        }
        return null;
      })
      .filter(result => result); // filter out the null results that lack a tracker
  }

  /**
   * Adds a value for this state for the current authenticated user.
   *
   * @method addValue
   * @param {String|Number|Boolean} value
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  addValue(value, identityId = getClient().user.id) {
    this._addUser(identityId);
    return this.users[identityId].add(value);
  }

  /**
   * Removes a value for this state for the current authenticated user.
   *
   * @method removeValue
   * @param {String|Number|Boolean} value
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  removeValue(value, identityId = getClient().user.id) {
    this._addUser(identityId);
    return this.users[identityId].remove(value);
  }

  /**
   * Given a full Response Summary payload from the server, update this tracker's state and generate any needed change operations.
   *
   * @method synchronize
   * @param {Object} payload
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  synchronize(payload) {
    const changes = [];
    Object.keys(payload).forEach((identityId) => {
      const userFullState = payload[identityId];
      const userState = userFullState[this.name];
      if (userState) {
        this._addUser(identityId);
        const localChanges = this.users[identityId].synchronize(payload);
        changes.push(...localChanges);
      }
    });
    return changes;
  }
}

if (!Core.CRDT) Core.CRDT = {};
Core.CRDT.CRDTMultiIdentityStateTracker = CRDTMultiIdentityStateTracker;
