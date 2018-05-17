/* eslint-disable import/first */
import Constants from './constants';
import Core from './core';
import Utils from './utils';
import version from './version';
import Settings from './settings';

Settings.client = new Core.Client({});

const onInitItems = [];

function init(options) {
  let client = Settings.client;
  if (!client || client.isDestroyed) client = Settings.client = new Core.Client({});
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


module.exports = { Core, Utils, Constants, init, onInit, version, get client() { return Settings.client; }, Settings };
