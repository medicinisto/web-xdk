/**
 * Simple action handler for the `open-file` action.  It accepts either a `url` or `source_url` from
 * the data provided by either a Message Model's `actionData` (if event is triggered by selecting the Message)
 * or by an Action Button's `data` property (if the event is triggered by selecting the button).
 * Failing to find either of those, it will look at the Message Model's `getSourceUrl` method
 * or the selected model, and calls the MessageViewer `showFullScreen` method
 *
 * @class Layer.UI.MessageActions.OpenFileAction
 */

import { register } from './index';
import { showFullScreen } from '../ui-utils';
import { logger } from '../../utils';

const openFileHandler = ({ data, model }) => {
  if (data.url || data.source_url) {
    showFullScreen(data.url || data.source_url);

  } else if (model.getSourceUrl) {
    try {
      model.getSourceUrl(url => showFullScreen(url));
    } catch (e) {
      if (model.source && model.source.body) {
        download(model.name || model.title, model.source.body, model.source.mimeType);
      }
    }
  } else {
    logger.error('OPEN-FILE-ACTION: No getSourceUrl method for the "open-file" Message Action for model ', model);
  }
};

// Copied from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
// which also reports that this won't work on iOS browsers without the user directly clicking on the element rather than calling click() below.
// Technique also has stricter size limits unlike downloading from a remote url. So this is *only* for use
// when a File Message doesn't need external content due to small file sizes
function download(filename, body, mimeType) {
  if (body) {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(body));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

register('open-file', openFileHandler);
