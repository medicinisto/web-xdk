/**
 * Adds APIs and properties to the Layer Client for accessing/using an authenticated User
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import Core from '../namespace';

const ClientUser = {
  properties: {
    /**
     * Identity information about the authenticated user.
     *
     * @property {Layer.Core.Identity} user
     */
    user: null,

    /**
     * Indicates that this Client Instance supports/expects a User property to be populated
     *
     * @property {Boolean} [needsUserContext=false]
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
     * @property {string} [defaultOwnerDisplayName=You]
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
export default ClientUser;
Core.mixins.Client.push(ClientUser);
