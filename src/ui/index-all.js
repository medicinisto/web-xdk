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

// Card Viewers
import './handlers/message/layer-message-viewer';
import './messages/layer-message-viewer-expanded';

// Load standard cards
import './messages/status/layer-status-message-view';
import './messages/response/layer-response-message-view';
import './messages/receipt/layer-receipt-message-view';
import './messages/choice/layer-choice-message-view';
import './messages/text/layer-text-message-view';
import './messages/image/layer-image-message-view';
import './messages/carousel/layer-carousel-message-view';
import './messages/buttons/layer-buttons-message-view';
import './messages/file/layer-file-message-view';
import './messages/link/layer-link-message-view';
import './messages/location/layer-location-message-view';
import './messages/product/layer-product-message-view';
import './messages/feedback/layer-feedback-message-view';

// Standard Card Containers
import './messages/layer-standard-message-view-container';
import './messages/layer-titled-message-view-container';
import './messages/layer-dialog-message-view-container';

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
LayerUI.UIUtils.dateSeparator = dateSeparator;

// If we don't expose global.layerUI then custom templates can not load and call window.Layer.UI.registerTemplate()
module.exports = LayerUI;
