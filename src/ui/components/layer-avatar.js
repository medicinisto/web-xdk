/**
 * The Layer Avatar widget renders an icon representing a user or users.
 *
 * This widget appears within
 *
 * * Layer.UI.components.MessageListPanel.Item: Represents the sender of a Message
 * * Layer.UI.components.ConversationListPanel.Item.Conversation: Represents the participants of a Conversation
 * * Layer.UI.components.IdentityListPanel.Item: Represents a user in a User List
 *
 * Rendering is done using data from the `Layer.Core.Identity` object for each user, using the Layer.Core.Identity.avatarUrl if available to
 * add an image, or first initials from Layer.Core.Identity.firstName, Layer.Core.Identity.lastName if no avatarUrl is available.
 * Layer.Core.Identity.displayName is used as a fallback.
 *
 * The simplest way to customize this widget is to replace it with your own implementation of the `<layer-avatar />` tag.
 *
 * ```javascript
 * Layer.UI.registerComponent('layer-avatar', {
 *    properties: {
 *      users: {
 *        set: function(value) {
 *           this.render();
 *        }
 *      }
 *    },
 *    methods: {
 *      render: function() {
 *        this.innerHTML = 'All Hail ' + this.properties.users[0].displayName;
 *      }
 *    }
 * });
 *
 * // Call init after custom components are defined
 * Layer.UI.init({
 *   appId:  'layer:///apps/staging/UUID'
 * });
 * ```
 *
 * Note that the main parameter is a `users` array, not a single user:
 *
 * * When used in a Messages List or Identities List, there will be only one user in the list
 * * When used in a Conversations List, there may be multiple users who are participants of the Conversation.
 *
 * ### Importing
 *
 * Included in the default build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-avatar';
 * ```
 *
 * @class Layer.UI.components.Avatar
 * @extends Layer.UI.Component
 * @mixins Layer.UI.mixins.SizeProperty
 */
import { client as Client } from '../../settings';
import Core from '../../core';

import { registerComponent } from './component';
import './layer-presence';
import SizeProperty from '../mixins/size-property';

