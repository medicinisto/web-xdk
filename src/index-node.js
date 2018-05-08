/* eslint-disable import/first */
import './utils/native-support/node';
import { Core, Utils, Constants, init, onInit, version, client, Settings } from './index-core';
import './ui/messages/index-models';

module.exports = {
  Core,
  Utils,
  Constants,
  init,
  onInit,
  version: version + '-node',
  client,
  Settings,
};
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;
