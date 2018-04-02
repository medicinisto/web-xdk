/**
 * @class Layer
 */

/* eslint-disable import/first */
if (global.Layer) throw new Error('You appear to have multiple copies of the Layer Web XDK loaded at the same time');

import Constants from './constants';
import Core from './core';
import Utils from './utils';
import UI from './ui/index-lite';
import version from './version';
import Settings from './settings';

Settings.client = new Core.Client({});
function init(options) {
  let client = Settings.client;
  if (!client || client.isDestroyed) client = Settings.client = new Core.Client({});
  Object.keys(options).forEach((name) => {
    Settings[name] = options[name];
    if (client[name] !== undefined) client[name] = options[name];
  });

  UI.init();
  return client;
}

module.exports = { UI, Core, Utils, Constants, init, version, get client() { return Settings.client; }, Settings };
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;

