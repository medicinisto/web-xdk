/* eslint-disable */
// This support for React Native is untested
import base64JS from 'base64-js';
import BlobLib from 'blob-polyfill';
import XHR from 'xhr2';
import WebSocket from 'websocket';
const fs = require('fs');

import { registerNativeSupport } from './index';

registerNativeSupport('atob', (b64Str) => {
  const byteArray = base64JS.toByteArray(b64Str);
  const strArray = [];
  for (let i = 0, l = byteArray.length; i < l; i++) {
    strArray[i] = String.fromCharCode(byteArray[i]);
  }
  return strArray.join('');
});

function btoa(str) {
  const arr = str.split('').map(val => val.charCodeAt(0));
  return base64JS.fromByteArray(arr);
}

registerNativeSupport('btoa', btoa);
registerNativeSupport('setImmediate', setImmediate);
registerNativeSupport('OnlineEvents', {
  addEventListener: () => {}
});
registerNativeSupport('XHR', options => new XHR(options));
registerNativeSupport('Websocket', WebSocket.w3cwebsocket);
registerNativeSupport('Blob', BlobLib.Blob); // This needs to be updated to match node-js blob
registerNativeSupport('URL', BlobLib.URL);
//registerNativeSupport('FileReader', require('filereader'));
registerNativeSupport('blobToBase64', (blob, callback) => {
  const charArray = blob.data.split('').map(char => char.charCodeAt(0));
  const uint8Array  = new Uint8Array(charArray);
  callback(btoa(String.fromCharCode.apply(null, uint8Array)));
});
registerNativeSupport('fetchTextFromFile', (blob, callback) => {
  const charArray = blob.data.split('').map(char => char.charCodeAt(0));
  const uint8Array  = new Uint8Array(charArray);
  callback(String.fromCharCode.apply(null, uint8Array));
});
registerNativeSupport('GET-PUT-BLOB-DATA', (blob) => {
  // Hack the blob-polyfill into something that is not a Blob and can be sent by the xhr2 node module
  const charArray = blob.data.split('').map(char => char.charCodeAt(0));
  return new Uint8Array(charArray);
});