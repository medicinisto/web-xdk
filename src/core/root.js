import Events from 'backbone-events-standalone/backbone-events-standalone';
import Core from './namespace';
import Util, { logger, defer } from '../utils';
import LayerEvent from './layer-event';
import { ErrorDictionary } from './layer-error';


function EventClass() { }
EventClass.prototype = Events;

// Used to generate a unique internalId for every Root instance
const uniqueIds = {};

// Regex for splitting an event string such as obj.on('evtName1 evtName2 evtName3')
const eventSplitter = /\s+/;

/**
 * The root class of all layer objects. Provides the following utilities
 *
 * 1. Mixes in the Backbone event model
 *
 *        var person = new Person();
 *        person.on('destroy', function() {
 *            console.log('I have been destroyed!');
 *        });
 *
 *        // Fire the console log handler:
 *        person.trigger('destroy');
 *
 *        // Unsubscribe
 *        person.off('destroy');
 *
 * 2. Adds a subscriptions object so that any event handlers on an object can be quickly found and removed
 *
 *        var person1 = new Person();
 *        var person2 = new Person();
 *        person2.on('destroy', function() {
 *            console.log('I have been destroyed!');
 *        }, person1);
 *
 *        // Pointers to person1 held onto by person2 are removed
 *        person1.destroy();
 *
 * 3. Adds support for event listeners in the constructor
 *    Any event handler can be passed into the constructor
 *    just as though it were a property.
 *
 *        var person = new Person({
 *            age: 150,
 *            destroy: function() {
 *                console.log('I have been destroyed!');
 *            }
 *        });
 *
 * 4. A _disableEvents property
 *
 *        myMethod() {
 *          if (this.isInitializing) {
 *              this._disableEvents = true;
 *
 *              // Event only received if _disableEvents = false
 *              this.trigger('destroy');
 *              this._disableEvents = false;
 *          }
 *        }
 *
 * 5. A _supportedEvents static property for each class
 *
 *     This property defines which events can be triggered.
 *
 *     * Any attempt to trigger
 *       an event not in _supportedEvents will log an error.
 *     * Any attempt to register a listener for an event not in _supportedEvents will
 *     *throw* an error.
 *
 *     This allows us to insure developers only subscribe to valid events.
 *
 *     This allows us to control what events can be fired and which ones blocked.
 *
 * 6. Adds an internalId property
 *
 *        var person = new Person();
 *        console.log(person.internalId); // -> 'Person1'
 *
 * 7. Adds a toObject method to create a simplified Plain Old Javacript Object from your object
 *
 *        var person = new Person();
 *        var simplePerson = person.toObject();
 *
 * 8. Provides __adjustProperty method support
 *
 *     For any property of a class, an `__adjustProperty` method can be defined.  If its defined,
 *     it will be called prior to setting that property, allowing:
 *
 *     A. Modification of the value that is actually set
 *     B. Validation of the value; throwing errors if invalid.
 *
 * 9. Provides __udpateProperty method support
 *
 *     After setting any property for which there is an `__updateProperty` method defined,
 *     the method will be called, allowing the new property to be applied.
 *
 *     Typically used for
 *
 *     A. Triggering events
 *     B. Firing XHR requests
 *     C. Updating the UI to match the new property value
 *
 *
 * @class Layer.Core.Root
 * @abstract
 * @author Michael Kantor
 */
class Root extends EventClass {

  /**
   * Superclass constructor handles copying in properties and registering event handlers.
   *
   * @method constructor
   * @param  {Object} options - a hash of properties and event handlers
   * @return {Layer.Core.Root}
   */
  constructor(options = {}) {
    super();
    this._layerEventSubscriptions = [];
    this._delayedTriggers = [];
    this._lastDelayedTrigger = Date.now();
    this._events = {};

    // Generate an internalId
    const name = this.constructor.altName || this.constructor.name;
    if (!uniqueIds[name]) uniqueIds[name] = 0;
    this.internalId = name + uniqueIds[name]++;

    // Generate a temporary id if there isn't an id
    if (!this.id && !options.id && this.constructor.prefixUUID) {
      this.id = this.constructor.prefixUUID + Util.generateUUID();
    }

    // Copy in all properties; setup all event handlers
    let key;
    for (key in options) {
      if (this.constructor._supportedEvents.indexOf(key) !== -1) {
        this.on(key, options[key]);
      } else if (key in this && typeof this[key] !== 'function') {
        this[key] = options[key];
      }
    }
    this.isInitializing = false;
  }

