import { registerNativeSupport } from './index';
import defer from '../defer';

registerNativeSupport('atob', atob.bind(window));
registerNativeSupport('btoa', btoa.bind(window));
registerNativeSupport('setImmediate', defer);

registerNativeSupport('OnlineEvents', window);
registerNativeSupport('XHR', options => new XMLHttpRequest(options));
registerNativeSupport('Websocket', WebSocket);
registerNativeSupport('Blob', Blob);
registerNativeSupport('URL', URL);
//registerNativeSupport('FileReader', FileReader);
registerNativeSupport('blobToBase64', (blob, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.addEventListener('loadend', () => callback(reader.result.replace(/^.*?,/, '')));
});
registerNativeSupport('fetchTextFromFile', (blob, callback) => {
  const reader = new FileReader();
  reader.addEventListener('loadend', () => {
    callback(reader.result);
  });
  reader.readAsText(blob);
});
registerNativeSupport('GET-PUT-BLOB-DATA', blob => blob);