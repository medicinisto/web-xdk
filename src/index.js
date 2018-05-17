/**
 * @class Layer
 */

/* eslint-disable import/first */
import { Core, Utils, Constants, init, onInit, version, client, Settings } from './index-core';
import UI from './ui';

onInit(UI.init, UI);

module.exports = { UI, Core, Utils, Constants, init, onInit, version, client, Settings };
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;
