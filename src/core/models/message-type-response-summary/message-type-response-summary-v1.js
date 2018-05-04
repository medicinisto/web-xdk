/*
 * The MessageTypeResponseSummary represents a the Message Part that contains all user Responses to a given Message Part.
 *
 * Message Part has a MIME Type of application/vnd.layer.responsesummary+json
 *
 * Note that this is not part of any default build and to have this class available for your application, import with:
 *
 * ```
 * import '@layerhq/web-xdk/core/models/message-type-response-summary/message-type-response-summary-v1';
 * ```
 *
 * @class  Layer.Core.MessageTypeResponseSummary-v1
 * @extends Layer.Core.Root
 */
import Core from '../../namespace';
import Syncable from '../syncable';
import Root from '../../root';
import { client } from '../../../settings';
import { logger } from '../../../utils';
import { register } from './index';
import { CRDT_TYPES } from '../../../constants';

class MessageTypeResponseSummary extends Root {
  constructor(options) {
    super(options);
    this._participantData = {
      [client.user.id]: {},
    };
    this._states = {};
  }

  reset() {
    this._participantData = {
      [client.user.id]: {},
    };
    this.part = null;
  }


  registerState(name, type) {
    this._states[name] = type;
  }

  /*
   * Adds the specified value to the specified state, and schedules a Response Message to be sent.
   *
   * Note that it is the Tracker's responsibility to generate and track Operation IDs.
   *
   * ```
   * model.responses.addState('click-count', 5);
   * ```
   *
   * @method addState
   * @param {String} name
   * @param {String} value
   */
  addState(name, value) {
    if (!this._participantData[name]) this._participantData[name] = {};
    const oldValue = this._participantData[name];
    this._participantData[name] = value;
    this._addOperations();
    this.parentModel._triggerAsync('message-type-model:change', {
      property: 'responses.' + name,
      newValue: this.getState(name, client.user),
      addedValue: value,
      oldValue,
      identityId: client.user.id,
    });
  }

  /*
   * Sets the named state to the specified value for the specified Identity ID.
   *
   * Use this to setup the initial state of the message when it reaches all participants.
   *
   * @method addInitialResponseState
   * @param {Object} options
   * @param {String} options.name  Name of the state to set (must be registered already)
   * @param {Mixed} options.value  Value of the state (String, Number, or Boolean)
   * @param {String} options.identityId  Identifies the user for whom this state will be registered as their initial state
   */
  addInitialResponseState({ name, value, identityId }) {

  }

  /*
   * Removes the specified value (if present) from the specified state property, and schedules a Response Message to be sent.
   *
   * Note that it is the Tracker's responsibility to identify a suitable Operation ID
   * to remove, or else abort the operation.
   *
   * TODO: Remove any operations that havne't yet been sent from the Response Model.
   *
   * ```
   * model.responses.removeState('selected-color', 'red');
   * ```
   *
   * @method removeState
   * @param {String} name
   * @param {String} value
   */
  removeState(name, value) {
    if (this._participantData[name]) {
      const oldValue = this._participantData[name];
      this._participantData[name] = null;
      this._addOperations();
      this.parentModel._triggerAsync('message-type-model:change', {
        property: 'responses.' + name,
        newValue: null,
        oldValue,
        identityId: client.user.id,
      });
    }
  }

  /*
   * Sets the Status Text to be rendered to users when the next Response Message is sent.
   *
   * Can be called before or after {@link #addState} or {@link #removeState}
   * ```
   * var responseSummary = model.responses;
   * responseSummary.setResponseMessageText('User tried to delete the message but we wouldn't let them');
   * responseSummary.addState('tried-to-delete', true);
   * ```
   *
   * @method setResponseMessageText
   * @param {String} text
   */
  setResponseMessageText(text) {
  }

  /*
   * Creates a Response Model to queue up operations if one hasn't already been created.
   *
   * @private
   * @method _createResponseModel
   */
  _createResponseModel() {

  }

  /*
   * Take the generated operations, put them in the Response Model and schedule the Response Model to be sent.
   *
   * @private
   * @method _addOperations
   * @param {Layer.Core.CRDT.Changes[]} operations
   */
  _addOperations(operations) {

  }

  /*
   * Schedule a Response Message to be sent with all accumulated operations within 100ms.
   *
   * Note that it could as easily be 1ms so that all current executing code can complete,
   * generating all required operations, and then promptly send it.
   *
   * @method _scheduleSendResponseMessage
   */
  _scheduleSendResponseMessage() {

  }

  /*
   * Generate a Message from the Response Model, and send it in our current Conversation.
   *
   * Note that this is automatically called after a short delay, any time
   * `addState` is called changing the state and requiring that state to be shared with all participants.
   * Calling it directly however insures other changes aren't accidently added to this Response Message.
   *
   * @method sendResponseMessage
   */
  sendResponseMessage() {
    throw new Error('Sending this version of Response Message is no longer supported');
  }

