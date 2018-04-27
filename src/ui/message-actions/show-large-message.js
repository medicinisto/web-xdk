/**
 * Simple action handler for the `layer-show-large-message` action.  Opens a dialog showing the model that the action is performed against
 *
 * @class Layer.UI.MessageActions.ShowLargeMessage
 */

import { register } from './index';
import { logger } from '../../utils';

const showLargeView = ({ messageViewer, model, data }) => {
  const dialog = document.createElement('layer-large-message-viewer');
  dialog.model = model;
  dialog.openActionData = data;
  let node = messageViewer;
  while (node && node.tagName !== 'BODY' && node.tagName !== 'LAYER-CONVERSATION-VIEW') {
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
