/*
 * This file is used to create a browserified build similar to index.js,
 * but removing the following:
 *
 * * webcomponent-light polyfil
 * * autolinker
 * * emoji handler
 * * FileDropTarget Mixin
 * * FocusOnKeystroke Mixin
 *
 * Any of these you need may be loaded directly by your app into your build.
 *
 * Usage:
 *
 * ```
 * import Layer from '@layerhq/web-xdk/index-core';
 * import LayerUI from '@layerhq/web-xdk/ui/index-lite';
 * ```
 */

// import 'webcomponents.js/webcomponents-lite';

import LayerUI from './layer-ui';

// Load Required Components
import './components/component';
import './components/layer-replaceable-content';
import './components/layer-conversation-view';


// import './handlers/text/autolinker';
// import './handlers/text/emoji';
import './handlers/text/newline';
import dateSeparator from './ui-utils/date-separator';

// Card Viewers
import './handlers/message/layer-message-viewer';
import './messages/layer-message-viewer-expanded';

// Load standard cards
import './messages/status/layer-status-message-view';
import './messages/response/layer-response-message-view';
import './messages/text/layer-text-message-view';
import './messages/link/layer-link-message-view';
import './messages/image/layer-image-message-view';
import './messages/buttons/layer-buttons-message-view';

// Load standard card containers
import './messages/layer-standard-message-view-container';
import './messages/layer-titled-message-view-container';
import './messages/layer-dialog-message-view-container';

// Load standard card actions
import './message-actions/open-expanded-view-action';
import './message-actions/open-url-action';
import './message-actions/open-file-action';
import './message-actions/open-map-action';

import './mixins/clickable';
// import './mixins/file-drop-target';
import MessageHandler from './mixins/message-handler';
import './mixins/has-query';
import './mixins/list';
import './mixins/list-item';
import './mixins/list-selection';
import './mixins/list-item-selection';
// import './mixins/focus-on-keydown';
import './messages/message-view-mixin';
import './mixins/query-end-indicator';
import './mixins/size-property';
import './mixins/throttler';
import mixins from './mixins';

LayerUI.mixins = mixins;

LayerUI.UIUtils.dateSeparator = dateSeparator;
LayerUI.mixins.MessageHandler = MessageHandler;

// If we don't expose global.layerUI then custom templates can not load and call window.Layer.UI.registerTemplate()
module.exports = LayerUI;
