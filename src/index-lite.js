/**
 * @class Layer
 */

/* eslint-disable import/first */
import './utils/native-support/web';
import { Core, Utils, Constants, init, onInit, version, packageName, Settings } from './index-core';
import UI from './ui/index-lite';

onInit(UI.init, UI);

module.exports = {
  UI,
  Core,
  Utils,
  Constants,
  init,
  onInit,
  version: version + '-lite',
  packageName,
  get client() { return Settings.getClient(); },
  Settings,
};
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;
