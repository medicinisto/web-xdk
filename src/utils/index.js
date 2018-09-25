/**
 * Utility methods
 *
 * @class Layer.Utils
 */
/* eslint-disable no-restricted-properties */

// Note: `export { default as layerParse } from './layer-parser'` generates a property setter via babel and jasmine spys cannot hook into them.
import UUID from 'uuid';
import layerParse from './layer-parser';
import logger from './logger';
import xhr from './xhr';
import { getNativeSupport, registerNativeSupport } from '../utils/native-support';

export { layerParse, logger, xhr, getNativeSupport, registerNativeSupport };

const Blob = getNativeSupport('Blob');

export const atob = getNativeSupport('atob');
export const btoa = getNativeSupport('btoa');
export const defer = getNativeSupport('setImmediate');

/**
 * Generate a random UUID
 *
 * @method generateUUID
 * @return {string}
 */
export const generateUUID = UUID.v4;

/**
 * Generate a random UUID as a Uint8Array array
 *
 * @method generateUUIDBytes
 * @return {Uint8Array[]}
 */
export const generateUUIDBytes = () => {
  const b = new Uint8Array(16);
  UUID.v4(null, b);
  return btoa(String.fromCharCode.apply(null, b));
};

/**
 * Returns the 'type' portion of a Layer ID.
 *
 *         switch(Utils.typeFromID(id)) {
 *             case 'conversations':
 *                 ...
 *             case 'message':
 *                 ...
 *             case: 'queries':
 *                 ...
 *         }
 *
 * Does not currently handle Layer App IDs.
 *
 * @method typeFromID
 * @param  {string} id
 * @return {string}
 */
export const typeFromID = (id) => {
  const matches = id.match(/([^/]*)(\/[^/]*)$/);
  return matches ? matches[1] : '';
};

/**
 * Returns the UUID portion of a Layer ID
 *
 * @method uuid
 * @param  {string} id
 * @return {string}
 */
export const uuid = id => (id || '').replace(/^.*\//, '');

export function isEmpty(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]' && Object.keys(obj).length === 0;
}


export const camelCase = str =>
  str.replace(/[-_](.)/g, (match, value) => value.toUpperCase());

/**
 * Turn a camel case name into a hyphenated name
 *
 * To camel case, use:
 *
 * ```
 * Utils.hyphenate("aCamelCalsedString", "_");
 * ```
 *
 * @method hyphenate
 * @param {String} aCamelCasedString
 * @returns {String} a-hyphenated-string
 */
const regexHyphenate = /([a-z])([A-Z])/g;
export const hyphenate = (str, separator = '-') =>
  str.replace(regexHyphenate, (match, part1, part2) =>
    part1 + separator + part2.toLowerCase());

/**
 * Simplified sort method.
 *
 * Provides a function to return the value to compare rather than do the comparison.
 *
 *      sortBy([{v: 3}, {v: 1}, v: 33}], function(value) {
 *          return value.v;
 *      }, false);
 *
 * @method sortBy
 * @param  {Mixed[]}   inArray      Array to sort
 * @param  {Function} fn            Function that will return a value to compare
 * @param  {Function} fn.value      Current value from inArray we are comparing, and from which a value should be extracted
 * @param  {boolean}  [reverse=false] Sort ascending (false) or descending (true)
 */
export const sortBy = (inArray, fn, reverse) => {
  reverse = reverse ? -1 : 1;
  return inArray.sort((valueA, valueB) => {
    const aa = fn(valueA);
    const bb = fn(valueB);
    if (aa === undefined && bb === undefined) return 0;
    if (aa === undefined && bb !== undefined) return 1;
    if (aa !== undefined && bb === undefined) return -1;
    if (aa > bb) return 1 * reverse;
    if (aa < bb) return -1 * reverse;
    return 0;
  });
};

/**
 * Quick and easy clone method.
 *
 * Does not work on circular references; should not be used
 * on objects with event listeners.
 *
 *      var newObj = Utils.clone(oldObj);
 *
 * @method clone
 * @param  {Object}     Object to clone
 * @return {Object}     New Object
 */
export const clone = obj => JSON.parse(JSON.stringify(obj));

/**
 * Shallow Clone doesn't lose subpointers; for use on raw objects, not class instances.
 *
 *      var newObj = Utils.shallowClone(oldObj);
 *
 * @method shallowClone
 * @param  {Object}     Object to clone
 * @return {Object}     New Object
 */
export const shallowClone = (obj) => {
  const result = {};
  Object.keys(obj).forEach(keyName => (result[keyName] = obj[keyName]));
  return result;
};

