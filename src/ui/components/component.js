/**
 * This is the base class for all UI classes in the Layer UI Framework.
 *
 * It works with the webcomponent API/polyfill to define components that:
 *
 * * Provides getters/setters/defaults for all defined properties
 * * Read the widget's attributes on being initialized, copying them into properties and triggering property setters
 * * Provides created and destroyed callbacks
 * * Provides lifecycle methods that can be modified via custom Mixins
 * * Automate standard template-related tasks
 * * Automate standard event-related tasks
 *
 * A new component is created using:
 *
 * ```
 * var componentDefinition = {
 *   events: ['event-one', 'event-two', 'event-three', 'event-four'],
 *   mixins: [mixinObj1, mixinObj2, mixinObj3],
 *   properties: {
 *      prop1: {
 *          set: function(value) {
 *              this.myRenderer();
 *          }
 *      },
 *      prop2: {
 *          get: function() {
 *              return this.scrollTop;
 *          }
 *      },
 *      prop3: {
 *          value: "Frodo is a Dodo"
 *      },
 *      prop4: {
 *          type: Function
 *      }
 *   },
 *   methods: {
 *     onCreate: function() {
 *        alert("The widget has been created");
 *     },
 *     myRenderer: function() {
 *        this.innerHTML = this.properties.prop1;
 *     }
 *   },
 *   listeners: {
 *     'layer-notification-click': function notificationClick(evt) {
 *          const message = evt.detail.item;
 *          const conversation = message.getConversation();
 *          if (conversation) this.selectedId = conversation.id;
 *       },
 *    }
 *   }
 * };
 * ```
 *
 * A component defined this way can be registered as follows:
 *
 * ```
 * import { UI } from '@layerhq/web-xdk';
 * UI.registerComponent(tagName, componentDefinition);
 * ```
 *
 * ### Properties
 *
 * A property definition can be as simple as:
 *
 * ```
 * UI.registerComponent(tagName, {
 *    properties: {
 *       prop1: {}
 *    }
 * });
 * ```
 *
 * The above code declares `prop1` to be a property, sets up a setter that writes `widget.properties.prop1` any time `widget.prop1` is set,
 * and sets up a getter to read the value from `widget.properties.prop1`.  It also insures that at initialization time, if a `prop1` attribute
 * is found, it will be used as the `prop1` property.
 *
 * Property Definitions support the following keys:
 *
 * *  `set`: A setter function whose inputs are the new value and the old value `set(newValue, oldValue) {...}`.
 *    Note that your setter function is called AFTER this.properties.propName
 *    has been set with the new value; your setter is for any side effects, rendering updates, or additional processing and NOT
 *    for writing the value itself.
 * *  `get`: A getter is needed if getting the property value from `this.properties.propName` is not getting the latest value.
 *    Perhaps you want to return `this.nodes.input.value` to get text typed in by a user.
 * *  `value`: If a `value` key is provided, then this will be the default value of your property, to be used if a value is
 *    not provided when instantiating the component.
 * *  `type`: Currently accepts `Boolean`, `Number`, `Function`.  Using a type makes the system
 *    more forgiving when processing strings.  This exists because attributes frequently arrive as strings due to the way HTML attributes work.
 *    For example:
 *    * if type is Boolean, then "false", "null", "undefined", "" and "0" are evaluated as `false`; all other values are `true`
 *    * Using this with functions will cause your function string to be evaled, but will lose your function scope and `this` pointer.
 *    * Using this with a number will turn "1234" into `1234`
 * *  `noGetterFromSetter`: Do **not** use the getter function from within the setter.  Used for special cases where
 *    you have a getter that calculates the values, but where your setter should just make do with the last known value
 *    when determining if the value has changed.
 *
 * Example
 *
 * ```
 *  isEnabled: {
 *    type: Boolean,
 *    value: true,
 *    set: function(inValue) {
 *       this.classList.toggle('widget-enabled', inValue);
 *    },
 *    get: function() {
 *       return this.classList.contains('widget-enabled');
 *    }
 * }
 * ```
 *
 * This property definition:
 *
 * * Defaults to `true` unless a value is provided
 * * Will interpret string values as Booleans, turning "false", "null", etc... into `false` and other words into `true`
 * * Will set/get the "widget-enabled" CSS class
 *
 * ### Events
 *
 * As part of your {@link Layer.UI#static-method-registerComponent} call you can pass in an `events` array;
 * this is an array of strings representing events to listen for,
 * and provide as property-based event listeners.
 *
 * Example:
 *
 * ```
 * UI.registerComponent(tagName, {
 *    events: ['layer-something-happening', 'layer-nothing-happening', 'your-custom-event']
 * });
 * ```
 *
 * The above component definition will result in:
 *
 * 1. The component will listen for the 3 events listed, regardless of whether this component triggered the event,
 *    or its child components triggered the event.  `this.addEventListener('your-custom-event')` to intercept this event (the event will still propagate up).
 * 2. The component will define the following properties: `onSomethingHappening`, `onNothingHappening` and `onYourCustomEvent`. These properties
 *    are defined for you as a result of setting the `events` property.
 * 3. Your app can now use either event listeners or property callbacks as illustrated below:
 *
 * Event Listeners:
 *
 * ```
 * document.body.addEventListener('layer-something-happening', myFunc);
 * document.body.addEventListener('layer-nothing-happening', myFunc);
 * document.body.addEventListener('your-custom-event', myFunc);
 * ```
 *
 * Property callbacks:
 * ```
 * widget.onSomethingHappening = myFunc;
 * widget.onNothingHappening = myFunc;
 * widget.onYourCustomEvent = myFunc;
 * ```
 *
 * ### Methods
 *
 * You may provide any methods you want within the `methods` hash; be aware though that some methods names
 * are reserved for use by the framework, and some have specific life-cycle implications for the widget.
 *
 * #### Reserved
 *
 * The following method names are reserved:
 *
 * * `createdCallback`
 * * `attachedCallback`
 * * `detachedCallback`
 * * `attributeChangedCallback`
 *
 * Use of these is built into the webcomponents standard and should not be used.
 *
 * ### Mixins
 *
 * Mixins can be added to a widget in two ways:
 *
 * * Component Developer: A Component may add a `mixins` array to its definition
 * * App Developer: `Layer.init()` can be called with custom mixins
 *
 * #### Using Mixins from the Component
 *
 * A component can include any number of Mixins by adding them to the `mixins` Array:
 *
 * ```
 * // Define a Mixin that can contains `properties`, `methods` and `events`:
 * var mixinObj = {
 *   properties: {
 *     prop2: {}
 *   },
 *   methods: {
 *     method2: function() {
 *       alert("Frodo is a Dodo");
 *     }
 *   }
 * });
 *
 * // Add mixinObj to our Component
 * var componentDefinition = {
 *   mixins: [mixinObj],
 *   properties: {
 *      prop1: {
 *          set: function(value) {
 *              this.myRenderer();
 *          }
 *      }
 *   },
 *   methods: {
 *     method1: function() {
 *       alert("Live Long and Prosper Frodo the Dodo");
 *     }
 *   }
 * });
 *
 * // Create a Component with prop1, prop2, method1 and method2
 * registerComponent(tagName, componentDefinition);
 * ```
 *
 * An app can modify an existing component by adding custom mixins to it using `Layer.init()`.  The `mixins` parameter
 * takes tag-names as keys;
 * (e.g `layer-message-item`, `layer-message-list`, `layer-conversation-view`, etc...)
 *
 * The above Mixin can be added by the App Developer to the Layer Conversation View using the Layer Conversation View's tagName:
 *
 * ```
 *
 * Layer.init({
 *   appId: 'my-app-id',
 *   mixins: {
 *     'layer-conversation-view': mixinObj
 *   }
 * });
 * ```
 *
 * #### Mixin Behaviors
 *
 * Your mixin can be used to:
 *
 * * Add new Events to the widget's `events` array (presumably one of your new methods or subcomponents will call `this.trigger('my-event-name')`)
 * * Add new properties
 * * Add new methods
 * * Add new behaviors to existing properties
 * * Add new behaviors to existing methods
 * * Overwrite existing methods
 *
 * #### Adding an Event
 *
 * ```
 * var mixinObj = {
 *   events: ['my-button-click'],
 *   methods: {
 *     onCreate: function() {
 *       this.nodes.button = document.createElement('button');
 *       this.appendChild(this.nodes.button);
 *       this.nodes.button.addEventListener('click', this._onMyButtonHandler.bind(this));
 *     },
 *     _onMyButtonHandler: function(evt) {
 *       this.trigger('my-button-click', { message: this.item.message });
 *     }
 *   }
 * });
 * ```
 *
 * When the user clicks on the `this.nodes.button`, it will trigger the `my-button-click` event.  By listing
 * `my-button-click` event in the `events` array, this will automatically add the `onMyButtonClick` property.
 * Users of the component can set to their event handler using the `onMyButtonClick` property
 * (or just use `document.addEventListener('my-button-click', callback)`).
 *
 * #### Add new behaviors to existing properties
 *
 * If you are modifying a widget that has an existing property, and you want additional side effects to
 * trigger whenever that property is set, you can add your own `set` method to the property.
 *
 * ```
 * var mixinObj = {
 *   properties: {
 *     message: {
 *       set: function(message) {
 *         this.properties.user = message.sender;
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * The above mixin can be added to any widget;
 *
 * * If the widget already has a `message` property, both the widget's setter and your setter will be called; order of call is not predetermined.
 * * If the widget does *not* already have a `message`, your `message` setter will be called if/when the `message` is set.
 *
 * You can use the Mixin to add any method your widget needs.
 *
 * You can also use the Mixin to enhance methods already provided by your widget:
 *
 * ```
 * var mixinObj = {
 *   methods: {
 *     onCreate: function() {
 *         var div = document.createElement('div');
 *         this.appendChild(div);
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * The above mixin can be added to any widget; the widget's `onCreate` method will be called, AND your `onCreate` method will be called, in no
 * particular order.  You an also use the following `mode` values to change ordering:
 *
 * * `Layer.UI.registerComponent.MODES.BEFORE`: Call your mixin's method before the widget's method
 * * `Layer.UI.registerComponent.MODES.AFTER`: Call your mixin's method after the widget's method
 * * `Layer.UI.registerComponent.MODES.OVERWRITE`: Call only your mixin's method, *not* the widget's method
 * * `Layer.UI.registerComponent.MODES.DEFAULT`: Call your mixin's method in no particular order with regards to the widget's methods
 *
 * ```
 * var mixinObj = {
 *   methods: {
 *     onCreate: {
 *       mode: Layer.UI.registerComponent.MODES.BEFORE,
 *       value: function() {
 *         var div = document.createElement('div');
 *         this.appendChild(div);
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * You can also define a `conditional` on your methods; if any `conditional` function returns `false`, then none of the `BEFORE`, `AFTER`, `DEFAULT` or `OVERWRITE` methods are called:
 *
 * ```
 * var mixinObj = {
 *   methods: {
 *     onRender: {
 *       conditional: function() {
 *         return Boolean(this.item);
 *       },
 *       mode: Layer.UI.registerComponent.MODES.BEFORE,
 *       value: function() {
 *         var div = document.createElement('div');
 *         this.appendChild(div);
 *       }
 *     }
 *   }
 * });
 * ```
 *
 *
 * ### Templates
 *
 * There are a number of ways that a template can be registered to your component.
 *
 * _Define a full Template while registering Component_:
 *
 * ```
 * var template = document.querySelector('template');
 * Layer.UI.registerComponent('my-widget', {
 *     template: template
 * });
 * ```
 *
 * _Define a template string while registering Component_:
 *
 * Note that if passing in a `template` string instead of a `<template/>` node, the template string is assumed to be DOM nodes only,
 * and no `<style/>` blocks, nor the `<template>` tag.
 * If using a template string, you may separately provide a style string:
 *
 * ```
 * Layer.UI.registerComponent('my-widget', {
 *     template: '<div><button />Click me</div>',
 *     style: 'my-widget {display: block}'
 * });
 * ```
 *
 * _Define a template after defining your component_:
 *
 * ```
 * Layer.UI.registerComponent('my-widget', { });
 *
 * Layer.UI.registerTemplate('my-widget', document.querySelector('template'));
 * ```
 *
 * _Define a template string after defining your component_:
 *
 * ```
 * Layer.UI.registerComponent('my-widget', { });
 *
 * Layer.UI.buildAndRegisterTemplate('my-widget', '<div><button />Click me</div>');
 * ```
 *
 * @class Layer.UI.Component
 */
