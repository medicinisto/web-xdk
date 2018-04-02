import { randomString } from '../../utils';
import { CRDT_TYPES } from '../../constants';
import Core from '../namespace';

/**
 * Simple class for managing value and operationId.
 *
 * @class Layer.Core.CRDT.AddOperation
 */
class AddOperation {

  /**
   * Represents an "Add" operation
   *
   * @method constructor
   * @private
   * @param {Object} options
   * @param {Mixed} options.value   The value that is selected/set
   * @param {String[]} [options.ids]  Operation IDs that resulted in those values
   */
  constructor({ value, ids }) {
    this.value = value;
    this.ids = ids && ids.length ? ids : [randomString(CRDTStateTracker.OperationLength)]; // eslint-disable-line no-use-before-define
  }
  hasAnId(ids) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < this.ids.length; j++) {
        if (this.ids[j] === ids[i]) return true;
      }
    }
    return false;
  }
  removeId(id) {
    const index = this.ids.indexOf(id);
    if (index !== -1) this.ids.splice(index, 1);
  }
}

/**
 * A simple class for reporting on changes that need to be performed (or that have been performed via `synchronize()`)
 *
 * @class Layer.Core.CRDT.Changes
 */
class Changes {
  /**
   * Represents a change
   *
   * @method constructor
   * @private
   * @param {Object} options
   * @param {String} options.type   The Operation type chosen from Layer.Constants.CRDT_TYPES
   * @param {String} options.name   The state name that this tracks
   * @param {String} options.id     The operation ID
   * @param {Mixed} options.value   The value that was added/removed
   * @param {Mixed} options.oldValue   The value that was replaced
   * @param {String} options.identityId The identityId of the user whose state this is
   */

  constructor({ type, operation, name, id, value, oldValue, identityId }) {
    this.type = type;
    this.operation = operation;
    this.name = name;
    this.id = id;
    this.value = value;
    this.oldValue = oldValue;
    this.identityId = identityId;
  }

  toSerializableObject() {
    return {
      operation: this.operation,
      type: this.type,
      value: this.value,
      name: this.name,
      id: this.id,
    };
  }
}

/**
 * Class for tracking, syncing and performing changes for a given user and one state variable of that user.
 *
 * @class Layer.Core.CRDT.StateTracker
 */
class CRDTStateTracker {

  /**
   * @method constructor
   * @param {Object} options
   * @param {String} options.type   The Operation type chosen from Layer.Constants.CRDT_TYPES
   * @param {String} options.name   The state name that this tracks
   * @param {String} options.identityId  The Identity ID of the user this state is for
   */
  constructor({ type, name, identityId }) {
    this.type = type;
    this.name = name;
    this.identityId = identityId;
    this.adds = [];
    this.removes = new Set();
  }

  /**
   * Returns the current value of this state; either an array if its a Set or a value if not.
   *
   * @method getValue
   * @returns {Mixed}
   */
  getValue() {
    if (this.type === CRDT_TYPES.SET) {
      return this.adds.map(addOperation => addOperation.value);
    } else if (this.adds.length) {
      return this.adds[0].value;
    } else {
      return null;
    }
  }

