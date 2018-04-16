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

import LayerUI from './layer-ui';

// Load Adapters
import './adapters/angular';
import './adapters/backbone';
import './adapters/react';

// Load from components folder
import './components/component';
import './components/layer-replaceable-content';
import './components/layer-notifier';
import './components/layer-conversation-view';
import './components/layer-conversation-list';
import './components/layer-identity-list';
import './components/layer-membership-list';
import './components/layer-file-upload-button';
import './components/layer-send-button';

import './handlers/text/autolinker';
import './handlers/text/emoji';
import './handlers/text/newline';
import dateSeparator from './ui-utils/date-separator';
import animatedScroll from './ui-utils/animated-scroll';

import './messages';

// Standard Card Actions
import './message-actions/open-expanded-view-action';
import './message-actions/open-url-action';
import './message-actions/open-file-action';
import './message-actions/open-map-action';

import './mixins/clickable';
import './mixins/file-drop-target';
import './mixins/message-handler';
import './mixins/has-query';
import './mixins/list';
import './mixins/list-item';
import './mixins/list-selection';
import './mixins/list-item-selection';
import './mixins/focus-on-keydown';
import './messages/message-view-mixin';
import './mixins/query-end-indicator';
import './mixins/size-property';
import './mixins/throttler';
import mixins from './mixins';

LayerUI.mixins = mixins;
LayerUI.UIUtils.animatedScrollTo = animatedScroll.animatedScrollTo;
LayerUI.UIUtils.animatedScrollLeftTo = animatedScroll.animatedScrollLeftTo;
LayerUI.UIUtils.dateSeparator = dateSeparator;

// If we don't expose global.layerUI then custom templates can not load and call window.Layer.UI.registerTemplate()
module.exports = LayerUI;