/* eslint-disable no-use-before-define */

import Layer from '../../core';
import Util from '../../utils';
import { ComponentsHash, buildAndRegisterTemplate, registerTemplate } from '../component-services';
import stateManagerMixin from '../mixins/state-manager';
import Settings from '../../settings';
import Mixins from '../mixins';

const logger = Util.logger;
/*
 * Setup the Real structure needed for the `methods` object, not a hash of functions,
 * but a hash of functions with a `mode` parameter
 */
function setupMethods(classDef, methodsIn) {
  const methods = classDef.methods;
  Object.keys(methodsIn).forEach((methodName) => {
    if (!methods[methodName]) methods[methodName] = {};
    const methodDef = methods[methodName];
    const methodInDef = methodsIn[methodName];
    if (!methodDef.methodsBefore) {
      methodDef.methodsBefore = [];
      methodDef.methodLast = [];
      methodDef.methodsAfter = [];
      methodDef.methodsMiddle = [];
      methodDef.conditional = [];
    }

    if (typeof methodInDef === 'function') {
      methodDef.methodsMiddle.push(methodInDef);
    } else if (methodInDef.mode === registerComponent.MODES.BEFORE) {
      methodDef.methodsBefore.push(methodInDef.value);
    } else if (methodInDef.mode === registerComponent.MODES.AFTER) {
      methodDef.methodsAfter.push(methodInDef.value);
    } else if (methodInDef.mode === registerComponent.MODES.OVERWRITE) {
      methodDef.lock = methodInDef.value;
    } else if (methodInDef.mode === registerComponent.MODES.DEFAULT || methodInDef.value && !methodInDef.mode) {
      methodDef.methodsMiddle.push(methodInDef.value);
    } else if (methodInDef.mode === registerComponent.MODES.LAST) {
      methodDef.methodLast.push(methodInDef.value);
    }
    if (methodInDef.conditional) methodDef.conditional.push(methodInDef.conditional);
  });
}

/*
 * Provides a basic mixin mechanism.
 *
 * Provide an array of objects with a `properties` key and a `methods` key,
 * and all property defintions and method defintions will be copied into your classDef UNLESS your classDef
 * has provided its own definition.
 * If your mixin provides a onCreated() method, it will be called after the classDef onCreated() method is called;
 * this will be called for any number of mixins.
 *
 * If your mixin provides a property that is also defined by your component,
 *
 * @method setupMixin
 * @param {Object} classDef
 * @private
 */
function setupMixin(classDef, mixin) {
  const propNames = Object.keys(mixin.properties || {});

  // Copy all properties from the mixin into the class definition,
  // unless they are already defined.
  propNames.forEach((name) => {
    if (!classDef['__' + name]) classDef['__' + name] = [];
    classDef['__' + name].push(mixin.properties[name]);

    // Make sure that this becomes a part of the properties definition of the class if the prop
    // isn't already defined.  used by the props array.
    if (!classDef.properties[name]) {
      // Object.assign would be nice, but IE11 doesn't yet support it, and don't need another polyfill
      classDef.properties[name] = Util.shallowClone(mixin.properties[name]);
    } else {
      if (mixin.properties[name].order !== undefined && classDef.properties[name].order === undefined) {
        classDef.properties[name].order = mixin.properties[name].order;
      }
      if ('value' in mixin.properties[name]) {
        classDef.properties[name].value = mixin.properties[name].value;
      }

      if ('type' in mixin.properties[name]) {
        classDef.properties[name].type = mixin.properties[name].type;
      }

      if (mixin.properties[name].propagateToChildren !== undefined &&
          classDef.properties[name].propagateToChildren === undefined) {
        classDef.properties[name].propagateToChildren = mixin.properties[name].propagateToChildren;
      }
    }
  });

  setupMethods(classDef, mixin.methods || {});
}

/*
 * Merge all mixin function definitions into a single function call.
 *
 * @method finalizeMixinMerge
 * @param {Object} classDef
 * @private
 */