  /**
   * Add a value to the tracker and return Change Operations.
   *
   * @method add
   * @param {String|Number|Boolean} value
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  add(value) {
    if (this.adds.filter(anAdd => anAdd.value === value).length) return [];
    const addOperation = new AddOperation({ value });
    return this._add(addOperation) || [];
  }

  /**
   * Removes a value from this tracker and return Change Operations.
   *
   * @method remove
   * @param {String|Number|Boolean} value
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  remove(value) {
    const addOperations = this.adds.filter(anAdd => anAdd.value === value);
    const changes = [];
    addOperations.forEach((addOperation) => {
      addOperation.ids.forEach((id) => {
        const localChanges = this._remove(id);
        if (localChanges && localChanges.length) changes.push(...localChanges);
      });
    });
    return changes;
  }

  /**
   * Adds an operation to this tracker's state and return Change Operations.
   *
   * @method _add
   * @private
   * @param {Layer.Core.CRDT.AddOperation} addOperation
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  _add(addOperation) {
    const oldValue = this.getValue();
    const removes = [];

    // Technically, there should only be a single `id` but the addOperation object does have to support multiple ids.
    const generateAddOps = () => addOperation.ids.map(id => (new Changes({
      operation: 'add',
      type: this.type,
      name: this.name,
      value: addOperation.value,
      identityId: this.identityId,
      oldValue,
      id,
    })));

    // If all IDs have already been "removed" then this operation is a no-op
    // Note that we overwrite addOperation.ids to remove any removed IDs before this addOperation
    // object can be pushed into the adds array.
    addOperation.ids = addOperation.ids.filter(id => !this.removes.has(id));
    if (addOperation.ids.length === 0) return null;

    // Current state is empty so we just add and return
    if (this.adds.length === 0) {
      this.adds.push(addOperation);

      // Return the cahnges.
      return generateAddOps();
    }

    // if we got here, adds is already non empty. If the operation has previously been applied then do nothing
    if (this.adds.filter(anAdd => addOperation.hasAnId(anAdd.ids)).length) {
      return null;
    }

    // if we got here, adds is already non empty. First Writer Wins, so we can't add a new value - new operation goes to removes
    if (this.type === CRDT_TYPES.FIRST_WRITER_WINS) {
      addOperation.ids.forEach(id => this.removes.add(id));
      return null;
    }

    // reselection enabled, so we first remove old selection
    if (this.type === CRDT_TYPES.LAST_WRITER_WINS || this.type === CRDT_TYPES.LAST_WRITER_WINS_NULLABLE) {
      const oldOperation = this.adds.pop();
      oldOperation.ids.forEach(anId => this.removes.add(anId));
    }

    // Add the LWW, LWWN or Set operation to the adds array
    this.adds.push(addOperation);

    // Return the changes.
    removes.push(...generateAddOps());
    return removes;
  }

  /**
   * Removes an operation to this tracker's state and return Change Operations.
   *
   * @method _remove
   * @private
   * @param {String} operationId   One id to be found in the AddOperation.ids value.
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  _remove(operationId) {
    // Remove operations are not supported on these behavior types
    if (this.type === CRDT_TYPES.FIRST_WRITER_WINS || this.type === CRDT_TYPES.LAST_WRITER_WINS) {
      return null;
    }

    // Remove this id from every AddOperation object in the adds array
    this.adds.forEach(addOperation => addOperation.removeId(operationId));

    // Remove any AddOperation objects that have no more operation ids
    const removedOperations = [];
    this.adds = this.adds.filter((addOperation) => {
      if (!addOperation.ids.length) removedOperations.push(addOperation);
      return addOperation.ids.length;
    });

    // Add this to the removed operations
    this.removes.add(operationId);

    // Return the changes
    if (removedOperations.length) {
      return removedOperations.map(addOperation => (new Changes({
        operation: 'remove',
        type: this.type,
        name: this.name,
        identityId: this.identityId,
        id: operationId,
        value: addOperation.value,
        oldValue: null,
      })));
    }
  }

  /**
   * Given a full Response Summary payload from the server, update this tracker's state and generate any needed change operations.
   *
   * @method synchronize
   * @param {Object} payload
   * @returns {Layer.Core.CRDT.Changes[]}
   */
  synchronize(payload) {
    const initialValue = this.getValue();
    const userPayload = payload[this.identityId] || {};
    const { adds, removes } = userPayload[this.name];
    const oldAdds = this.adds;
    const oldRemoves = this.removes;

    this.adds = adds.map(add => new AddOperation(add));

    this.removes = new Set(); // IE 11 does not support new Set(removes)
    removes.forEach(value => this.removes.add(value));

    oldRemoves.forEach((operationId) => {
      this._remove(operationId);
    });

    const addOperations = oldAdds.map((addOperation) => {
      if (addOperation instanceof AddOperation) {
        return addOperation;
      } else {
        return new AddOperation({
          ids: addOperation.ids,
          value: addOperation.value,
        });
      }
    });

    addOperations.forEach((addOperation) => {
      this._add(addOperation);
    });

    const finalValue = this.getValue();
    return [new Changes({
      operation: finalValue ? 'add' : 'remove',
      type: this.type,
      name: this.name,
      value: finalValue,
      oldValue: initialValue,
      identityId: this.identityId,
    })];
  }
}

CRDTStateTracker.OperationLength = 6;

if (!Core.CRDT) Core.CRDT = {};
Core.CRDT.CRDTStateTracker = CRDTStateTracker;
Core.CRDT.Changes = Changes;
Core.CRDT.AddOperation = AddOperation;

module.exports = {
  CRDTStateTracker,
  Changes,
};
