/**
 * The layerUI contains utilities for working with the layerUI components.
 *
 * The key method to know here is the `init()` method.  Any use of the library will need a call:
 *
 * ```
 * Layer.UI.init({
 *   appId: 'layer:///apps/staging/my-app-id'
 * });
 * ```
 *
 * Or
 *
 * Layer.UI.init({
 *   appId: 'layer:///apps/staging/my-app-id'
 * });
 * ```
 *
 * See layerUI.settings for more options to Layer.UI.init.
 *
 * One other property deserving special mention: layerUI.adapters.  Adapters help you to use these widgets within other UI frameworks.
 * It is not required to use an adapter, but it solves many inconsistencies in how these frameworks handle webcomponents built using this framework.
 *
 * While there are many other methods defined here, for new projects ignore everything except layerUI.settings, Layer.UI.init and layerUI.adapters.
 *
 * @class Layer.UI
 * @static
 */

import { registerComponent, _registerAll, unregisterComponent } from './components/component';
import './handlers/message/layer-message-unknown';
import * as Constants from './constants';
import * as ComponentServices from './component-services';
import Settings from '../settings';
import * as MessageHandlers from './handlers/message/message-handlers';
import * as TextHandlers from './handlers/text/text-handlers';
import * as ListSeparatorManager from './ui-utils/list-separator-manager';
import * as Adapters from './adapters';
import * as MessageActions from './message-actions';
import * as UIUtils from './ui-utils';
import { ErrorDictionary } from '../core/layer-error';

const LayerUI = {

  /**
   * UI Constants
   *
   * @property {Layer.UI.Constants} Constants
   */
  Constants,

  /**
   * XDK Settings
   *
   * @property {Layer.Settings} settings
   */
  settings: Settings,

  /*
   * Register component (jsduck in component.js)
   */
  registerComponent,

  /*
   * Register all components (jsduck in component.js)
   */
  _registerAll,

  /*
   * Unregister component (jsduck in component.js)
   */
  unregisterComponent,

  /*
   * Setup styles for a UI Component (jsduck in component-services.js)
   */
  buildStyle: ComponentServices.buildStyle,

  /*
   * Setup template from a string for a UI Component (jsduck in component-services.js)
   */
  buildAndRegisterTemplate: ComponentServices.buildAndRegisterTemplate,

  /*
   * Setup template from a <template /> for a UI Component (jsduck in component-services.js)
   */
  registerTemplate: ComponentServices.registerTemplate,

  /**
   * Handlers for text and message:
   *
   * @property {Object} handlers
   * @property {Layer.UI.handlers.message} message
   * @property {Layer.UI.handlers.text} text
   */
  handlers: {
    message: MessageHandlers,
    text: TextHandlers,
  },
  components: ComponentServices.ComponentsHash, // backwards compatability

  /**
   * Hash of all UI Component definitions
   *
   * @property {Object} ComponentsHash
   */
  ComponentsHash: ComponentServices.ComponentsHash,

  /**
   * Tools for managing List Separators
   *
   * @property {Layer.UI.UIUtils.ListSeparatorManager} ListSeparatorManager
   */
  ListSeparatorManager,

  /**
   * Adapters that your project has imported
   *
   * @property {Layer.UI.adapters} adapters
   */
  adapters: Adapters,

  /**
   * UI-specific utilities
   *
   * @property {Layer.UI.UIUtils} UIUtils
   */
  UIUtils,

  /**
   * Actions for Messages, used when user taps/clicks on Messages
   *
   * @property {Layer.UI.MessageActions} MessageActions
   */
  MessageActions,
};

/**
 * Call init with any custom settings, and to register all components with the dom.
 *
 * Note that `init()` must be called prior to putting any webcomponents into a document.
 *
 * Note as well that if passing in your appId, you must have instantiated a Layer.Core.Client with that appId
 * prior to putting any webcomponents into your document.
 *
 * ```javascript
 * Layer.UI.init({
 *   appId: 'layer:///apps/staging/my-app-id'
 * });
 * ```
 *
 * See layerUI.settings for more options to Layer.UI.init.
 *
 * @method init
 */
let initRun = false;
LayerUI.init = function init() {
  if (initRun) return;
  LayerUI.setupMixins(Settings.mixins || {});

  // Register all widgets
  _registerAll();

  // Enable the text handlers
  Settings.textHandlers.forEach((handlerName) => {
    TextHandlers.register({ name: handlerName });
  });
  initRun = true;
};

/**
 * Provide additional mixins; must be used prior to calling `Layer.init()`.
 *
 * ```
 * var mixins = {
 *   'my-tag-name1': {
 *      properties: {
 *        prop1: {}
 *      },
 *      methods: {
 *        onCreate() {
 *          console.log("Created");
 *        }
 *      }
 *    }
 * };
 * Layer.UI.setupMixins(mixins);
 * Layer.init({ appId });
 * ```
 *
 * * `setupMixins` may be called multiple times, and can add multiple mixins to the same class.
 *
 * `setupMixins` can also take an array of mixins:
 *
 * ```
 * var mixins = {
 *   'my-tag-name1': [
 *     {
 *        properties: {
 *          prop1: {}
 *        }
 *      },
 *      {
 *        properties: {
 *          prop2: {}
 *        }
 *      }
 *    }]
 * };
 * Layer.UI.setupMixins(mixins);
 * Layer.init({ appId });
 * ```
 *
 * Why use it?  If you have multiple places in your code that specify mixins,
 * they may each separately call this method to setup your mixin instead of
 * having to do it all in one big `Layer.init()` call.
 *
 * @method setupMixins
 * @param {Object} mixins
 */
LayerUI.setupMixins = function setupMixins(mixins) {
  if (initRun) throw new Error(ErrorDictionary.initAlreadyCalled);
  if (!LayerUI.settings._mixins) LayerUI.settings._mixins = {};
  Object.keys(mixins).forEach((componentName) => {
    if (!LayerUI.settings._mixins[componentName]) {
      LayerUI.settings._mixins[componentName] = [];
    }
    if (!Array.isArray(mixins[componentName])) {
      LayerUI.settings._mixins[componentName].push(mixins[componentName]);
    } else {
      LayerUI.settings._mixins[componentName] = LayerUI.settings._mixins[componentName].concat(mixins[componentName]);
    }
  });
};

if (global && global.document) {
  global.document.addEventListener('DOMContentLoaded', () => {
    const useSafariCss = navigator.vendor && navigator.vendor.indexOf('Apple') > -1;
    if (useSafariCss) document.body.classList.add('layer-safari');
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      document.body.classList.add('layer-firefox');
    }
  });
}


export default LayerUI;