function finalizeMixinMerge(classDef) {
  const propNames = Object.keys(classDef.properties || {});
  propNames.forEach((name) => {
    if (classDef['__' + name]) {

      // NOTE: Modes are currently applied to properties, but we do not yet support OVERWRITE mode.
      const setters = Util.sortBy(classDef['__' + name].filter(def => def.set), (setter) => {
        switch (setter.mode) {
          case registerComponent.MODES.BEFORE:
            return 1;
          case registerComponent.MODES.AFTER:
            return 3;
          default:
            return 2;
        }
      });
      classDef['__set_' + name] = setters.map(setter => setter.set);
    }
  });

  const methodNames = Object.keys(classDef.methods || {});

  methodNames.forEach((methodName) => {
    const methodDef = classDef.methods[methodName];
    let methodList = [
      ...methodDef.methodsBefore,
      ...methodDef.methodsMiddle,
      ...methodDef.methodsAfter,
      ...methodDef.methodLast,
    ];
    if (methodDef.lock) methodList = [methodDef.lock, ...methodDef.methodLast];

    // For each method, either set the method to be the function, or set it to be the
    // getTheMethod function which assembles all of the conditionals and mixins into a single function.
    if (methodList.length === 1 && !methodDef.conditional.length) {
      classDef.methods[methodName] = methodList[0];
    } else {
      classDef['__method_' + methodName] = methodList;
      classDef.methods[methodName] = getTheMethod(classDef, methodDef.conditional, classDef['__method_' + methodName]);
    }
  });
}

/*
 * This function returns a function that keeps the conditionals and methods in scope
 * so that they can be run at any time as our new method definition.
 */
function getTheMethod(classDef, conditionals, methods) {
  return function runMixinMethods(...args) {
    let result;
    for (let i = 0; i < conditionals.length; i++) {
      if (!conditionals[i].apply(this, args)) return;
    }

    methods.forEach(function runMixinMethodsIterator(method) {
      const resultTmp = method.apply(this, args);
      if (resultTmp !== undefined) result = resultTmp;
    }, this);
    return result;
  };
}

/*
 * Add all mixin events in, and then call setupEvents on each event
 */
function setupEvents(classDef) {
  classDef.mixins.filter(mixin => mixin.events).forEach((mixin) => {
    classDef.events = classDef.events.concat(mixin.events);
  });
  classDef.events.forEach(eventName => setupEvent(classDef, eventName));
}

/*
 * For each event defined in the `events` property, setup an `onXXX` property.
 *
 * The `onXXX` property works by:
 *
 * 1. Doing nothing unless the app sets this event property to a Function
 * 2. Listening for the specified event via addEventListener
 * 3. Calling any provided function with the event provided by addEventListener
 * 4. Call removeEventListener should this property ever change
 *
 * @method setupEvent
 * @private
 * @param {Object} classDef
 * @param {String} eventName
 */
function setupEvent(classDef, eventName) {
  const camelEventName = Util.camelCase(eventName.replace(/^layer-/, ''));
  const callbackName = 'on' + camelEventName.charAt(0).toUpperCase() + camelEventName.substring(1);
  if (!classDef.properties[callbackName]) {
    classDef.properties[callbackName] = {
      type: Function,
      set(value) {
        if (this.properties['old-' + eventName]) {
          this.removeEventListener(eventName, this.properties['old-' + eventName]);
          this.properties['old-' + eventName] = null;
        }
        if (value) {
          this.addEventListener(eventName, value);
          this.properties['old-' + eventName] = value;
        }
      },
    };
  }
}

/*
 * Get an array of property descriptions.
 *
 * @method
 * @private
 * @param {Object} classDef
 */
function getPropArray(classDef) {
  // Translate the property names into definitions with property/attribute names
  return Object.keys(classDef.properties).map(propertyName => ({
    propertyName,
    attributeName: Util.hyphenate(propertyName),
    type: classDef.properties[propertyName].type,
    order: classDef.properties[propertyName].order,
    noGetterFromSetter: classDef.properties[propertyName].noGetterFromSetter,
    propagateToChildren: classDef.properties[propertyName].propagateToChildren,
    value: classDef.properties[propertyName].value,
  }))
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      } else if (a.order !== undefined) {
        return -1;
      } else if (b.order !== undefined) {
        return 1;
      } else {
        return 0;
      }
    });
}


/*
 * Cast a property value to its specified type
 */
function castProperty(type, value) {
  // Some special handling is needed for some properties as they may be delivered
  // as strings HTML delivers attributes as strings.
  switch (type) {
    // Translate strings into booleans
    case Boolean:
      if (['false', '0', 'null', 'undefined'].indexOf(value) !== -1) {
        return false;
      } else {
        return Boolean(value);
      }

    case Number:
      return Number(value);

    // Translate strings into functions
    case Function:
      /* eslint-disable-next-line */
      return typeof value === 'string' ? eval('(' + value + ')') : value;
  }
  return value;
}

/*
 * Define a single property based on a single property from the Component's `properties` definition.
 *
 * Will setup the properties getter, setter, default value, and type.
 *
 * @method setupProperty
 * @private
 * @param {Object} classDef   The class definition object
 * @param {Object} prop       A property definition as generated by getPropArray
 * @param {Object} propertyDefHash  A hash of all property definitions for use in reflection
 */
function setupProperty(classDef, prop, propertyDefHash) {
  const newDef = {};
  const name = prop.propertyName;
  const propDef = classDef.properties[name];

  // Copy our property definition into our hash of definitions
  // which will be associated with this class for reflection purposes
  propertyDefHash[name] = propDef;

  // If a getter is provided, use it. else provide a getter that returns this.properties[name].
  // However, if the call comes before we have a properties object, this is an initialization phase
  // where we should not yet have properties so return undefined.

  // NOTE: Do not use arrow functions; that will change the "this" pointer.
  newDef.get = function getter() {
    if (this.properties._internalState.disableGetters) {
      return this.properties[name];
    } else {
      return propDef.get ? propDef.get.apply(this) : this.properties[name];
    }
  };


  // The property setter will set this.properties[name] and then if there is a custom setter, it will be invoked.
  // This means that the setter does NOT need to write to this.properties, but can handle side effects, transformations, etc...
  newDef.set = function propertySetter(value) {
    logger.debug(`Set property ${this.tagName}.${name} to `, value);
    if (this.properties._internalState.onDestroyCalled) return;

    if (propDef.type) value = castProperty(propDef.type, value);

    const oldValue = prop.noGetterFromSetter ? this.properties[name] : this[name];
    if (oldValue !== value || this.properties._internalState.inPropInit.indexOf(name) !== -1) {

      // can't call setters with this on because the setters will set other properties which should not
      // trigger further setters if there was no actual change
      const initIndex = this.properties._internalState.inPropInit.indexOf(name);
      const wasInit = initIndex !== -1;
      if (wasInit) this.properties._internalState.inPropInit.splice(initIndex, 1);

      this.properties[name] = value;
      if (classDef['__set_' + name] && !this.properties._internalState.disableSetters) {
        classDef['__set_' + name].forEach(function propertySetterIterator(setter) {
          setter.call(this, value, wasInit ? null : oldValue);
        }, this);
      }

      if (propDef.propagateToChildren) {
        Object.keys(this.nodes).forEach((nodeName) => {
          this.nodes[nodeName][name] = value;
        });
        if (this._isList) {
          const childNodes = this.childNodes;
          let i;
          for (i = 0; i < childNodes.length; i++) {
            if (childNodes[i]._isListItem) childNodes[i][name] = value;
          }
        }
      }

      const listeners = this.properties._internalState.propertyListeners[name];
      if (listeners) listeners.forEach(fn => fn(value, wasInit ? null : oldValue, this));
    }
  };

  // Write the property def to our class that will be passed into document.registerElement(tagName, classDef)
  classDef[name] = newDef;
}

let registerAllCalled = false;
function registerComponent(tagName, classDef) {
  if (!ComponentsHash[tagName]) ComponentsHash[tagName] = {};
  ComponentsHash[tagName].def = classDef;

  if (classDef.template) {
    ComponentsHash[tagName].template = classDef.template;
  }
  delete classDef.template; // deletes templates that are empty and fail the above test

  if (classDef.style) {
    ComponentsHash[tagName].style = classDef.style;
    delete classDef.style;
  }

  if (registerAllCalled) _registerComponent(tagName);
}

