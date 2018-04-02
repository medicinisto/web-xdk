// TODO: Not updated to work with XDK yet

/* eslint-disable-next-line */
import { NetInfo } from 'react-native';
import base64JS from 'base64-js';
import Core from './index';
/* istanbul ignore next */

global.getNativeSupport = (module) => {
  switch (module) {
    case 'atob':
      return (b64Str) => {
        const byteArray = base64JS.toByteArray(b64Str);
        const strArray = [];
        for (let i = 0, l = byteArray.length; i < l; i++) {
          strArray[i] = String.fromCharCode(byteArray[i]);
        }
        return strArray.join('');
      };
    case 'btoa':
      return (str) => {
        const arr = str.split('').map(val => val.charCodeAt(0));
        return base64JS.fromByteArray(arr);
      };
    case 'setImmediate':
      // Globally defined by RN environment
      return setImmediate;
    case 'OnlineEvents':
      return NetInfo;
  }
};
module.exports = Core;
