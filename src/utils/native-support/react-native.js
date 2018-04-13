/* eslint-disable */
// This support for React Native is untested
import { NetInfo } from 'react-native';
import base64JS from 'base64-js';
import { registerNativeSupport } from './index';

registerNativeSupport('atob', (b64Str) => {
  const byteArray = base64JS.toByteArray(b64Str);
  const strArray = [];
  for (let i = 0, l = byteArray.length; i < l; i++) {
    strArray[i] = String.fromCharCode(byteArray[i]);
  }
  return strArray.join('');
});

registerNativeSupport('btoa', (str) => {
  const arr = str.split('').map(val => val.charCodeAt(0));
  return base64JS.fromByteArray(arr);
});

registerNativeSupport('setImmediate', setImmediate);
registerNativeSupport('OnlineEvents', () => {
  const originalAddEventListener = NetInfo.addEventListener;
  NetInfo.addEventListener = (eventName, callback) => originalAddEventListener('change', callback);
});

registerNativeSupport('XHR', options => new XMLHttpRequest(options));
registerNativeSupport('Blob', Blob); // This needs to be updated to match node-js blob