function _registerComponent(tagName) {
  const classDef = ComponentsHash[tagName].def;
  const { template } = ComponentsHash[tagName];

  if (template) {
    if (typeof template === 'string') {
      buildAndRegisterTemplate(tagName, template);
    } else if (template.getAttribute('layer-template-registered') !== 'true') {
      registerTemplate(tagName, template);
    }
  }

  // Insure property exists
  if (!classDef.properties) classDef.properties = {};
  if (!classDef.methods) classDef.methods = {};
  if (!classDef.events) classDef.events = [];
  if (!classDef.mixins) classDef.mixins = [];
  classDef.mixins.push(stateManagerMixin);

  // Add in custom mixins specified via Layer.UI.settings
  if (Settings._mixins[tagName]) {
    classDef.mixins = classDef.mixins.concat(Settings._mixins[tagName]);
  }
  classDef.mixins = classDef.mixins
    .map(mixin => (typeof mixin === 'string' ? Mixins[mixin] : mixin))
    .filter(mixin => mixin);

  // Setup all events specified in the `events` property.  This adds properties,
  // so must precede setupMixins
  setupEvents(classDef);

  // Replace all methods with "merge" parameters
  const methods = classDef.methods;
  classDef.methods = {};
  setupMethods(classDef, standardClassMethods);
  setupMethods(classDef, methods);

  // Propare the classDef's properties to merge with Mixin properties
  const properties = classDef.properties;
  classDef.properties = {};
  setupMixin(classDef, { properties });
  setupMixin(classDef, { properties: standardClassProperties });

  // Some mixins may have mixins of their own; add them to the list;
  // every newly added item must also be processed, so insure loop touches on new items as well
  for (let i = 0; i < classDef.mixins.length; i++) {
    const mixins = classDef.mixins[i].mixins;
    if (mixins) {
      mixins.forEach((submixin) => {
        if (classDef.mixins.indexOf(submixin) === -1) classDef.mixins.push(submixin);
      });
    }
  }

  classDef.properties._listeners = {
    value: Object.keys(classDef.listeners || {}),
  };

  classDef.mixins.forEach(mixin => setupMixin(classDef, mixin));
  finalizeMixinMerge(classDef);

  // For each property in the methods hash, setup the setter/getter
  const propertyDefHash = {};
  const props = getPropArray(classDef);

  // Add the property to our object, with suitable getters and setters
  props.forEach(prop => setupProperty(classDef, prop, propertyDefHash));

  // Cleanup; we no longer need this properties object; it can be accessed via propertyDefHash
  delete classDef.properties;

  // For every method, add the expected structure to the function
  Object.keys(classDef.methods).forEach((name) => {
    classDef[name] = {
      value: classDef.methods[name],
      writable: true,
    };
  });
  delete classDef.methods;

  // This veresion of listeners does not blend listeners from multiple mixins
  Object.keys(classDef.listeners || {}).forEach((name) => {
    classDef['__listener-' + name] = {
      value: classDef.listeners[name],
      writable: true,
    };
  });
  delete classDef.listeners;

  /**
   * createdCallback is part of the Webcomponent lifecycle and drives this framework's lifecycle.
   *
   * It is called after the widget has been created.  We use this to initialize properties, nodes,
   * templates, and setup the delay that will call `onAfterCreate`
   *
   * @method createdCallback
   * @private
   */
  classDef.createdCallback = {
    value: function createdCallback() {
      if (!ComponentsHash[tagName]) return;

      this._initializeProperties();
      this.nodes = {};


      // If a template has been assigned for this class, append it to this node, and parse for layer-ids
      const templateNode = this.getTemplate();
      if (templateNode) {
        // If there is a template, then replace any current DOM nodes with that template,
        // but cache those DOM nodes for use by <layer-replaceable-content />
        // Note that those DOM nodes that are children prior to processing the template were
        // generated by the app most commonly, using something like <widget-with-template><div /></widget-with-template>
        if (this.childNodes.length) {
          this.properties.originalChildNodes = Array.prototype.slice.call(this.childNodes);
          while (this.firstChild) this.removeChild(this.firstChild);
        }
        const clone = document.importNode(templateNode.content, true);
        this.appendChild(clone);
        this.setupDomNodes();
      }

      // Call the Compoent's created method which sets up DOM nodes,
      // event handlers, etc...
      this.onCreate();

      // Call the Component's onAfterCreate method which can handle any setup
      // that requires all properties to be set, dom nodes initialized, etc...
      Util.defer(() => this._onAfterCreate());
    },
  };

  /**
   * Any listeners defined in the Component's definition (the `listeners` key of the definition) should wire up an
   * event handler that calls {@link #_handleListenerEvent}
   *
   * @method _setupListeners
   * @private
   */
  classDef._setupListeners = {
    value: function _setupListeners() {
      this._listeners.forEach((eventName) => {
        document.body.addEventListener(eventName, this._handleListenerEvent.bind(this, '__listener-' + eventName));
      });
    },
  };

  /**
   * When an event we are listening for as specfied by the Component's `listeners` key, this method receives and dispatches it to the specified `listener` handler.
   *
   * @method _handleListenerEvent
   * @private
   * @param {String} methodName    __listener-${eventName}
   * @param {Layer.Core.LayerEvent} evt   The event that triggered this listener
   */
  classDef._handleListenerEvent = {
    value: function _handleListenerEvent(methodName, evt) {
      if (this.properties.listenTo.indexOf(evt.target.id) !== -1) {
        this[methodName].apply(this, [evt]);
      }
    },
  };

  /**
   * After the component has been created, and after the creator has had time to initialize properties, finish creation.
   *
   * This method takes care of:
   *
   * * Adding Replaceable Content into the Component (to be reviewed...)
   * * Initializing all properties with value from the instantiator or default values
   * * Calling property setters with initial values
   * * Setup of listeners specified in the Component definition's `listeners` key
   * * Call all of the {@link Layer.UI.Component#onAfterCreate} methods
   *
   * This method can only be called once; and will be blocked on any subsequent call.
   *
   * @method _onAfterCreate
   * @private
   */
  classDef._onAfterCreate = {
    value: function _onAfterCreate() {
      // Allow Adapters to call _onAfterCreate... and then insure its not run a second time
      // This scneario happens during unit tests; not clear if it happens elsewhere
      if (this.properties._internalState.onAfterCreateCalled ||
        this.properties._internalState.onDestroyCalled) return;


      // TODO: Test if this should be built into <layer-replaceable-content /> and moved out of the root class of all Components.
      // NOTE: This is setup prior to property getters and setters because those getters/setters may need access to the `layer-id` defined nodes added via replaceable content
      // HOWEVER: This means that functions for generating dom structures cannot access properties
      // reliably
      this._onProcessReplaceableContent();

      // Before we start initializing all of our properties, enable setters and getters
      this.properties._internalState.disableSetters = false;
      this.properties._internalState.disableGetters = false;

      // Maintain a list of which properties are still needing to be initialized; those still being intitialized
      // may behave a little differently than those that are fully initialized.  Any property that has its value
      // set via our setter is immediately removed from this list.
      this.properties._internalState.inPropInit =
      ComponentsHash[tagName].properties.map(propDef => propDef.propertyName);

      // Initialize each property
      props.forEach((prop) => {

        // Get the currently assigned value put onto the `properties` property.  This may happen
        // if a prior property initialization sets it, or one of the Framework Adaptor (react)
        // directly sets the properties object.
        const value = this.properties[prop.propertyName];

        // UNIT TEST: This line is primarily to keep unit tests from throwing errors
        if (value instanceof Layer.Root && value.isDestroyed) return;

        // replaceable content has special handling and is a "unique" property. This will be ignored until a `<layer-replaceable-content />` component is initialized
        if (prop.propertyName === 'replaceableContent') return;

        // If the property has a value, set it, triggering its setter, and optionally propagating its value to all child components
        const isValueUnset = value === undefined || value === null;
        if (!isValueUnset) {
          // Force the setter to trigger; this will force the value to be converted to the correct type,
          // and call all setters
          this[prop.propertyName] = value;

          if (prop.propagateToChildren) {
            Object.keys(this.nodes).forEach(nodeName => (this.nodes[nodeName][prop.propertyName] = value));
          }
        }


        // If there is no value, but the parent component has the same property name, and is set to propagateToChildren,
        // copy its value into this property. Useful for allowing list-items to automatically grab
        // all parent propagateToChildren properties.
        if ((isValueUnset || value === prop.value) && this.parentComponent) {
          // Get the parentComponent's Property Definition
          const parentComponentProps = ComponentsHash[this.parentComponent.tagName.toLocaleLowerCase()].properties;
          const parentComponentPropDef = parentComponentProps.filter(p => p.propertyName === prop.propertyName)[0];

          // If we found the definition and its propagateToChildren, copy its value
          if (parentComponentPropDef && parentComponentPropDef.propagateToChildren) {
            const parentValue = this.parentComponent.properties[prop.propertyName];
            if (parentValue) this[prop.propertyName] = parentValue;
          }
        }
      });
      this.properties._internalState.inPropInit = [];

      // Warning: these listeners may miss events triggered while initializing properties
      // only way around this is to add another Layer.Utils.defer() to our lifecycle which we are not doing at this time.
      this._setupListeners();

      // Call all onAfterCreate methods from all mixins
      this.onAfterCreate();
    },
  };

  /**
   * A hash of DOM nodes that are important to this widget.
   *
   * Any dom node in a template file that has a `layer-id` will be written to this hash.
   *
   * Example:
   *
   * ```
   * <template>
   *   <a layer-id='link'><img layer-id='image' /></a>
   * </template
   * ```
   *
   * The above template will result in a `nodes` value of:
   *
   * ```
   * {
   *   nodes: {
   *     link: anchorDOMNode,
   *     image: imageDOMNode
   *   }
   * }
   * ```
   *
   * And then allows for code such as:
   *
   * ```
   * render: function() {
   *    this.nodes.image.src = this.properties.url;
   * }
   * ```
   *
   * @property {Object} nodes
   */

  /**
   * attachedCallback is part of the Webcomponent lifecycle and drives this framework's lifecycle.
   *
   * This calls `onAttach` which is where custom components can customize and mixins can add behaviors.
   *
   * @method
   * @private
   */
  classDef.attachedCallback = {
    value: function onAttach() {
      if (this.parentNode) this.onAttach();
    },
  };

  /**
   * Initialize the properties object.
   *
   * This Fixes a bug in webcomponents polyfil that clobbers property getter/setter.
   *
   * The webcomponent polyfil copies in properties before the property getter/setter is applied to the object.
   * As a result, we might have a property of `this.xxxx` that is NOT accessed via `this.properties.xxxx`.
   * Further, the getter and setter functions will not invoke as long as this value is perceived as the definition
   * for this Object. So we delete the property `xxxx` from the object so that the getter/setter up the prototype chain can
   * once again function.
   *
   * @method _initializeProperties
   * @private
   * @param {Object} prop   A property def whose value should be stashed
   */
  classDef._initializeProperties = {
    value: function _initializeProperties() {

      /**
       * Values for all properties of this widget.
       *
       * All properties are stored in `this.properties`; any property defined in the class definition's `properties` hash
       * are read and written here.
       *
       * `this.properties` may have been created and populated prior to this method being called.
       * This typically happens when a UI Framework adapter (React Adaptor) needs to setup initial properties; if properties
       * exists, they may still need to be setup and their setters called.
       *
       * @property {Object} properties
       * @protected
       * @readonly
       */
      if (this.properties && this.properties._internalState) return;
      if (!this.properties) this.properties = {};

      this.properties._internalState = {
        onCreateCalled: false,
        onAfterCreateCalled: false,
        onRenderCalled: false,
        onAttachCalled: false,
        onDetachCalled: false,
        disableSetters: true,
        disableGetters: true,
        inPropInit: [],
        propertyListeners: {},
      };

      // Copy any attribute values into the property, or default property definition values if no attribute found
      props.forEach(prop => this._copyInAttribute(prop));
    },
  };

  /**
   * Handle some messy post-create copying of attribute values over to property
   * values where property setters can fire.
   *
   * Also handles default property values if no attributes are found.
   *
   * @method _copyInAttribute
   * @private
   * @param {Object} prop   A property def object as defined by getPropArray
   */
  classDef._copyInAttribute = {
    value: function _copyInAttribute(prop) {

      let finalValue = null;

      // Special case for React Adapter + Replaceable content makes it possible that the value is already in properties
      let value = prop.propertyName in this.properties ?
        this.properties[prop.propertyName] : this.getAttribute(prop.attributeName);


      // Firefox 57 requires this alternative to getAttribute() for cases where properties are directly set on the DOM
      if (value === null && (this[prop.attributeName] !== undefined || this[prop.propertyName] !== undefined)) {
        value = this[prop.attributeName] || this[prop.propertyName];

        // If this has a value, it clobbers the property definition, and getters/setters cannot be called.
        // Deleting it enables the property definition to once more surface from the prototype.
        delete this[prop.propertyName];
      }

      // If we have found an attribute value to set our property to, use it.
      if (value !== null) {
        finalValue = value;
      }

      // If there is no value set for this property, see if there is a default value defined in the property definition
      else if ('value' in propertyDefHash[prop.propertyName]) {
        finalValue = propertyDefHash[prop.propertyName].value;

        // Don't treat a default value of [] as a static value shared among all instances; instead create a copy
        // Note that we have not yet handled this case for Objects (see `replaceableContent` which often has default values that are Hashes of replacements)
        if (Array.isArray(finalValue)) finalValue = finalValue.concat([]);
      }

      // Cast the property and set it
      this.properties[prop.propertyName] = prop.type ? castProperty(prop.type, finalValue) : finalValue;
    },
  };


  /**
   * detachedCallback is part of the Webcomponent lifecycle and drives this framework's lifecycle.
   *
   * By default, removing this widget from the dom will cause it to be destroyed.
   *
   * Using the `layer-widget-destroyed` event, you may override this behavior using `evt.preventDefault()`:
   *
   * ```
   * document.body.addEventListener('layer-widget-destroyed', function(evt) {
   *    if (evt.detail.target === nodeToNotDestroy) {
   *      evt.preventDefault();
   *    }
   * });
   * ```
   *
   * > *Note*
   * >
   * > Once a node has been removed from the DOM, its events cannot bubble up.  So we *also* trigger the event on
   * > `document.body`. This means that `evt.target` becomes `document.body`. So use `evt.detail.target`
   * > not `evt.target` to identify the removed node.
   *
   * @event layer-widget-destroyed
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.UI.Component} evt.detail.target
   */
  classDef.detachedCallback = {
    value: function detachedCallback() {
      const isMainComponent = this.mainComponent === this;
      this.onDetach();

      // Wait 10 seconds after its been removed, then check to see if its still removed from the dom before doing cleanup and destroy.
      setTimeout(() => {
        if (this.properties._internalState.onDestroyCalled) return;
        if (document.body.contains(this) || document.head.contains(this)) return;
        if (this.trigger('layer-widget-destroyed', { target: this })) {
          if (!isMainComponent || !document.body) {
            this.onDestroy();
          } else if (this.trigger.apply(document.body, ['layer-widget-destroyed', { target: this }])) {
            this.onDestroy();
          }
        }
      }, Settings.destroyAfterDetachDelay);
    },
  };

  /**
   * Any time a widget's attribute has changed, copy that change over to the properties where it can trigger the property setter.
   *
   * @method attributeChangedCallback
   * @private
   * @param {String} name      Attribute name
   * @param {Mixed} oldValue   Original value of the attribute
   * @param {Mixed} newValue   Newly assigned value of the attribute
   */
  classDef.attributeChangedCallback = {
    value: function attributeChangedCallback(name, oldValue, newValue) {
      logger.debug(`Attribute Change on ${this.tagName}.${name} from ${oldValue} to `, newValue);
      this[Util.camelCase(name)] = newValue;
    },
  };

  // Register the component with our components hash as well as with the document.
  // WARNING: Calling this in some browsers may cause immediate registeration of the component prior
  // to reaching the next line of code; putting code after this line may be problematic.
  ComponentsHash[tagName].classDef = document.registerElement(tagName, {
    prototype: Object.create(HTMLElement.prototype, classDef),
  });


  /**
   * Identifies the properties exposed by this component.
   *
   * Used by adapters.  See getPropArray for the structure of each item of the props array
   *
   * @property {Object[]} properties
   * @static
   */
  ComponentsHash[tagName].properties = props;
}

