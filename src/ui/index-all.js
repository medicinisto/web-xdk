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
import LayerUI from './index';

// Load Adapters
import './adapters/angular';
import './adapters/backbone';
import './adapters/react';

// Load from components folder
import './components/layer-notifier';
import './components/layer-conversation-list';
import './components/layer-identity-list';
import './components/layer-membership-list';
import './components/layer-file-upload-button';
import './components/layer-send-button';

// Load standard cards
import './messages/index';

export default LayerUI;
