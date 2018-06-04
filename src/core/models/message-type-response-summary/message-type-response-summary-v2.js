/**
 * The MessageTypeResponseSummary represents a the Message Part that contains all user Responses to a given Message Part.
 *
 * Message Part has a MIME Type of application/vnd.layer.responsesummary+json
 *
 * @class  Layer.Core.MessageTypeResponseSummary
 * @extends Layer.Core.Root
 */
import Core from '../../namespace';
import Syncable from '../syncable';
import Root from '../../root';
import { client } from '../../../settings';
import CRDTMultiIdentityTracker from '../../crdt/multi-identity-state-tracker';
import { logger, randomString } from '../../../utils';
import { ErrorDictionary } from '../../layer-error';
import { register } from './index';

class MessageTypeResponseSummary extends Root {
  constructor(options) {
    super(options);
    this._trackers = {};
  }

  reset() {
    Object.keys(this._trackers).forEach(stateName => this._trackers[stateName].reset());
    this.part = null;
  }

  /**
   * Register a state name that is used by this Message Type, and create a Tracker for that state.
   *
   * There are 3 categories of state:
   *
   * 1. State that is modified by this client, and which other clients listen to
   * 2. States that are modified by other clients and which this client listens to
   * 3. States that are modified by this and other clients and which this client listens to
   *
   * Any other category would mean that this client does not care about the value and does not
   * need to register a tracker for that state.
   *
   * Note that each Tracker tracks a given state name for all Identities stored within the message.
   *
   * * The Tracker instantiates one subtracker per user who has responded.
   * * The Tracker must instantiate new subtrackers on the fly as new
   *   responders post responses.
   *
   * @method registerState
   * @param {String} name
   * @param {String} type   Value chosen from Layer.Constants.CRDT_TYPES
   */
  registerState(name, type) {
    if (this._trackers[name]) {
      if (this._trackers[name].type !== type) throw new Error('Tracker cannot be reregistered');
      return;
    }

    // If we have existing Response Data (this.part), provide it to the new tracker to initialize its state.
    this._trackers[name] = new CRDTMultiIdentityTracker({ name, type });
    if (this.part) {
      this._trackers[name].synchronize(JSON.parse(this.part.body));
    }
  }

  /**
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
    const operations = this._trackers[name].addValue(value);
    if (operations && operations.length) {
      const evt = {
        property: 'responses.' + name,
        newValue: this.getState(name, client.user.id),
        addedValue: operations[0].value,
        oldValue: operations[0].oldValue,
        identityId: client.user.id,
      };
      this._addOperations(operations, evt);
      this.parentModel._triggerAsync('message-type-model:change', evt);
    }
  }

  /**
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
    if (!this.parentModel.initialResponseState) {
      this.parentModel.initialResponseState = [];
    }
    this.parentModel.initialResponseState.push({
      operation: 'add',
      type: this._trackers[name].type,
      value,
      name,
      id: randomString(6),
      identity_id: identityId,
    });
  }

  /**
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
   * Removing state only works for States that are of type `Set` and `LWWN` (Last Writer Wins Nullable)
   *
   * @method removeState
   * @param {String} name
   * @param {String} value
   */
  removeState(name, value) {
    const oldValue = this.getState(name, client.user.id);
    const operations = this._trackers[name].removeValue(value);
    if (operations && operations.length) {
      const evt = {
        property: 'responses.' + name,
        newValue: this.getState(name, client.user.id),
        oldValue,
        identityId: client.user.id,
      };
      this._addOperations(operations, evt);
      this.parentModel._triggerAsync('message-type-model:change', evt);
    }
  }

  /**
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
    this._createResponseModel();
    this._currentResponseModel.displayModel.text = text;
  }

  /**
   * Creates a Response Model to queue up operations if one hasn't already been created.
   *
   * @private
   * @method _createResponseModel
   */
  _createResponseModel() {
    if (!this._currentResponseModel) {
      const ResponseModel = Core.Client.getMessageTypeModelClass('ResponseModel');
      const StatusModel = Core.Client.getMessageTypeModelClass('StatusModel');
      this._currentResponseModel = new ResponseModel({
        displayModel: new StatusModel({}),
        responseTo: this.parentModel.message ? this.parentModel.message.id : null,
        responseToNodeId: this.parentModel.part ? this.parentModel.nodeId : this.parentModel.parentId,
      });
    }
  }

  /**
   * Take the generated operations, put them in the Response Model and schedule the Response Model to be sent.
   *
   * @private
   * @method _addOperations
   * @param {Layer.Core.CRDT.Changes[]} operations
   * @param {Object} changeDef
   */
  _addOperations(operations, changeDef) {
    if (operations && operations.length) {
      this._createResponseModel();

      // The ResponseModel understands how to take a `set` operation and serialize it
      this._currentResponseModel.addOperations(operations, changeDef);

      this._scheduleSendResponseMessage();
    }
  }

  /**
   * Schedule a Response Message to be sent with all accumulated operations within 100ms.
   *
   * Note that it could as easily be 1ms so that all current executing code can complete,
   * generating all required operations, and then promptly send it.
   *
   * @method _scheduleSendResponseMessage
   */
  _scheduleSendResponseMessage() {
    if (!this._sendResponseTimeout) {
      this._sendResponseTimeout = setTimeout(() => this.sendResponseMessage(), 100);
    }
  }

