/* eslint-disable import/first */
import { SYNC_STATE, RECIPIENT_STATE, RECEIPT_STATE, LOCALSTORAGE_KEYS, ACCEPT, WEBSOCKET_PROTOCOL, LOG, DELETION_MODE, STANDARD_MIME_TYPES, CRDT_TYPES } from './constants';
import Core from './core/index';
import Utils from './utils';
import version from './version';
import Settings from './settings';

Settings.setClient(new Core.Client({}));

const Constants = { SYNC_STATE, RECIPIENT_STATE, RECEIPT_STATE, LOCALSTORAGE_KEYS, ACCEPT, WEBSOCKET_PROTOCOL, LOG, DELETION_MODE, STANDARD_MIME_TYPES, CRDT_TYPES };

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
