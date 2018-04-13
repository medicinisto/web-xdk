import { registerNativeSupport } from './index';
import defer from '../defer';

registerNativeSupport('atob', atob.bind(window));
registerNativeSupport('btoa', btoa.bind(window));
registerNativeSupport('setImmediate', defer);

registerNativeSupport('OnlineEvents', window);
registerNativeSupport('XHR', options => new XMLHttpRequest(options));
registerNativeSupport('Blob', Blob);
