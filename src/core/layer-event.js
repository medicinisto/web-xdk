/**
 * This class represents a Layer Event, and is used as the parameter for all event handlers.
 *
 * Calls to
 *
 *      obj.trigger('eventName2', {hey: 'ho'});
 *
 * results in:
 *
 *      obj.on('eventName2', function(layerEvent) {
 *          alert(layerEvent.target.toString() + ' has fired a value of ' + layerEvent.hey);
 *      });
 *
 * Change events (events ending in ':change') get special handling:
 *
 *      obj.trigger('obj:change', {
 *          newValue: 55,
 *          oldValue: 25,
 *          property: 'hey'
 *      });
 *
 * results in your event data being wrapped in a `changes` array:
 *
 *      obj.on('obj:change', function(layerEvent) {
 *          layerEvent.changes.forEach(function(change) {
 *              alert(layerEvent.target.toString() + ' changed ' +
 *                    change.property + ' from ' + change.oldValue +
 *                    ' to ' + change.newValue);
 *          });
 *      });
 *
 * The `Layer.Core.LayerEvent.getChangesFor()` and `Layer.Core.LayerEvent.hasProperty()` methods
 * simplify working with xxx:change events so you don't need
 * to iterate over the `changes` array.
 *
 * @class Layer.Core.LayerEvent
 */
import Core from './namespace';

export default class LayerEvent {
  /**
   * Constructor for LayerEvent.
   *
   * @method constructor
   * @param  {Object} args - Properties to mixin to the event
   * @param  {string} eventName - Name of the event that generated this LayerEvent.
   * @return {Layer.Core.LayerEvent}
   */
  constructor(args, eventName) {
    let ptr = this;

    // Is it a change event?  if so, setup the change properties.
    if (eventName.match(/:change$/)) {
      this.changes = [{}];
      // All args get copied into the changes object instead of this
      ptr = this.changes[0];
      this.isChange = true;
    } else {
      this.isChange = false;
    }

    // Copy the args into either this Event object... or into the change object.
    // Wouldn't be needed if this inherited from Root.
    Object.keys(args).forEach((name) => {
      // Even if we are copying properties into the change object, target remains
      // a property of LayerEvent.
      if (ptr !== this && name === 'target') {
        this.target = args.target;
      } else {
        ptr[name] = args[name];
      }
    });
    this.eventName = eventName;
  }

  /**
   * Call `cancel` on any event that is {@link #cancelable} to prevent its default behavior.
   *
   * @method cancel
   */
  cancel() {
    if (this.cancelable) {
      this.canceled = true;
    }
  }

  /**
   * Call `returnValue` on any event that expects a value from the event listeners.
   *
   * @method returnValue
   * @param {Mixed} value
   */
  returnValue(value) {
    this.returnedValue = value;
  }

  /**
   * Returns true if the specified property was changed.
   *
   * Returns false if this is not a change event.
   *
   *      if (layerEvent.hasProperty('age')) {
   *          handleAgeChange(obj.age);
   *      }
   *
   * @method hasProperty
   * @param  {string}  name - Name of the property
   * @return {Boolean}
   */
  hasProperty(name) {
    if (!this.isChange) return false;
    return Boolean(this.changes.filter(change => change.property === name).length);
  }

  /**
   * Get all changes to the property.
   *
   * Returns an array of changes.
   * If this is not a change event, will return []
   * Changes are typically of the form:
   *
   *      layerEvent.getChangesFor('age');
   *      > [{
   *          oldValue: 10,
   *          newValue: 5,
   *          property: 'age'
   *      }]
   *
   * @method getChangesFor
   * @param  {string} name - Name of the property whose changes are of interest
   * @return {Object[]}
   */
  getChangesFor(name) {
    if (!this.isChange) return [];
    return this.changes.filter(change => change.property === name);
  }

  /**
   * Merge changes into a single changes array.
   *
   * The other event will need to be deleted.
   *
   * @method _mergeChanges
   * @protected
   * @param  {Layer.Core.LayerEvent} evt
   */
  _mergeChanges(evt) {
    this.changes = this.changes.concat(evt.changes);
  }
}

/**
 * Indicates that this is a change event.
 *
 * If the event name ends with ':change' then
 * it is treated as a change event;  such
 * events are assumed to come with `newValue`, `oldValue` and `property` in the Layer.Core.LayerEvent.changes property.
 * @property {Boolean} [isChange=false]
 */
LayerEvent.prototype.isChange = false;

/**
 * Array of changes (Change Events only).
 *
 * If its a Change Event, then the changes property contains an array of change objects
 * which each contain:
 *
 * * oldValue
 * * newValue
 * * property
 *
 * @property {Object[]} [changes]
 */
LayerEvent.prototype.changes = null;

/**
 * Component that was the source of the change.
 *
 * If one calls
 *
 *      obj.trigger('event');
 *
 * then obj will be the target.
 * @property {Layer.Core.Root} [target]
 */
LayerEvent.prototype.target = null;

/**
 * The name of the event that created this instance.
 *
 * If one calls
 *
 *      obj.trigger('myevent');
 *
 * then eventName = 'myevent'
 *
 * @property {String} eventName
 */
LayerEvent.prototype.eventName = '';

/**
 * If the event is cancelable, then call Layer.Core.LayerEvent.cancel to update this value.
 *
 * @property {Boolean} [canceled=false]
 * @readonly
 */
LayerEvent.prototype.canceled = false;

/**
 * Is the event cancelable; if so then one could call Layer.Core.LayerEvent.cancel on it
 *
 * @property {Boolean} [cancelable=false]
 * @readonly
 */
LayerEvent.prototype.cancelable = false;

/**
 * Value provided to this event by an event listener
 *
 * @property {Mixed} [returnedValue]
 */
LayerEvent.prototype.returnedValue = null;

Core.LayerEvent = LayerEvent;