/**
 * A `<template />` dom node OR a string containing DOM nodes, but no `<style>` or `<template>` tags.
 *
 * These templates are used during Component initializations.
 *
 * @property {String | HTMLTemplateElement} template
 * @private
 * @static
 */

/**
 * Stylesheet string.
 *
 * A stylesheet string can be added to the document via `styleNode.innerHTML = value` assignment.
 *
 * @property {String} style
 * @private
 * @static
 */

/**
 * Event definitions.
 *
 * ```
 * UI.registerComponent(tagName, {
 *    events: ['layer-something-happening', 'layer-nothing-happening', 'your-custom-event']
 * });
 * ```
 *
 * The above component definition will result in:
 *
 * 1. The component will listen for the 3 events listed, regardless of whether this component triggered the event,
 *    or its child components triggered the event.  `this.addEventListener('your-custom-event')` to intercept this event (the event will still propagate up).
 * 2. The component will define the following properties: `onSomethingHappening`, `onNothingHappening` and `onYourCustomEvent`. These properties
 *    are defined for you as a result of setting the `events` property.
 * 3. Your app can now use either event listeners or property callbacks as illustrated below:
 *
 *
 * @property {String[]} events
 * @private
 * @static
 */

/**
 * Mixin modes determines how a new method being added to a class will be executed with respect to any other methods.
 *
 * * BEFORE: Run your method before other methods of the same name
 * * AFTER: Run your method after other methods of the same name
 * * OVERWRITE: Run only your method, no other methods of the same name
 * * DEFAULT: Run your method in normal ordering.
 * * LAST: For internal use only; this runs after `AFTER` and should not be used in Mixins,
 *         only in the design of Components that may have mixins added to them.  This is *not* prevented
 *         by use of the `OVERWRITE` mode.
 *
 * @static
 * @property {Object} MODES
 * @property {String} MODES.BEFORE
 * @property {String} MODES.AFTER
 * @property {String} MODES.LAST
 * @property {String} MODES.OVERWRITE
 * @property {String} MODES.DEFAULT
 */