/**
 * Its necessary that the encoding algorithm for creating a URI matches the Layer Server's algorithm.
 * Failure to do that creates mismatching IDs that will then refer to different objects.
 *
 * Derived from https://github.com/kevva/strict-uri-encode
 *
 * @method strictEncodeURI
 * @param {String} str
 */
export const strictEncodeURI =
  str => encodeURIComponent(str).replace(/[!~'()]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * URL Decode a URL Encoded base64 string
 *
 * Copied from https://github.com/auth0-blog/angular-token-auth, but
 * appears in many places on the web.
 *
 * @method decode
 * @param {String} str   base64 string
 * @return {String}   Decoded string
 */
/* istanbul ignore next */
export const decode = (str) => {
  const reg1 = new RegExp('_', 'g');
  const reg2 = new RegExp('-', 'g');
  let output = str.replace(reg2, '+').replace(reg1, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw new Error('Illegal base64url string!');
  }
  return atob(output);
};


/**
 * Returns a delay in seconds needed to follow an exponential
 * backoff pattern of delays for retrying a connection.
 *
 * Algorithm has two motivations:
 *
 * 1. Retry with increasingly long intervals up to some maximum interval
 * 2. Randomize the retry interval enough so that a thousand clients
 * all following the same algorithm at the same time will not hit the
 * server at the exact same times.
 *
 * The following are results before jitter for some values of counter:

      0: 0.1
      1: 0.2
      2: 0.4
      3: 0.8
      4: 1.6
      5: 3.2
      6: 6.4
      7: 12.8
      8: 25.6
      9: 51.2
      10: 102.4
      11. 204.8
      12. 409.6 (~7 minutes)
      13. 819.2 (~14 minutes)
      14. 1638.4 (27 minutes)

 * @method getExponentialBackoffSeconds
 * @param  {number} maxSeconds - This is not the maximum seconds delay, but rather
 * the maximum seconds delay BEFORE adding a randomized value.
 * @param  {number} counter - Current counter to use for calculating the delay; should be incremented up to some reasonable maximum value for each use.
 * @return {number}     Delay in seconds/fractions of a second
 */
export const getExponentialBackoffSeconds = function getExponentialBackoffSeconds(maxSeconds, counter) {
  let secondsWaitTime = (Math.pow(2, counter)) / 10;
  let secondsOffset = Math.random(); // value between 0-1 seconds.

  if (secondsWaitTime >= maxSeconds) secondsWaitTime = maxSeconds;

  if (counter < 2) secondsOffset = secondsOffset / 4; // values less than 0.2 should be offset by 0-0.25 seconds
  else if (counter < 6) secondsOffset = secondsOffset / 2; // values between 0.2 and 1.0 should be offset by 0-0.5 seconds
  else secondsOffset = secondsWaitTime * 0.5 * secondsOffset; // Random increment between 0-50% of existing delay

  return secondsWaitTime + secondsOffset;
};

/**
 * Is this data a blob?
 *
 * @method isBlob
 * @param {Mixed} value
 * @returns {Boolean} - True if its a blob, false if not.
 */
export const isBlob = value => typeof Blob !== 'undefined' && value instanceof Blob;

/**
 * Given a blob return a base64 string.
 *
 * @method blobToBase64
 * @param {Blob} blob - data to convert to base64
 * @param {Function} callback
 * @param {String} callback.result - Your base64 string result
 */
export const blobToBase64 = (blob, callback) => {
  if (blob instanceof Blob) {
    getNativeSupport('blobToBase64')(blob, callback);
  } else {
    callback('');
  }
};


/**
 * Given a base64 string return a blob.
 *
 * @method base64ToBlob
 * @param {String} b64Data - base64 string data without any type prefixes
 * @param {String} contentType - mime type of the data
 * @returns {Blob}
 */
export const base64ToBlob = (b64Data, contentType) => {
  try {
    const sliceSize = 512;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    let offset;

    for (offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let i;
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  } catch (e) {
    // noop
  }
  return null;
};

/**
 * Does window.btao() in a unicode-safe way
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/btoa#Unicode_strings
 *
 * @method utoa
 * @param {String} str
 * @return {String}
 */
export const utoa = str => btoa(unescape(encodeURIComponent(str)));

/**
 * Does window.atob() in a way that can decode data from utoa()
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/btoa#Unicode_strings
 *
 * @method atou
 * @param {String} str
 * @return {String}
 */
export const atou = str => decodeURIComponent(escape(atob(str)));


/**
 * Given a File/Blob return a string.
 *
 * Assumes blob represents textual data.
 *
 * @method fetchTextFromFile
 * @param {Blob} file
 * @param {Function} callback
 * @param {String} callback.result
 */
export const fetchTextFromFile = (file, callback) => {
  if (typeof file === 'string') return callback(file);
  getNativeSupport('fetchTextFromFile')(file, callback);
};


/**
 * Returns a random string of the specified size. For shorter identifiers than a UUID.
 *
 * @param {Number} size
 * @returns {String}
 */
export const randomString = (size) => {
  const byteBuffer = new Uint8Array(size);
  while (size--) byteBuffer[size] = (Math.random() * 91) + 35;
  return String.fromCharCode.apply(null, byteBuffer);
};

/**
 * Object comparison.
 *
 * Does a recursive traversal of two objects verifying that they are the same.
 * Is able to make metadata-restricted assumptions such as that
 * all values are either plain Objects or strings.
 *
 *      if (Utils.doesObjectMatch(conv1.metadata, conv2.metadata)) {
 *          alert('These two metadata objects are the same');
 *      }
 *
 * @method doesObjectMatch
 * @param  {Object} requestedData
 * @param  {Object} actualData
 * @return {boolean}
 */
export const doesObjectMatch = (requestedData, actualData) => {
  if ((!requestedData && actualData) || (requestedData && !actualData)) return false;
  const requestedKeys = Object.keys(requestedData).sort();
  const actualKeys = Object.keys(actualData).sort();

  // If there are a different number of keys, fail.
  if (requestedKeys.length !== actualKeys.length) return false;

  // Compare key name and value at each index
  for (let index = 0; index < requestedKeys.length; index++) {
    const k1 = requestedKeys[index];
    const k2 = actualKeys[index];
    const v1 = requestedData[k1];
    const v2 = actualData[k2];
    if (k1 !== k2) return false;
    if (v1 && typeof v1 === 'object') {
      // Array comparison is not used by the Web XDK at this time.
      if (Array.isArray(v1)) {
        throw new Error('Array comparison not handled yet');
      } else if (!doesObjectMatch(v1, v2)) {
        return false;
      }
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
};

export const isMobile = global.navigator ? Boolean(global.navigator.userAgent.match(/(mobile|android|phone)/i)) : false;
export const isIOS = global.navigator ? Boolean(global.navigator.userAgent.match(/(iPhone|iPad)/i)) : false;
export const isSafari = global.navigator ?
  Boolean(global.navigator.userAgent.match(/(safari)/i)) &&
  global.navigator.vendor.match(/apple/i) : false;
export const isIE11 = !!global.MSInputMethodContext && !!document.documentMode;

let hasLocalStorageTmp = false;
try {
  hasLocalStorageTmp = typeof Storage !== 'undefined' && global.localStorage instanceof Storage;
} catch (e) {
  // No-op
}
export const hasLocalStorage = hasLocalStorageTmp;

/**
 * Simple array inclusion test
 * @method includes
 * @param {Mixed[]} items
 * @param {Mixed} value
 * @returns {boolean}
 */
export const includes = (items, value) => items.indexOf(value) !== -1;

/**
 * Some ASCII art when client initializes
 * @property {String} asciiInit
 * @ignore
 */
export const asciiInit = (version) => {
  if (!version) return 'Missing version';

  const split = version.split('-');
  let line1 = split[0] || '';
  let line2 = split[1] || '';

  line1 += new Array(13 - line1.length).join(' ');
  line2 += new Array(14 - line2.length).join(' ');

  return `
    /hNMMMMMMMMMMMMMMMMMMMms.
  hMMy+/////////////////omMN-
  MMN                    oMMo
  MMN        Layer       oMMo
  MMN       Web XDK      oMMo
  MMM-                   oMMo
  MMMy      v${line1}oMMo
  MMMMo     ${line2}oMMo
  MMMMMy.                oMMo
  MMMMMMNy:'             oMMo
  NMMMMMMMMmy+:-.'      'yMM/
  :dMMMMMMMMMMMMNNNNNNNNNMNs
   -/+++++++++++++++++++:'`;
};

/**
 * Get a dump of the logs for sending to your logging service.
 *
 * @method getLogs
 * @returns {Object[]} Array of log lines
 * @return {Number} return.logLevel  One of Layer.Constants.LOG.INFO / DEBUG / WARN / ERROR
 * @return {String} return.timestamp  ISO String Timestamp for when the log was written
 * @return {String} return.timezone   Timezone; note that the value used for this is calculated once, and not updated if the user is traveling with the app running.
 * @return {String} return.shortText  Text of the log that was written
 * @return {String} return.text       Textual summary of the log (but leaves out details from the Object)
 * @return {Object} return.object     Contains additional details that may be relevant to your logging; do not try and serialize these as they will infinite loop.
 * @return {String} return.type       Object type that generated the log
 */
export const getLogs = logger.getLogs;
