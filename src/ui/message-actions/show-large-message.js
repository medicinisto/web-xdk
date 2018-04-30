/**
 * Simple action handler for the `layer-show-large-message` action.  Opens a dialog showing the model that the action is performed against
 *
 * @class Layer.UI.MessageActions.ShowLargeMessage
 */

import { register } from './index';
import { logger } from '../../utils';
import '../components/layer-dialog';

const showLargeView = ({ messageViewer, model, data }) => {
  const dialog = document.createElement('layer-dialog');
  dialog.isCloseButtonShowing = true;

  const largeMessageViewer = document.createElement('layer-message-viewer');
  largeMessageViewer.size = 'large';
  largeMessageViewer.model = model;
  largeMessageViewer.openActionData = data;
  largeMessageViewer.parentComponent = dialog;
  largeMessageViewer._onAfterCreate();

  dialog.replaceableContent = {
    content: largeMessageViewer,
  };

  let node = messageViewer;
  while (node && node.tagName !== 'BODY' && node.tagName !== 'LAYER-CONVERSATION-VIEW' && node.parentNode) {
    node = node.parentNode;
  }

  if (node.tagName === 'LAYER-CONVERSATION-VIEW') {
    dialog.parentComponent = node;
  }
  if (node.tagName === 'BODY' || node.tagName === 'LAYER-CONVERSATION-VIEW') {
    node.appendChild(dialog);
  } else {
    logger.error('Unable to find a layer-conversation-view or body containing', messageViewer);
  }
};

register('layer-show-large-message', showLargeView);
