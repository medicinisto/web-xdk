/* eslint-disable import/first */
if (global.Layer) throw new Error('You appear to have multiple copies of the Layer Web XDK loaded at the same time');

import Constants from './constants';
import Core from './core/index-react-native';
import Utils from './utils';
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

  return client;
}

module.exports = { Core, Utils, Constants, init, version, get client() { return Settings.client; }, Settings };
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;
