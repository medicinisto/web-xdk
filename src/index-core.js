/* eslint-disable import/first */
import * as Constants from './constants';
import Core from './core/index';
import * as Utils from './utils';
import version from './version';
import Settings from './settings';

Settings.setClient(new Core.Client({}));

const onInitItems = [];

function init(options) {
  let client = Settings.getClient();
  if (!client || client.isDestroyed) {
    client = new Core.Client({});
    Settings.setClient(client);
  }
  Object.keys(options).forEach((name) => {
    Settings[name] = options[name];
    if (client[name] !== undefined) client[name] = options[name];
  });

  onInitItems.forEach(itemDef => itemDef.item.apply(itemDef.context));
  return client;
}

function onInit(item, context) {
  let found = false;
  onInitItems.forEach((itemDef) => {
    if (itemDef.item === item) found = true;
  });

  if (!found) onInitItems.push({ item, context });
}


module.exports = {
  Core,
  Utils,
  Constants,
  init,
  onInit,
  version,
  get client() { return Settings.getClient(); },
  Settings,
};