registerComponent('layer-avatar', {
  mixins: [SizeProperty],
  style: `
    layer-avatar {
      display: block;
    }
    layer-avatar layer-presence {
      position: absolute;
      bottom: 0px;
      right: 0px;
    }
  `,
  properties: {

    /**
     * User to represent with this Avatar.
     *
     * Short cut to {@link #users} for when there is only a single user.
     *
     * @property {Layer.Core.Identity} [item=null]
     */
    item: {
      set(value) {
        if (value instanceof Core.Message) {
          this.users = [value.sender];
        } else if (value instanceof Core.Conversation) {
          // If conversation is being loaded via `getConversation()` then wait for the participant list
          // to load before setting it
          if (!value.isLoading) {
            this.users = value.participants;
          }
        } else {
          this.users = [];
        }
      },
    },

    /**
     * Array of users to be represented by this Avatar.
     *
     * Typically this only has one user represented with a Layer.Core.Identity.
     *
     * Can use {@link #item} to set this instead.
     *
     * @property {Layer.Core.Identity[]} [users=[]}
     */
    users: {
      value: [],
      set(newValue, oldValue) {
        if (Array.isArray(newValue)) {
          newValue = newValue.map(user => (user instanceof Core.Identity ? user : Client.getIdentity(user.id)));
          this.properties.users = newValue;
        }

        // If nothing changed other than the array pointer, do nothing
        if (oldValue && newValue && newValue.length === oldValue.length) {
          const matches = newValue.filter(identity => oldValue.indexOf(identity) !== -1);
          if (matches !== newValue.length) return;
        }

        if (!newValue) newValue = [];
        if (!Array.isArray(newValue)) newValue = [newValue];
        newValue = newValue.map((identity) => {
          if (identity instanceof Core.Identity) {
            return identity;
          } else {
            return Client.getIdentity(identity.id);
          }
        });
        this.properties.users = newValue;


        // classList.toggle doesn't work right in IE 11
        this.toggleClass('layer-has-user', newValue.length);
        this.onRender();
      },
    },

    /**
     * Set whether to show or hide the Presence of the user when rendering this Avatar.
     *
     * @property {Boolean} [showPresence=true]
     */
    showPresence: {
      value: true,
      type: Boolean,
    },

    size: {
      value: 'medium',
      set(value) {
        if (this.nodes.presence) this.nodes.presence.size = value === 'larger' ? 'large' : value;
      },
    },
    supportedSizes: {
      value: ['small', 'medium', 'large', 'larger'],
    },
  },
  methods: {

    /**
     * Render the users represented by this widget.
     *
     * @method
     * @private
     */
    onRender() {
      const users = this.users.length === 1 ? this.users : this.users.filter(user => !user.isMine);
      // Clear the innerHTML if we have rendered something before
      if (this.users.length) {
        this.innerHTML = '';
      }

      // Render each user
      this.properties.firstUserIsAnonymous = false;
      if (users.length === 1) {
        this._renderUser(users[0]);
      } else {
        this._sortMultiAvatars().forEach(this._renderUser.bind(this));
      }

      // Add the "cluster" css if rendering multiple users
      // No classList.toggle due to poor IE11 support
      this.toggleClass('layer-avatar-cluster', users.length > 1 && !this.properties.firstUserIsAnonymous);
      if (users.length === 1 && this.showPresence && Client.isPresenceEnabled) {
        this.createElement('layer-presence', {
          size: this.size === 'larger' ? 'large' : this.size,
          item: users[0],
          name: 'presence',
          parentNode: this,
          classList: ['layer-presence-within-avatar'],
        });
      }
    },

    /**
     * Render each individual user.
     *
     * @method _renderUser
     * @private
     * @param {Layer.Core.Identity} user  User to render
     * @param {Number} index   Index in the users array
     * @param {Layer.Core.Identity[]} users   All users we are iterating over
     */
    _renderUser(user, index, users) {
      if (this.properties.firstUserIsAnonymous) return;
      const span = document.createElement('span');
      if (user.avatarUrl && !this.properties.failedToLoadImage) {
        span.classList.remove('layer-text-avatar');
        const img = document.createElement('img');
        span.appendChild(img);
        img.onerror = () => {
          img.parentNode.removeChild(img);
          this._setupTextAvatar(span, user);
        };
        img.src = user.avatarUrl;
      } else {
        this._setupTextAvatar(span, user, index);
      }
      this.appendChild(span);
    },

    /**
     * Setup a single avatar (this may be a multi-avatar widget that gets called multiple times).
     *
     * @private
     * @method _setupTextAvatar
     * @param {HTMLElement} node    The HTML Element that will get the identity's intials
     * @param {Layer.Core.Identity} user   The Identity to represent with this node
     * @param {Number} index   Index in the users array
     */
    _setupTextAvatar(node, user, index) {
      const text = this.onGenerateInitials(user);
      node.innerHTML = text;
      if (text) {
        node.classList.add('layer-text-avatar');
      } else {
        if (this.users.length > index + 1) {
          node.classList.add('layer-empty-group-avatar');
        } else {
          node.classList.add('layer-empty-avatar');
        }
        if (index === 0) this.properties.firstUserIsAnonymous = true;
      }
    },

    /**
     * MIXIN HOOK: Replace this with your own initial generator
     *
     * A user's intitials are put into an avatar if no image is present.
     * You can replace Layer's method for coming up with initials with your own:
     *
     * ```
     * Layer.UI.init({
     *   mixins: {
     *     'layer-avatar': {
     *        methods: {
     *          onGenerateInitials: {
     *            mode: Layer.UI.registerComponent.MODES.OVERWRITE, // replace existing mechanism
     *            value: function onGenerateInitials() {
     *              return 'OO';
     *            }
     *          }
     *        }
     *      }
     *   }
     * });
     * ```
     *
     * @method
     * @param {Layer.Core.Identity} user
     * @returns {String}
     */
    onGenerateInitials(user) {
      // Use first and last name if provided
      if (user.firstName || user.lastName) {
        return user.firstName.substring(0, 1).toUpperCase() + user.lastName.substring(0, 1).toUpperCase();
      }

      // Use displayName to try and find a first and last name
      else if (user.displayName.indexOf(' ') !== -1) {
        return user.displayName.substr(0, 1).toUpperCase() +
          user.displayName.substr(user.displayName.lastIndexOf(' ') + 1, 1).toUpperCase();
      }

      // If all else fails, use the first two letters
      else {
        return user.displayName.substring(0, 2).toUpperCase();
      }
    },

    _sortMultiAvatars() {
      return this.users
        .filter(user => !user.isMine)
        .sort((userA, userB) => {
          if (userA.type === 'BOT' && userB.type !== 'BOT') return 1;
          if (userB.type === 'BOT' && userA.type !== 'BOT') return -1;
          if (userA.avatarUrl && !userB.avatarUrl) return -1;
          if (userB.avatarUrl && !userA.avatarUrl) return 1;
          if (!userA.avatarUrl) {
            if (this.onGenerateInitials(userA) && !this.onGenerateInitials(userB)) return -1;
            if (this.onGenerateInitials(userB) && !this.onGenerateInitials(userA)) return 1;
          }
          if (this.users.indexOf(userA) > this.users.indexOf(userB)) return 1;
          return -1;
        });
    },
  },
});

