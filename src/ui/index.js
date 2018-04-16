/*
 * This file is used to create a browserified build with the following properties:
 *
 * * Initializes webcomponent-light polyfil
 * * Hooks up all methods/properties in the layerUI namespace
 * * Initializes and registers all widgets of this library
 *
 * Note that you may create your own build that includes:
 *
 * * webcomponent polyfil
 * * Hooks up all methods/properties in the layerUI namespace
 * * Pick and choose modules from the lib folder to include
 *
 * NOTE: JSDuck is picking up on LayerUI and defining it to be a class
 * which we don't want; do not let JSDuck parse this file.
 *
 */
import 'webcomponents.js/webcomponents-lite';
import LayerUI from './index-lite';

import './handlers/text/autolinker';
import './handlers/text/emoji';
import './handlers/text/newline';
import './mixins/file-drop-target';
import './mixins/focus-on-keydown';

module.exports = LayerUI;
