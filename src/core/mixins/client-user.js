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
import Core from '../namespace';

module.exports = {
  properties: {
    /**
     * Identity information about the authenticated user.
     *
     * @property {Layer.Core.Identity}
     */
    user: null,

    /**
     * Indicates that this Client Instance supports/expects a User property to be populated
     *
     * @property {Boolean}
     */
    needsUserContext: true,

    /**
     * If presence is enabled, then your presence can be set/restored.
     *
     * @property {Boolean} [isPresenceEnabled=true]
     */
    isPresenceEnabled: true,

    /**
     * If a display name is not loaded for the session owner, use this name.
     *
     * @property {string}
     */
    defaultOwnerDisplayName: 'You',

    /**
     * Short hand for getting the userId of the authenticated user.
     *
     * Could also just use client.user.userId
     *
     * @property {string} userId
     */
    userId: '',
  },
  methods: {
    __getUserId() {
      return this.user ? this.user.userId : '';
    },
  },
};

Core.mixins.Client.push(module.exports);