registerComponent.MODES = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  OVERWRITE: 'OVERWRITE',
  DEFAULT: 'DEFAULT',
  LAST: 'LAST',
};


const standardClassProperties = {
  /**
   * Provide a hash of DOM generation functions and/or DOM nodes to insert custom content into.
   *
   * ```
   * var emptyNode = document.createElement("div");
   * emptyNode.innerHTML = "I feel empty";
   * widget.replaceableContent = {
   *    emptyNode: emptyNode,
   *    loadingIndicator: function(component) {
   *      var indicator = document.createElement("div");
   *      indicator.classList.add('loading-indicator');
   *      return indicator;
   *    }
   * };
   * ```
   *
   * @property {Object} replaceableContent
   */
  replaceableContent: {},

  /**
   * Used to track event handlers to subclasses of Layer.Core.Root.
   *
   * Layer.Core.Root will automatically add any event subscription to this array:
   *
   * ```
   * conversation.on(eventName, fn, this);
   * ```
   * will insert the resulting handler into this array.
   *
   * This array makes it easy to unsubscribe to all event subscriptions when {@link Layer.UI.Component#destroy} is called.
   *
   * @property {Object[]} _layerEventSubscriptions
   * @private
   */
  _layerEventSubscriptions: {
    value: [],
  },

  /**
   * Object that the Root Class of all UI Components uses for managing the internal state of the component.
   *
   * > *Note*
   * >
   * > A UI Component may have its own internal state; this should be done as regular properties, and
   * > not as part of the `_internalState` property. This is solely for things that the root component class
   * > uses for managing Lifecycle for ALL UI Components.
   *
   * @private
   * @property {Object} _internalState
   * @property {Boolean} _internalState.onCreateCalled
   * @property {Boolean} _internalState.onAfterCreateCalled
   * @property {Boolean} _internalState.onRenderCalled
   * @property {Boolean} _internalState.onAttachCalled
   * @property {Boolean} _internalState.onDetachCalled
   * @property {Boolean} _internalState.disableSetters     Setters are no longer called; `this.properties[propName]` is still set however.
   * @property {Boolean} _internalState.disableGetters     Getters are no longer called; values returned directly from `this.properties[propName]`
   * @property {String[]} _internalState.inPropInit        Array of property names for properties that have not yet been initialized
   * @property {Object} _internalState.propertyListeners   Property Change Listeners
   */
  _internalState: {},

  /**
   * Set an array of CSS Classes; replaces any previous CSS classes that were part of this array.
   *
   * Typically used to intiialize a component with initial classes rather than for maintaining the set of classes.
   *
   * Why use it? Makes it easier to initialize UI Components:
   *
   * ```
   * UI.registerComponent('my-custom-tag', {
   *    cssClassList: {
   *      value: ['my-css-class1', 'my-css-class2']
   *    }
   * });
   * ```
   *
   * or:
   *
   * ```
   * var widget = document.createElement('my-custom-tag');
   * widget.cssClassList = ['my-css-class1', 'my-css-class2'];
   * ```
   *
   * > *Note*
   * >
   * > Do *not* try manipulating the array; only setting the `cssClassList` property with a *new* array
   * > will cause a rendering update,
   * > manipulating the array will not trigger any setters.
   *
   * @property {String[]} cssClassList
   */
  cssClassList: {
    set(newValue, oldValue) {
      if (newValue) {
        if (!Array.isArray(newValue)) {
          this.properties.cssClassList = newValue = [newValue];
        }
        newValue.forEach(cssClass => this.classList.add(cssClass));
      } else {
        // Revert cssClassList; provide an empty array if trying to clear all classes.
        this.properties.cssClassList = oldValue;
      }

      if (oldValue) {
        oldValue.forEach((cssClass) => {
          if (!newValue || newValue.indexOf(cssClass) === -1) this.classList.remove(cssClass);
        });
      }
    },
  },

  /**
   * Refers to the parent Layer.UI.Component that contains this Component in its template.
   *
   * Note that if the parent does not contain this component in its template, then the developer
   * who created it is responsible for setting this property directly:
   *
   * ```
   * var newComp = document.createElement("layer-avatar");
   * this.nodes.mySubNode.appendChild(newComp);
   * newComp.parentComponent = this;
   * ```
   *
   * @property {Layer.UI.Component} parentComponent
   */
  parentComponent: {},

  /**
   * Refers to the top level containing Component that contains this Component.
   *
   * This is not set; its instead derived from the {@link #parentComponent} tree
   *
   * @property {Layer.UI.Component} mainComponent
   */
  mainComponent: {
    get() {
      if (!this.properties.parentComponent) return this;
      if (!this.properties.mainComponent) {
        this.properties.mainComponent = this.properties.parentComponent.mainComponent;
      }
      return this.properties.mainComponent;
    },
  },

  /**
   * Set an array of DOM IDs that this widget will listen to events from.
   *
   * Each Component has specific events that it listens to; typically these are only generated by a few other widgets.
   *
   * ```
   * <layer-notifier id='nodeA'></layer-notifier>
   * <layer-notifier id='nodeB'></layer-notifier>
   * <layer-conversation-list listen-to="nodeA,nodeB"></layer-conversation-list>
   * ```
   *
   * @property {String[]} listenTo
   */
  listenTo: {
    value: [],
    set(value) {
      if (typeof value === 'string') this.properties.listenTo = value.split(/\s*,\s*/);
    },
  },
};