  /**
   * Destroys the object.
   *
   * Cleans up all events / subscriptions
   * and marks the object as isDestroyed.
   *
   * @method destroy
   */
  destroy() {
    if (this.isDestroyed) throw new Error(ErrorDictionary.alreadyDestroyed);

    // If anyone is listening, notify them
    this.trigger('destroy');

    // Remove all events, and all pointers passed to this object by other objects
    this.off();

    // Find all of the objects that this object has passed itself to in the form
    // of event handlers and remove all references to itself.
    this._layerEventSubscriptions.forEach(item => item.off(null, null, this));

    this._layerEventSubscriptions = null;
    this._delayedTriggers = null;
    this.isDestroyed = true;
  }

  static isValidId(id) {
    return id.indexOf(this.prefixUUID) === 0;
  }

  /**
   * Convert class instance to Plain Javascript Object.
   *
   * Strips out all private members, and insures no datastructure loops.
   * Recursively converting all subobjects using calls to toObject.
   *
   *      console.dir(myobj.toObject());
   *
   * Note: While it would be tempting to have noChildren default to true,
   * this would result in Message.toObject() not outputing its MessageParts.
   *
   * Private data (_ prefixed properties) will not be output.
   *
   * @method toObject
   * @param  {boolean} [noChildren=false] Don't output sub-components
   * @return {Object}
   */
  toObject(noChildren = false) {
    this.__inToObject = true;
    const obj = {};

    // Iterate over all formally defined properties
    try {
      const keys = [];
      let aKey;
      for (aKey in this.constructor.prototype) if (!(aKey in Root.prototype)) keys.push(aKey);

      keys.forEach((key) => {
        const v = this[key];

        // Ignore private/protected properties and functions
        if (key.indexOf('_') === 0) return;
        if (typeof v === 'function') return;

        // Generate arrays...
        if (Array.isArray(v) || v instanceof Set) {
          obj[key] = [];
          v.forEach((item) => {
            if (item instanceof Root) {
              if (noChildren) {
                delete obj[key];
              } else if (!item.__inToObject) {
                obj[key].push(item.toObject());
              }
            } else {
              obj[key].push(item);
            }
          });
        }

        // Generate subcomponents
        else if (v instanceof Root) {
          if (!v.__inToObject && !noChildren) {
            obj[key] = v.toObject();
          }
        }

        // Generate dates (creates a copy to separate it from the source object)
        else if (v instanceof Date) {
          obj[key] = new Date(v);
        }

        // Generate simple properties
        else {
          obj[key] = v;
        }
      });
    } catch (e) {
      // no-op
    }
    this.__inToObject = false;
    return obj;
  }

  /**
   * Log a warning for attempts to subscribe to unsupported events.
   *
   * @method _warnForEvent
   * @private
   */
  _warnForEvent(eventName) {
    if (!Util.includes(this.constructor._supportedEvents, eventName)) {
      throw new Error('Event ' + eventName + ' not defined for ' + this.toString());
    }
  }

  /**
   * Prepare for processing an event subscription call.
   *
   * If context is a Root class, add this object to the context's subscriptions.
   *
   * @method _prepareOn
   * @private
   */
  _prepareOn(name, handler, context) {
    if (context) {
      if (context instanceof Root) {
        if (context.isDestroyed) {
          throw new Error(ErrorDictionary.isDestroyed);
        }
      }
      if (context._layerEventSubscriptions) {
        context._layerEventSubscriptions.push(this);
      }
    }
    if (typeof name === 'string' && name !== 'all') {
      if (eventSplitter.test(name)) {
        const names = name.split(eventSplitter);
        names.forEach(n => this._warnForEvent(n));
      } else {
        this._warnForEvent(name);
      }
    } else if (name && typeof name === 'object') {
      Object.keys(name).forEach(keyName => this._warnForEvent(keyName));
    }
  }

  /**
   * Subscribe to events.
   *
   * Note that the context parameter serves double importance here:
   *
   * 1. It determines the context in which to execute the event handler
   * 2. Create a backlink so that if either subscriber or subscribee is destroyed,
   *    all pointers between them can be found and removed.
   *
   * ```
   * obj.on('someEventName someOtherEventName', mycallback, mycontext);
   * ```
   *
   * ```
   * obj.on({
   *    eventName1: callback1,
   *    eventName2: callback2
   * }, mycontext);
   * ```
   *
   * @method on
   * @param  {String} name - Name of the event
   * @param  {Function} handler - Event handler
   * @param  {Layer.Core.LayerEvent} handler.event - Event object delivered to the handler
   * @param  {Object} context - This pointer AND link to help with cleanup
   * @return {Layer.Core.Root} this
   */
  on(name, handler, context) {
    this._prepareOn(name, handler, context);
    Events.on.apply(this, [name, handler, context]);
    return this;
  }

