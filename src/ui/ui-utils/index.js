/**
 * @class Layer.UI.UIUtils
 * @static
 */
import StatusManager from './status-message-manager';
import ListSeparatorManager from './list-separator-manager';
import RCUtils from './replaceable-content-utils';

/**
 * Utility returns whether or not the window is in the background.
 *
 * @method isInBackground
 * @returns {Boolean}
 */
module.exports.isInBackground = () => !document.hasFocus() || document.hidden;

/**
 * Placeholder for a mechanism for all Message Types to share for showing a zoomed in version of their content.
 *
 * Eventually should open an in-app dialog
 *
 * @method showFullScreen
 * @param {String} url
 */
module.exports.showFullScreen = (url) => {
  if (url && url.length > 7) {
    window.open(url);
  }
};

/**
 * Calculates a scaled size given a set of dimensions and the maximum allowed width/height.
 *
 * @method normalizeSize
 * @param {Object} dimensions    `width` and `height` of the actual image/video/object
 * @param {Object} maxSizes      `width` and `height` of the maximum allowed dimensions
 * @returns {Object}             `width` and `height` that is proportional to dimensions and within maxSizes
 */
module.exports.normalizeSize = (dimensions, maxSizes) => {

  if (!dimensions) return maxSizes;

  const size = {
    width: dimensions.previewWidth || dimensions.width,
    height: dimensions.previewHeight || dimensions.height,
  };

  // Scale dimensions down to our maximum sizes if needed
  if (size.width > maxSizes.width) {
    const width = size.width;
    size.width = maxSizes.width;
    size.height = size.height * maxSizes.width / width;
  }
  if (size.height > maxSizes.height) {
    const height = size.height;
    size.height = maxSizes.height;
    size.width = size.width * maxSizes.height / height;
  }

  // Return scaled sizes
  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
  };
};

/**
 * Return a human readable file size with B, K, M, G, etc... appended to it
 *
 * Thanks to https://stackoverflow.com/a/20732091/2094063
 *
 * @method humanFileSize
 * @param {Number} size
 * @returns {String}
 */
module.exports.humanFileSize = (size) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const base = Math.round(size / 1024 ** i);
  if (i > 4) {
    return base + new Array(i - 3).join(',000') + 'T';
  } else {
    return base + ['B', 'K', 'M', 'G', 'T'][i];
  }
};


module.exports.ReplaceableSnippets = RCUtils;
Object.keys(StatusManager).forEach(keyName => (module.exports[keyName] = StatusManager[keyName]));
Object.keys(ListSeparatorManager).forEach(keyName => (module.exports[keyName] = ListSeparatorManager[keyName]));