const standardClassMethods = {
  /**
   * Whever {@link #replaceableContent} is added to a Component, its `onReplaceableContentAdded` method will be called.
   *
   * This method does setup on the `layer-id` of all components in the newly added nodes.
   *
   * @method onReplaceableContentAdded
   * @param {String} name     Name of the replaceable content node `<layer-replaceable-content name='frodo' />`; the name `frodo` will be the parameter value here
   * @param {HTMLElement}     Top level node of the nodes that have been added
   */
  onReplaceableContentAdded: function onReplaceableContentAdded(name, node) {
    this._findNodesWithin(node, (currentNode) => {
      if (!currentNode.properties) currentNode.properties = {};
      currentNode.properties.parentComponent = this;
      if (!currentNode.id) currentNode.id = Util.generateUUID();
      let layerId = currentNode.getAttribute('layer-id');
      const camelName = Util.camelCase(currentNode.tagName.toLowerCase().replace(/^layer-/, ''));

      if (!layerId && currentNode.tagName.indexOf('LAYER') === 0 && !this.nodes[camelName]) {
        layerId = camelName;
      }
      this.nodes[layerId || currentNode.id] = currentNode;
    });
  },


  /**
   * Add a change listener for the specified property
   *
   * ```
   * widget.addPropertyListener('conversationId', function(newValue, oldValue) {
   *    console.log("The new conversation id is ", newValue);
   * });
   * ```
   *
   * @method addPropertyListener
   * @param {String} name     Name of the property
   * @param {Function} fn     Function to call when the property changes
   * @param {Mixed} fn.newValue
   * @param {Mixed} fn.oldValue
   */
  addPropertyListener(name, fn) {
    const propertyListeners = this.properties._internalState.propertyListeners;
    if (!propertyListeners[name]) propertyListeners[name] = [];
    propertyListeners[name].push(fn);
  },

  /**
   * The setupDomNodes method looks at all child nodes of this node that have layer-id properties and indexes them in the `nodes` property.
   *
   * Typically, this node has child nodes loaded via its template, and ready by the time your `created` method is called.
   *
   * This call is made on your behalf prior to calling `created`, but if using templates after `created` is called,
   * you may need to call this directly.
   *
   * @method setupDomNodes
   * @protected
   */
  setupDomNodes: function setupDomNodes() {
    this.nodes = {};

    this._findNodesWithin(this, (node, isComponent) => {
      const layerId = node.getAttribute && node.getAttribute('layer-id');
      if (layerId) this.nodes[layerId] = node;

      if (isComponent) {
        if (!node.properties) node.properties = {};
        node.properties.parentComponent = this;
      }
    });
  },

  /**
   * Iterate over all child nodes generated by the template; skip all subcomponent's child nodes.
   *
   * If callback returns a value, then what is sought has been found; stop searching.  The returned value is the return value
   * for this function.
   *
   * If searching for ALL matches, do not return a value in your callback.
   *
   * @method _findNodesWithin
   * @private
   * @param {HTMLElement} node    Node whose subtree should be called with the callback
   * @param {Function} callback   Function to call on each node in the tree
   * @param {HTMLElement} callback.node   Node that the callback is called on
   * @param {Boolean} callback.isComponent   Is the node a Component from this framework
   */
  _findNodesWithin: function _findNodesWithin(node, callback) {
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      const innerNode = children[i];
      if (innerNode instanceof HTMLElement) {
        const isLUIComponent = Boolean(ComponentsHash[innerNode.tagName.toLowerCase()]);
        const result = callback(innerNode, isLUIComponent);
        if (result) return result;

        // If its not a custom webcomponent with children that it manages and owns, iterate on it
        if (!isLUIComponent) {
          const innerResult = this._findNodesWithin(innerNode, callback);
          if (innerResult) return innerResult;
        }
      }
    }
  },

  /**
   * Return the template for this Component.
   *
   * Get the default template:
   *
   * ```
   * var template = widget.getTemplate();
   * ```
   *
   * Typical components should not need to call this; this will be called automatically prior to calling the Component's `created` method.
   * Some components wanting to reset dom to initial state may use this method explicitly:
   *
   * ```
   * var template = this.getTemplate();
   * var clone = document.importNode(template.content, true);
   * this.appendChild(clone);
   * this.setupDomNodes();
   * ```
   *
   * @method getTemplate
   * @protected
   * @returns {HTMLTemplateElement}
   */
  getTemplate: function getTemplate() {
    const tagName = this.tagName.toLocaleLowerCase();

    if (ComponentsHash[tagName].style) {
      const styleNode = document.createElement('style');
      styleNode.id = 'style-' + this.tagName.toLowerCase();
      styleNode.innerHTML = ComponentsHash[tagName].style;
      document.getElementsByTagName('head')[0].appendChild(styleNode);
      ComponentsHash[tagName].style = ''; // insure it doesn't get added to head a second time
    }
    return ComponentsHash[tagName].template;
  },

  /**
   * Triggers a dom level event which bubbles up the dom.
   *
   * Call with an event name and a `detail` object:
   *
   * ```
   * this.trigger('something-happened', {
   *   someSortOf: 'value'
   * });
   * ```
   *
   * The `someSortOf` key, and any other keys you pass into that object can be accessed via `evt.detail.someSortOf` or `evt.detail.xxxx`:
   *
   * ```
   * // Listen for the something-happened event which because it bubbles up the dom,
   * // can be listened for from any parent node
   * document.body.addEventListener('something-happened', function(evt) {
   *   console.log(evt.detail.someSortOf);
   * });
   * ```
   *
   * {@link Layer.UI.Component#events} can be used to generate properties to go with your events, allowing
   * the following widget property to be used:
   *
   * ```
   * this.onSomethingHappened = function(evt) {
   *   console.log(evt.detail.someSortOf);
   * });
   * ```
   *
   * Note that events may be canceled via `evt.preventDefault()` and your code may need to handle this:
   *
   * ```
   * if (this.trigger('something-is-happening')) {
   *    doSomething();
   * } else {
   *    cancelSomething();
   * }
   * ```
   *
   * @method trigger
   * @protected
   * @param {String} eventName
   * @param {Object} detail
   * @returns {Boolean} True if process should continue with its actions, false if application has canceled
   *                    the default action using `evt.preventDefault()`
   */
  trigger: function trigger(eventName, details) {
    const evt = new CustomEvent(eventName, {
      detail: details,
      bubbles: true,
      cancelable: true,
    });
    this.dispatchEvent(evt);
    return !evt.defaultPrevented;
  },

  /**
   * Return array of matching elements as an Array.
   *
   * This basically just calls this.querySelectorAll and then returns a proper Array rather than a NodeList.
   *
   * @method querySelectorAllArray
   * @protected
   * @param {String} XPath selector
   * @returns {HTMLElement[]}
   */
  querySelectorAllArray: function querySelectorAllArray(selector) {
    return Array.prototype.slice.call(this.querySelectorAll(selector));
  },

  /**
   * Toggle a CSS Class.
   *
   * Why do we have this? Well, sadly as long as we support IE11 which has an incorrect implementation
   * of node.classList.toggle, we will have to do this ourselves.
   *
   * @method toggleClass
   * @param {String} className
   * @param {Boolean} [enable=!enable]
   */
  toggleClass: function toggleClass(...args) {
    const cssClass = args[0];
    const enable = (args.length === 2) ? args[1] : !this.classList.contains(cssClass);
    this.classList[enable ? 'add' : 'remove'](cssClass);
  },

  /**
   * Shorthand for `document.createElement` followed by a bunch of standard setup.
   *
   * ```
   * var avatar = this.createElement({
   *   name: "myavatar",
   *   size: "large",
   *   users: [client.user],
   *   parentNode: this.nodes.avatarContainer
   * });
   * console.log(avatar === this.nodes.myavatar); // returns true
   * ```
   *
   * TODO: Most `document.createElement` calls in this UI Framework should be updated to use this.
   *
   * Note that because all properties are initialized by this call, there is no need for asynchronous initialization,
   * so unless suppressed with the `noCreate` parameter, all initialization is completed synchronously.
   *
   * @method createElement
   * @param {String} tagName           The type of HTMLElement to create (includes Layer.UI.Component instances)
   * @param {Object} properties        The properties to initialize the HTMLElement with
   * @param {HTMLElement} [properties.parentNode]  The node to setup as the `parentNode` of our new UI Component
   * @param {String} [properties.name]   Set `this.nodes[name] = newUIElement`
   * @param {String[]} [properties.classList]  Array of CSS Class names to add to the new UI Component
   * @param {Boolean} [properties.noCreate=false]    Do not call `_onAfterCreate()`; allow the lifecycle to flow asyncrhonously instead of rush it through synchronously.
   */
  createElement: function createElement(tagName, properties) {
    const node = document.createElement(tagName);
    node.parentComponent = this;
    const ignore = ['parentNode', 'name', 'classList', 'noCreate'];

    Object.keys(properties).forEach((propName) => {
      if (ignore.indexOf(propName) === -1) node[propName] = properties[propName];
    });
    if (properties.classList) properties.classList.forEach(className => node.classList.add(className));
    if (properties.parentNode) properties.parentNode.appendChild(node);
    if (properties.name) this.nodes[properties.name] = node;

    if (!properties.noCreate) {
      if (typeof CustomElements !== 'undefined') CustomElements.upgradeAll(node);
      if (node._onAfterCreate) node._onAfterCreate();
    }
    return node;
  },

  /**
   * MIXIN HOOK: Each time a Component is initialized, its onCreate methods will be called.
   *
   * This is called before any properties have been set; use this for initialization that does not
   * depend upon properties.
   *
   * What can be setup here:
   *
   * * The UI Component's template has already been imported, so all DOM Nodes have been setup, and this is
   *   a good place to wire up event handlers for those nodes
   * * This is a good place to initialize state variables that need initial values
   * * If there are DOM Nodes not in the template that need to be added (and which are not generated conditionally
   *   based on some property values), this is a good place to create and insert them.
   *
   * Note that for any given Component there may be many `onCreate` methods, and using Mixins, you may
   * add more.  All of them will be called.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       methods: {
   *         onCreate: function() {
   *           var button = document.createElement('button');
   *           button.innerText = "Help";
   *           button.addEventListener("click", myHelpFunc);
   *           this.appendChild(button);
   *           this.nodes.myButton = button;
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onCreate
   */
  onCreate: {
    mode: registerComponent.MODES.AFTER,
    value: function onCreate() {
      this.properties._internalState.onCreateCalled = true;
    },
  },

  /**
   * As part of the lifecycle, this must fire before onAfterCreate because onAfterCreate assumes that all dom have loaded via templates/elsewhere.
   *
   * TODO: Need to test against raw JS and various frameworks to insure we always have a css class 'layer-replaceable-content' div
   *
   * @method
   * @private
   */
  _onProcessReplaceableContent() {},

  /**
   * MIXIN HOOK: Each time a Component is initialized, its onAfterCreate methods will be called.
   *
   * While one could use {@link #onCreate}, this handler allows you to wait for all
   * properties to be set before your intialization code is run, making this ideal for any setup that
   * depends upon initial property values.
   *
   * {@link #onRender} is automatically called once `onAfterCreate` has completed.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       methods: {
   *         onAfterCreate: function() {
   *           // Conditionally generated DOM handled in onAfterCreate
   *           if (this.showHelpButton) {
   *             var button = document.createElement('button');
   *             button.innerText = "Help";
   *             button.addEventListener("click", myHelpFunc);
   *             this.appendChild(button);
   *             this.nodes.myButton = button;
   *           }
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onAfterCreate
   */
  onAfterCreate: {
    mode: registerComponent.MODES.LAST,
    value: function onAfterCreate() {
      this.properties._internalState.onAfterCreateCalled = true;
      this.onRender();
      if (this.properties._callOnAttachAfterCreate) {
        this.properties._callOnAttachAfterCreate = false;
        this.onAttach();
      }
    },
  },

  /**
   * MIXIN HOOK: Called when rendering the widget.
   *
   * This is called when:
   *
   * 1. Initializing the UI Component, after {@link Layer.UI.Component#onAfterCreate} and before
   *    {@link Layer.UI.Component#onAttach}
   * 2. A property that is key to rendering has been replaced with a new value
   *
   * This will call {@link #onRerender} on completion.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       properties: {
   *         buttonText: {
   *           set: function(newValue) {
   *             this.onRender();
   *           }
   *         }
   *       },
   *       methods: {
   *         onRender: function() {
   *           this.nodes.myButton.innerText = this.buttonText;
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onRender
   */
  onRender: {
    conditional: function onCanRender() {
      return this.properties._internalState.onAfterCreateCalled;
    },
    mode: registerComponent.MODES.LAST,
    value: function onRender() {
      this.properties._internalState.onRenderCalled = true;
      this.onRerender();
    },
  },

  /**
   * MIXIN HOOK: Called any time a property that is key to rendering has emited a `change` event.
   *
   * Typically, this is called:
   *
   * 1. During initialization, after {@link #onRender}, to initialize the more dynamic content
   * 2. Any time a key property value emits a `change` event
   * 3. Any time a very minor property has changed that does not justify rerendering the whole Component
   *
   * Typically the {@link #onRender} method is called instead if core data for the rendering has changed.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       properties: {
   *         disabled: {
   *           set: function(newValue) {
   *             this.onRerender();
   *           }
   *         }
   *       },
   *       methods: {
   *         onRerender: function() {
   *           this.nodes.mybutton.disabled = this.disabled;
   *           this.toggleClass('is-disabled-component', this.disabled);
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onRerender
   */
  onRerender: {
    conditional: function onCanRerender() {
      return this.properties._internalState.onAfterCreateCalled;
    },
  },

  /**
   * MIXIN HOOK: Each time a Component is inserted into a Document, its onAttach methods will be called.
   *
   * This call always happens:
   *
   * * After {@link #onAfterCreate}
   * * After the first call to {@link #onRender} but there may be subsequent calls to {@link #onRender}
   * * After `this.parentNode` has a value
   * * After the node is within the Document's `<body/>`
   *
   * Any rendering that depends upon knowing the size of the UI component (assuming the size is flexible)
   * must wait until this point to find that size.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       methods: {
   *         onAttach: function() {
   *           if (this.clientWidth > 500) {
   *              this.nodes.bigNode.style.display = 'block';
   *           } else {
   *              this.nodes.bigNode.style.display = 'none';
   *           }
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onAttach
   */
  onAttach: {
    conditional: function onAttachConditional() {
      if (!this.properties._internalState.onAfterCreateCalled) {
        this.properties._callOnAttachAfterCreate = true;
        return false;
      } else {
        return true;
      }
    },
    mode: registerComponent.MODES.BEFORE,
    value: function onAttach() {
      this.properties._internalState.onAttachCalled = true;
    },
  },

  /**
   * MIXIN HOOK: Each time a Component is removed from document.body, its onDetach methods will be called.
   *
   * Note that the {@link Layer.UI.Component#event-layer-widget-destroyed} event will still trigger even if you provide this, so be aware of
   * what that event will do and that your widget may be destroyed a few seconds after this function is called.
   *
   * ```
   * Layer.init({
   *   mixins: {
   *     'some-component-tag-name': {
   *       methods: {
   *         onAttach: function() {
   *           this.properties.intervalId = setInterval(function() {
   *              if (this.clientWidth > 500) {
   *                 this.nodes.bigNode.style.display = 'block';
   *              } else {
   *                 this.nodes.bigNode.style.display = 'none';
   *              }
   *            }, 2000);
   *         },
   *         onDetach: fuunction() {
   *            clearInterval(this.properties.intervalId);
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @method onDetach
   */
  onDetach: {
    mode: registerComponent.MODES.AFTER,
    value: function onDetach() {
      if (this.properties.mainComponent && !this.properties.mainComponent.contains(this)) {
        this.properties.mainComponent = null;
      }

      if (this.properties.parentComponent && !this.properties.parentComponent.contains(this)) {
        this.properties.parentComponent = null;
      }
      this.properties._internalState.onDetachCalled = true;
    },
  },

  /**
   * MIXIN HOOK: Add a `onDestroy` method to your component which will be called when your component has been removed fromt the DOM.
   *
   * Use this instead of the WebComponents reserved `detachedCallback`.  The reserved method
   * takes care of unsubscribing from events from all Layer.Core.Root instances before calling `onDestroy`.
   *
   * Your `onDestroy` callback will run after the node has been removed from the document
   * for at least 10 seconds, or after a call to {@link #destroy}.
   * See the {@link #event-layer-widget-destroyed} event to prevent the widget from being destroyed after removing
   * it from the document.
   *
   * @method onDestroy
   */
  onDestroy: function onDestroy() {
    this.properties._internalState.propertyListeners = null;
    this.properties._internalState.onDestroyCalled = true;
    this.properties._internalState.disableSetters = true;
    this.properties._layerEventSubscriptions
      .forEach(subscribedObject => subscribedObject.off(null, null, this));
    this.properties._layerEventSubscriptions = [];
    this.classList.add('layer-node-destroyed');
  },

  /**
   * Call this to destroy the UI Component.
   *
   * Destroying will cause it to be removed from its parent node, it will call destroy on all child nodes,
   * and then call the {@link #onDestroy} method.
   *
   * > *Note*
   * >
   * > destroy is called to remove a component, but it is not a lifecycle method; a component that has been removed
   * > from the DOM some otherway will cause {@link #onDestroy} to be called but `destroy()` will _not_ be called.
   *
   * @method destroy
   */
  destroy: function destroy() {
    if (this.properties._internalState.onDestroyCalled) return;
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
    Object.keys(this.nodes || {}).forEach((name) => {
      if (this.nodes[name] && this.nodes[name].destroy) this.nodes[name].destroy();
    });
    this.onDestroy();
  },
};

