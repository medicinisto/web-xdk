/**
 * @class Layer.UI
 * @static
 *
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
 */

import { registerComponent, _registerAll, unregisterComponent } from './components/component';
import './handlers/message/layer-message-unknown';
import Constants from './constants';
import ComponentServices, { ComponentsHash } from './component-services';
import Settings from '../settings';
import MessageHandlers from './handlers/message/message-handlers';
import TextHandlers from './handlers/text/text-handlers';
import ListSeparatorManager from './ui-utils/list-separator-manager';
import Adapters from './adapters';
import MessageActions from './message-actions';
import UIUtils from './ui-utils/index';

const LayerUI = {
  Constants,
  settings: Settings,
  registerComponent,
  _registerAll,
  unregisterComponent,
  buildStyle: ComponentServices.buildStyle,
  buildAndRegisterTemplate: ComponentServices.buildAndRegisterTemplate,
  registerTemplate: ComponentServices.registerTemplate,
  handlers: {
    message: MessageHandlers,
    text: TextHandlers,
  },
  components: ComponentsHash, // backwards compatability
  ComponentsHash,
  ListSeparatorManager,
  adapters: Adapters,
  UIUtils,
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
 * @static
 */
LayerUI.init = function init() {
  LayerUI.setupMixins(Settings.mixins || {});

  // Register all widgets
  _registerAll();

  // Enable the text handlers
  Settings.textHandlers.forEach((handlerName) => {
    TextHandlers.register({ name: handlerName });
  });
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
    if (useSafariCss) document.body.classList.add('safari');
  });
}


module.exports = LayerUI;