  /**
   * Generate a Message from the Response Model, and send it in our current Conversation.
   *
   * Note that this is automatically called after a short delay, any time
   * `addState` is called changing the state and requiring that state to be shared with all participants.
   * Calling it directly however insures other changes aren't accidently added to this Response Message.
   *
   * @method sendResponseMessage
   */
  sendResponseMessage() {
    if (this.isDestroyed || !this._currentResponseModel || !this._currentResponseModel.operations.length) return;
    this._sendResponseTimeout = 0;

    if (this.parentModel.message && this.parentModel.part && !this.parentModel.message.isNew()) {
      const evt = this.parentModel.trigger('message-type-model:sending-response-message', {
        respondingToModel: this.parentModel,
        responseModel: this._currentResponseModel,
        cancelable: true,
      });

      // If the event was canceled, do nothing
      if (evt.canceled) {
        this._currentResponseModel = null;
      }

      // Fix up the response model's properties and then call `send`
      else {
        const response = this._currentResponseModel;
        this._currentResponseModel = null;

        if (!response.responseTo) response.responseTo = this.parentModel.message.id;
        if (!response.responseToNodeId) {
          response.responseToNodeId = this.parentModel.part ? this.parentModel.nodeId : this.parentModel.parentId;
        }
        response.send({ conversation: this.parentModel.message.getConversation() });
      }
    } else if (this.parentModel.message) {
      this.parentModel.message.once('messages:sent', this.sendResponseMessage.bind(this), this);
    } else {
      this.parentModel.once('message-type-model:has-new-message', this.sendResponseMessage.bind(this), this);
    }
  }

  /**
   * Returns an Array or value (depending upon the state type)
   *
   * ```
   * const clickCounterValue = model.responses.getState('click-counter', client.user.id);
   * ```
   *
   * @method getState
   * @param {String} name
   * @param {String} identityId
   * @returns {String | Number | Boolean | String[] | Number[] | Boolean[]}
   */
  getState(name, identityId) {
    if (!identityId) {
      logger.warn(`Response-Summary: Identity not found for Model.getState(${name})`);
      return null;
    }
    if (this._trackers[name]) {
      return this._trackers[name].getValue(identityId);
    } else {
      throw new Error(ErrorDictionary.modelStateNotRegistered);
    }
  }

  /**
   * Returns an array of results where:
   *
   * 1. Each result is of the form `{identityId: 'layer:///identities/frodo-the-dodo', value: 'red'}`
   * 2. Only returns state from the specified Identities
   * 3. Only returns state where a response for that state was sent for that identity
   * 4. A nulled value _will_ still be returned, only if the value was never set will it be left out.
   *
   * ```
   * const allClickCounterValues = model.responses.getStates('click-counter', [client.user.id, otherIdentityIDs]);
   * allClickCounterValues.forEach(result => console.log(`${result.identityId} has a counter of ${result.value}`));
   * ```
   *
   * @method getStates
   * @param {String} name
   * @param {String[]} identityIds
   * @returns {Object[]}
   * @returns {String} return.identityId
   * @returns {String | Number | Boolean | String[] | Number[] | Boolean[]} return.value
   */
  getStates(name, identityIds) {
    identityIds = identityIds.filter((identity) => {
      if (identity) return true;
      logger.warn(`Response-Summary: Identity not found for Model.getStates(${name})`);
      return false;
    });
    if (this._trackers[name]) {
      return this._trackers[name].getValues(identityIds);
    } else {
      throw new Error(ErrorDictionary.modelStateNotRegistered);
    }
  }

  /**
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
    let hasChanges = false;
    this.part = part;
    const payload = JSON.parse(part.body);
    Object.keys(this._trackers).forEach((stateName) => {
      const tracker = this._trackers[stateName];

      // Note that `synchronize` has no knowledge of what states for what identities have
      // changed, and will import `stateName` for each Identity and identify changes.
      // Typically, multiple Identities would not change in a single update.
      // synchronize returns an array of zero or more Layer.Core.CRDT.Changes objects
      const changes = tracker.synchronize(payload);

      // Typically changes would be [] for most states,
      changes.forEach((change) => {
        hasChanges = true;
        this.parentModel._triggerAsync('message-type-model:change', {
          property: 'responses.' + stateName,
          newValue: change.value,
          oldValue: change.oldValue,
          identityId: change.identityId,
        });
      });
    });
    return hasChanges;
  }

  /**
   * Get the Response Message value corresponding to the given `responseName` and `identityId`.
   *
   * @method getResponse
   * @param {String} responseName    Name of the response to lookup
   * @param {String} identityId         Identity ID of the user who made the response
   * @removed
   */

  /**
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

MessageTypeResponseSummary.prototype._trackers = null;
MessageTypeResponseSummary.prototype._currentResponseModel = null;
MessageTypeResponseSummary.prototype._sendResponseTimeout = null;

/**
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
register('application/vnd.layer.responsesummary-v2+json', MessageTypeResponseSummary);