/**
 * @class Layer.UI
 */

/**
 * Register a component using the specified HTML tagName.
 *
 * See Layer.UI.Component for details on using this.
 *
 * @method registerComponent
 * @static
 * @param {String} tagName    Tag name that is being defined (`layer-avatar`)
 * @param {Object} classDef    Definition of your class
 * @param {Object} classDef.properties    Definition of your class properties
 * @param {Object} classDef.methods    Definition of your class methods
 * @param {String[]} classDef.events    Array of events to listen for and repackage as event handler properties
 * @param {Mixed} classDef.template     A `<template />` node or a template string such as `<div><button /></div>`
 * @param {String} classDef.style       A String with CSS styles for this widget
 */

/**
 * Unregister a component.  Must be called before Layer.init().
 *
 * Use this call to prevent a component from being registered with the document.
 * Currently this works only on components that have been already called with `Layer.UI.registerComponent`
 * but which have not yet been completed via a call to `Layer.init()`.
 *
 * This is not typically needed, but allows you to defer creation of a widget, and then at some point later in your application lifecycle
 * define a replacement for that widget. You can not redefine an html tag that is registered with the document... but this prevents it from
 * being registered yet.
 *
 * After calling `unregisterComponent`, you *may* register a replacement component _after_ `Layer.init()` has been called.
 *
 * @method unregisterComponent
 */
function unregisterComponent(tagName) {
  delete ComponentsHash[tagName];
}

/**
 * Registers all defined components with the browser as WebComponents.
 *
 * This is called by `Layer.init()` and should not be called directly.
 *
 * @private
 * @method _registerAll
 */
function _registerAll() {
  if (!registerAllCalled) {
    registerAllCalled = true;
    Object.keys(ComponentsHash)
      .filter(tagName => typeof ComponentsHash[tagName] !== 'function')
      .forEach(tagName => _registerComponent(tagName));
  }
}

module.exports = {
  registerComponent,
  _registerAll,
  unregisterComponent,
};