  /**
   * Subscribe to the first occurance of the specified event.
   *
   * @method once
   * @return {Layer.Core.Root} this
   */
  once(name, handler, context) {
    this._prepareOn(name, handler, context);
    Events.once.apply(this, [name, handler, context]);
    return this;
  }

  /**
   * Unsubscribe from events.
   *
   * ```
   * // Removes all event handlers for this event:
   * obj.off('someEventName');
   *
   * // Removes all event handlers using this function pointer as callback
   * obj.off(null, f, null);
   *
   * // Removes all event handlers that `this` has subscribed to; requires
   * // obj.on to be called with `this` as its `context` parameter.
   * obj.off(null, null, this);
   * ```
   *
   * @method off
   * @param  {String} name - Name of the event; null for all event names
   * @param  {Function} handler - Event handler; null for all functions
   * @param  {Object} context - The context from the `on()` call to search for; null for all contexts
   * @return {Layer.Core.Root} this
   */


  /**
   * Trigger an event for any event listeners.
   *
   * Events triggered this way will be blocked if _disableEvents = true
   *
   * @method trigger
   * @param {string} eventName    Name of the event that one should subscribe to in order to receive this event
   * @param {Mixed} arg           Values that will be placed within a Layer.Core.LayerEvent
   * @return {Layer.Core.LayerEvent} evt
   */
  trigger(...args) {
    if (this._disableEvents) return null;
    return this._trigger(...args);
  }

  /**
   * Triggers an event.
   *
   * @method trigger
   * @private
   * @param {string} eventName    Name of the event that one should subscribe to in order to receive this event
   * @param {Mixed} arg           Values that will be placed within a Layer.Core.LayerEvent
   * @return {Layer.Core.LayerEvent} evt
   */
  _trigger(...args) {
    if (!Util.includes(this.constructor._supportedEvents, args[0])) {
      if (!Util.includes(this.constructor._ignoredEvents, args[0])) {
        logger.error(this.toString() + ' ignored ' + args[0]);
      }
      return;
    }

    const computedArgs = this._getTriggerArgs(...args);

    Events.trigger.apply(this, computedArgs);

    const parent = this._getBubbleEventsTo && this._getBubbleEventsTo();
    if (parent && args[0] !== 'destroy') {
      parent.trigger(...computedArgs);
    }

    return computedArgs[1];
  }

  /**
   * Test if the specified event name has a handler, and throw an error if it does not.
   *
   * @method _requireEvent
   * @private
   * @param {String} eventName
   */
  _requireEvent(eventName) {
    if (!this.isDestroyed && !this._events[eventName]) {
      throw new Error(`${ErrorDictionary.eventHandlerRequired} '${eventName}'`);
    }
  }


  /**
   * Generates a Layer.Core.LayerEvent from a trigger call's arguments.
   *
   * * If parameter is already a Layer.Core.LayerEvent, we're done.
   * * If parameter is an object, a `target` property is added to that object and its delivered to all subscribers
   * * If the parameter is non-object value, it is added to an object with a `target` property, and the value is put in
   *   the `data` property.
   *
   * @method _getTriggerArgs
   * @private
   * @return {Mixed[]} - First element of array is eventName, second element is Layer.Core.LayerEvent.
   */
  _getTriggerArgs(...args) {
    const computedArgs = Array.prototype.slice.call(args);

    if (args[1]) {
      const newArg = { target: this };

      if (computedArgs[1] instanceof LayerEvent) {
        // A LayerEvent will be an argument when bubbling events up; these args can be used as-is
      } else {
        if (typeof computedArgs[1] === 'object') {
          Object.keys(computedArgs[1]).forEach(name => (newArg[name] = computedArgs[1][name]));
        } else {
          newArg.data = computedArgs[1];
        }
        computedArgs[1] = new LayerEvent(newArg, computedArgs[0]);
      }
    } else {
      computedArgs[1] = new LayerEvent({ target: this }, computedArgs[0]);
    }

    return computedArgs;
  }

