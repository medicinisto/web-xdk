/**
 * @class Layer
 * @static
 */
import './utils/native-support/web';
import './core/mixins/client-dbmanager';
import { Core, Utils, Constants, init, onInit, version, client, Settings } from './index-core';
import './core/db-manager';
import './core/models/message-type-response-summary/message-type-response-summary-v1';
import UI from './ui/index-all';

onInit(UI.init, UI);

module.exports = {
  UI,
  Core,
  Utils,
  Constants,
  init,
  onInit,
  version: version + '-all',
  client,
  Settings,
};
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;

/**
 * Access the XDK-UI Library
 *
 * @property {Object} UI
 * @readonly
 */

/**
 * Access the XDK-Core Library
 *
 * @property {Object} Core
 * @readonly
 */

/**
 * Access the XDK Utils Library
 *
 * @property {Object} Utils
 * @readonly
 */

/**
 * Access the XDK Constants  {@link Layer.Constants}
 *
 * @property {Object} Constants
 * @readonly
 */

/**
 * Initialize the XDK and Layer Client
 *
 * ```
 * Layer.init({
 *   appId: "layer:///apps/staging/UUID"
 * });
 * ```
 *
 * @method init
 * @returns Layer.Core.Client
 */

/**
 * Callback to use once {@link #init} is called and initialization of Layer.Core is completed.
 *
 * ```
 * Layer.onInit(myfunc, mycontext)
 * ```
 *
 * It is recommended that anonymous functions not be used as `onInit` insures that if a function is passed multiple times,
 * it will only get called once.  This pattern generates a new function each call and should not be used:
 *
 * ```
 * Layer.onInit(() => myfunc());
 * ```
 *
 * @method onInit
 * @param {Function} callback
 * @param {Object} context
 */

/**
 * XDK Version
 *
 * ```
 * Layer.version
 * ```
 *
 * @property {String} version
 * @readonly
 */

/**
 * Access the Layer Client
 *
 * @property {Layer.Core.Client} client
 * @readonly
 */