  /*
   * Returns an Array or value (depending upon the state type)
   *
   * ```
   * const clickCounterValue = model.responses.getState('click-counter', client.user);
   * ```
   *
   * @method getState
   * @param {String} name
   * @param {String} identityId
   * @returns {String | Number | Boolean | String[] | Number[] | Boolean[]}
   */
  getState(name, identityId) {
    if (!identityId) {
      logger.warn(`Identity not found for Model.getState(${name})`);
      return null;
    }
    const identity = client.getIdentity(identityId);
    const userId = identity.userId;
    if (this._participantData[userId] && name in this._participantData[userId]) {
      const result = this._participantData[userId][name];
      if (this._states[name] === CRDT_TYPES.SET) {
        return result.split(/\s*,\s*/);
      }
      return result;
    }
  }

  /*
   * Returns an array of results where:
   *
   * 1. Each result is of the form `{identityId: 'layer:///identities/frodo-the-dodo', value: 'red'}`
   * 2. Only returns state from the specified Identities
   * 3. Only returns state where a response for that state was sent for that identity
   * 4. A nulled value _will_ still be returned, only if the value was never set will it be left out.
   *
   * ```
   * const allClickCounterValues = model.responses.getStates('click-counter', [client.user, otherIdentity]);
   * allClickCounterValues.forEach(result => console.log(`${result.identityId} has a counter of ${result.value}`));
   * ```
   *
   * @method getStates
   * @param {String} name
   * @param {Layer.Core.Identity[]} identities
   * @returns {Object[]}
   * @returns {String} return.identityId
   * @returns {String | Number | Boolean | String[] | Number[] | Boolean[]} return.value
   */
  getStates(name, identities) {
    identities = identities.filter((identity) => {
      if (identity) return true;
      logger.warn(`Identity not found for Model.getStates(${name})`);
      return false;
    });
    const results = Object.keys(this._participantData)
      .map(userId => ({
        identityId: 'layer:///identities/' + userId,
        value: this._participantData[userId][name],
      }))
      .filter(result => result.value !== undefined);

    return results;
  }

  /*
   * Whenever the Response Summary is updated, import its data into all Trackers.
   *
   * 1. Iterate over every Tracker
   * 2. Call `importData` on each tracker, getting a list of zero or more state changes across all Identities for that tracker's state
   * 3. Trigger change events notifying listeners of any state changes
   *
   * @method parseResponsePart
   * @param {Layer.Core.MessagePart} part
   */
  parseResponsePart(part) {
    const oldValue = this._participantData;
    this._participantData = JSON.parse(part.body).participant_data;

    this.parentModel._triggerAsync('message-type-model:change', {
      property: 'responses.participantData',
      newValue: this._participantData,
      oldValue,
      identityId: Object.keys(this._participantData)[0],
    });
    return true;
  }

  /*
   * Get the Response Message value corresponding to the given `responseName` and `identityId`.
   *
   * @method getResponse
   * @param {String} responseName    Name of the response to lookup
   * @param {String} identityId         Identity ID of the user who made the response
   * @removed
   */

  /*
   * Get _All_ responses from all users that contain the specified `responseName`
   *
   * ```
   * var responses = model.responses.getStates("selection", null);
   * responses.forEach(response => {
   *   const identity = client.getIdentity(response.identityId);
   *   console.log(`${identity.displayName} selected ${response.value}`);
   * }
   * ```
   *
   * This method returns an array of all responses from all users who have a `responseName`, where each element
   * in the array contains:
   *
   * * `identityId` of the user who sent that response
   * * `value` the value of the response
   *
   * Note that a user who has set a `responseName` and then later cleared it will still have a `responseName`
   * property whose value may be an empty string, null, or other empty values. These results are included in the
   * array.
   *
   * @method getResponses
   * @param {String} responseName
   * @param {String[]} [identityIds=null] Only include results from these authorized users (optional)
   * @returns {Object[]} responses
   * @removed
   */
}

MessageTypeResponseSummary.prototype.parentModel = null;

MessageTypeResponseSummary.prototype._participantData = null;
MessageTypeResponseSummary.prototype._currentResponseModel = null;

/*
 * The {@link Layer.Core.MessagePart} object that this model represents.
 *
 * @property {Layer.Core.MessagePart} part
 */
MessageTypeResponseSummary.prototype.part = null;

MessageTypeResponseSummary._supportedEvents = [
  'change',
].concat(Root._supportedEvents);

MessageTypeResponseSummary.inObjectIgnore = Root.inObjectIgnore;
Root.initClass.apply(MessageTypeResponseSummary,
  [MessageTypeResponseSummary, 'MessageTypeResponseSummary', Core]);
Syncable.subclasses.push(MessageTypeResponseSummary);
module.exports = MessageTypeResponseSummary;
register('application/vnd.layer.responsesummary+json', MessageTypeResponseSummary);