  /**
   * Same as _trigger() method, but delays briefly before firing.
   *
   * When would you want to delay an event?
   *
   * 1. There is an event rollup that may be needed for the event;
   *    this requires the framework to be able to see ALL events that have been
   *    generated, roll them up, and THEN fire them.
   * 2. The event is intended for UI rendering... which should not hold up the rest of
   *    this framework's execution.
   *
   * When NOT to delay an event?
   *
   * 1. Lifecycle events frequently require response at the time the event has fired
   *
   * @method _triggerAsync
   * @private
   * @param {string} eventName    Name of the event that one should subscribe to in order to receive this event
   * @param {Mixed} arg           Values that will be placed within a Layer.Core.LayerEvent
   * @return {Layer.Core.Root} this
   */
  _triggerAsync(...args) {
    if (this.isDestroyed) return;
    const computedArgs = this._getTriggerArgs(...args);
    this._delayedTriggers.push(computedArgs);

    // NOTE: It is unclear at this time how it happens, but on very rare occasions, we see processDelayedTriggers
    // fail to get called when length = 1, and after that length just continuously grows.  So we add
    // the _lastDelayedTrigger test to insure that it will still run.
    const shouldScheduleTrigger = this._delayedTriggers.length === 1 ||
      (this._delayedTriggers.length && this._lastDelayedTrigger + 500 < Date.now());
    if (shouldScheduleTrigger) {
      this._lastDelayedTrigger = Date.now();
      defer(() => this._processDelayedTriggers());
    }
  }

  /**
   * Combines a set of events into a single event.
   *
   * Given an event structure of
   * ```
   *      {
   *          customName: [value1]
   *      }
   *      {
   *          customName: [value2]
   *      }
   *      {
   *          customName: [value3]
   *      }
   * ```
   *
   * Merge them into
   *
   * ```
   *      {
   *          customName: [value1, value2, value3]
   *      }
   * ```
   *
   * @method _foldEvents
   * @private
   * @param  {Layer.Core.LayerEvent[]} events
   * @param  {string} name      Name of the property (i.e. 'customName')
   * @param  {Layer.Core.Root}    newTarget Value of the target for the folded resulting event
   */
  _foldEvents(events, name, newTarget) {
    const firstEvt = events.length ? events[0][1] : null;
    const firstEvtProp = firstEvt ? firstEvt[name] : null;
    events.forEach((evt, i) => {
      if (i > 0) {
        firstEvtProp.push(evt[1][name][0]);
        this._delayedTriggers.splice(this._delayedTriggers.indexOf(evt), 1);
      }
    });
    if (events.length && newTarget) events[0][1].target = newTarget;
  }

  /**
   * Fold a set of Change events into a single Change event.
   *
   * Given a set change events on this component,
   * fold all change events into a single event via
   * the Layer.Core.LayerEvent's changes array.
   *
   * @method _foldChangeEvents
   * @private
   */
  _foldChangeEvents() {
    const events = this._delayedTriggers.filter(evt => evt[1].isChange);
    events.forEach((evt, i) => {
      if (i > 0) {
        events[0][1]._mergeChanges(evt[1]);
        this._delayedTriggers.splice(this._delayedTriggers.indexOf(evt), 1);
      }
    });
  }

  /**
   * Execute all delayed events for this compoennt.
   *
   * @method _processDelayedTriggers
   * @private
   */
  _processDelayedTriggers() {
    if (this.isDestroyed) return;
    this._foldChangeEvents();

    this._delayedTriggers.forEach(function (evt) {
      this.trigger(...evt);
    }, this);
    this._delayedTriggers = [];
  }


  _runMixins(mixinName, argArray) {
    this.constructor.mixins.forEach((mixin) => {
      if (mixin.lifecycle && mixin.lifecycle[mixinName]) mixin.lifecycle[mixinName].apply(this, argArray);
    });
  }


  /**
   * Returns a string representation of the class that is nicer than `[Object]`.
   *
   * @method toString
   * @return {String}
   */
  toString() {
    return '[' + this.internalId + (this.isDestroyed ? ' .destroyed' : '') + ']';
  }
}

