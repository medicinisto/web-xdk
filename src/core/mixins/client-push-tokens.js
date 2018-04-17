/**
 * Adds handling of custom websocket operations.
 *
 * This is handled by a Client mixin rather than:
 *
 * * The Client itself so we can keep the client simple and clean
 * * The Websocket Change Manager so that the change manager does not need to know
 *   how to handle any operation on any data.  Its primarily aimed at insuring websocket
 *   events get processed, not knowing minute details of the objects.
 *
 * @class Layer.Core.mixins.WebsocketOperations
 */

import Util from '../../utils';
import { RECEIPT_STATE } from '../../constants';
import Core from '../namespace';

module.exports = {
  methods: {


    /**
     * Register your IOS device to receive notifications.
     * For use with native code only (Cordova, React Native, Titanium, etc...)
     *
     * @method registerIOSPushToken
     * @param {Object} options
     * @param {string} options.deviceId - Your IOS device's device ID
     * @param {string} options.iosVersion - Your IOS device's version number
     * @param {string} options.token - Your Apple APNS Token
     * @param {string} [options.bundleId] - Your Apple APNS Bundle ID ("com.layer.bundleid")
     * @param {Function} [callback=null] - Optional callback
     * @param {Layer.Core.LayerEvent} callback.error - LayerError if there was an error; null if successful
     */
    registerIOSPushToken(options, callback) {
      this.xhr({
        url: 'push_tokens',
        method: 'POST',
        sync: false,
        data: {
          token: options.token,
          type: 'apns',
          device_id: options.deviceId,
          ios_version: options.iosVersion,
          apns_bundle_id: options.bundleId,
        },
      }, result => callback(result.data));
    },

    /**
     * Register your Android device to receive notifications.
     * For use with native code only (Cordova, React Native, Titanium, etc...)
     *
     * @method registerAndroidPushToken
     * @param {Object} options
     * @param {string} options.deviceId - Your IOS device's device ID
     * @param {string} options.token - Your GCM push Token
     * @param {string} options.senderId - Your GCM Sender ID/Project Number
     * @param {Function} [callback=null] - Optional callback
     * @param {Layer.Core.LayerEvent} callback.error - LayerError if there was an error; null if successful
     */
    registerAndroidPushToken(options, callback) {
      this.xhr({
        url: 'push_tokens',
        method: 'POST',
        sync: false,
        data: {
          token: options.token,
          type: 'gcm',
          device_id: options.deviceId,
          gcm_sender_id: options.senderId,
        },
      }, result => callback(result.data));
    },

    /**
     * Register your Android device to receive notifications.
     * For use with native code only (Cordova, React Native, Titanium, etc...)
     *
     * @method unregisterPushToken
     * @param {string} deviceId - Your IOS device's device ID
     * @param {Function} [callback=null] - Optional callback
     * @param {Layer.Core.LayerEvent} callback.error - LayerError if there was an error; null if successful
     */
    unregisterPushToken(deviceId, callback) {
      this.xhr({
        url: 'push_tokens/' + deviceId,
        method: 'DELETE',
      }, result => callback(result.data));
    },
  },
};

Core.mixins.Client.push(module.exports);
