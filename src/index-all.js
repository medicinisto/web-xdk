/**
 * @class Layer
 * @static
 */
import './utils/native-support/web';
import './core/mixins/client-dbmanager';
import { Core, Utils, Constants, init, onInit, version, packageName, Settings } from './index-core';
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
  packageName,
  get client() { return Settings.getClient(); },
  Settings,
};
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;

/**
 * Access the XDK-UI Library
 *
 * @property {Layer.UI} UI
 * @readonly
 */

/**
 * Access the XDK-Core Library
 *
 * @property {Layer.Core} Core
 * @readonly
 */

/**
 * Access the XDK Utils Library
 *
 * @property {Layer.Utils} Utils
 * @readonly
 */

/**
 * Access the XDK Constants  {@link Layer.Constants}
 *
 * @property {Layer.Constants} Constants
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
 * @param {Layer.Settings} settings
 * @returns {Layer.Core.Client}
 */

/**
 * Callback to use once {@link #init} is called and initialization of Layer.Core is completed.
 *
 * ```
 * Layer.onInit(myfunc, mycontext)
 * ```
 *
 * Note that your code typically is calling `Layer.init()`; this is only needed if you have
 * code that cannot see when you are calling `Layer.init()`.
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
 * NPM Package Name
 *
 * ```
 * Layer.packageName
 * ```
 *
 * @property {String} packageName
 * @readonly
 */

/**
 * Access the Layer Client
 *
 * @property {Layer.Core.Client} client
 * @readonly
 */