function defineProperty(newClass, propertyName) {
  const pKey = '__' + propertyName;
  let camel = Util.camelCase(propertyName);
  camel = camel.charAt(0).toUpperCase() + camel.substring(1);
  const hasDefinitions = newClass.prototype['__adjust' + camel] || newClass.prototype['__update' + camel] ||
    newClass.prototype['__get' + camel];
  if (hasDefinitions) {
    // set default value
    newClass.prototype[pKey] = newClass.prototype[propertyName];

    Object.defineProperty(newClass.prototype, propertyName, {
      enumerable: true,
      get: function get() {
        return this['__get' + camel] ? this['__get' + camel](pKey) : this[pKey];
      },
      set: function set(inValue) {
        if (this.isDestroyed) return;
        const initial = this[pKey];
        if (inValue !== initial) {
          if (this['__adjust' + camel]) {
            const result = this['__adjust' + camel](inValue);
            if (result !== undefined) inValue = result;
          }
          this[pKey] = inValue;
        }
        if (inValue !== initial) {
          if (!this.isInitializing && this['__update' + camel]) {
            this['__update' + camel](inValue, initial);
          }
        }
      },
    });
  }
}

/**
 * Initialize a class definition that is a subclass of Root.
 *
 * ```
 * class myClass extends Root {
 * }
 * Root.initClass(myClass, 'myClass');
 * console.log(Layer.Core.myClass);
 * ```
 *
 * With namespace:
 * ```
 * const MyNameSpace = {};
 * class myClass extends Root {
 * }
 * Root.initClass(myClass, 'myClass', MyNameSpace);
 * console.log(MyNameSpace.myClass);
 * ```
 *
 * Defining a class without calling this method means
 *
 * * none of the property getters/setters/adjusters will work;
 * * Mixins won't be used
 * * _supportedEvents won't be setup which means no events can be subscribed to on this class
 *
 *
 * @method initClass
 * @static
 * @param {Function} newClass    Class definition
 * @param {String} className     Class name
 * @param {Object} [namespace=]  Object to write this class definition to
 */
function initClass(newClass, className, namespace) {
  // Make sure our new class has a name property
  try {
    if (newClass.name !== className) newClass.altName = className;
  } catch (e) {
    // No-op
  }

  // Make sure our new class has a _supportedEvents, _ignoredEvents, _inObjectIgnore and EVENTS properties
  if (!newClass._supportedEvents) newClass._supportedEvents = Root._supportedEvents;
  if (!newClass._ignoredEvents) newClass._ignoredEvents = Root._ignoredEvents;

  if (newClass.mixins) {
    newClass.mixins.forEach((mixin) => {
      if (mixin.events) newClass._supportedEvents = newClass._supportedEvents.concat(mixin.events);
      Object.keys(mixin.staticMethods || {})
        .forEach(methodName => (newClass[methodName] = mixin.staticMethods[methodName]));

      if (mixin.properties) {
        Object.keys(mixin.properties).forEach((key) => {
          newClass.prototype[key] = mixin.properties[key];
        });
      }
      if (mixin.methods) {
        Object.keys(mixin.methods).forEach((key) => {
          newClass.prototype[key] = mixin.methods[key];
        });
      }
    });
  }

  // Generate a list of properties for this class; we don't include any
  // properties from Layer.Core.Root
  const keys = Object.keys(newClass.prototype).filter(key =>
    newClass.prototype.hasOwnProperty(key) &&
    !Root.prototype.hasOwnProperty(key) &&
    typeof newClass.prototype[key] !== 'function');

  // Define getters/setters for any property that has __adjust or __update methods defined
  keys.forEach(name => defineProperty(newClass, name));

  if (namespace) namespace[className] = newClass;
}

/**
 * Set to true once destroy() has been called.
 *
 * A destroyed object will likely cause errors in any attempt
 * to call methods on it, and will no longer trigger events.
 *
 * @property {boolean}
 * @readonly
 */
Root.prototype.isDestroyed = false;

/**
 * Every instance has its own internal ID.
 *
 * This ID is distinct from any IDs assigned by the server.
 * The internal ID is gaurenteed not to change within the lifetime of the Object/session;
 * it is possible, on creating a new object, for its `id` property to change.
 *
 * @property {string}
 * @readonly
 */
Root.prototype.internalId = '';

/**
 * True while we are in the constructor.
 *
 * @property {boolean}
 * @readonly
 */
Root.prototype.isInitializing = true;

/**
 * Objects that this object is listening for events from.
 *
 * @property {Layer.Core.Root[]}
 * @private
 */
Root.prototype._layerEventSubscriptions = null;

/**
 * Disable all events triggered on this object.
 * @property {boolean}
 * @private
 */
Root.prototype._disableEvents = false;


Root._supportedEvents = ['destroy', 'all'];
Root._ignoredEvents = [];
module.exports = Root;
module.exports.initClass = initClass;
Core.Root = Root;
