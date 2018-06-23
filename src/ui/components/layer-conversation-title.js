/**
 * The Layer widget renders a title for a Layer.Core.Conversation.
 *
 * This is provided as a specialized component so that it can be easily redefined by your app to
 * provide your own Conversation titles:
 *
 * ```
 * Layer.UI.registerComponent('layer-conversation-title', {
 *    properties: {
 *      item: {
 *        set: function(value) {
 *           this.innerHTML = this.item.metadata.myCustomTitle;
 *        }
 *      }
 *    }
 * });
 *
 * // Call init after custom components are defined
 * Layer.init({
 *   appId:  'layer:///apps/staging/UUID'
 * });
 * ```
 *
 * ### Importing
 *
 * Import this with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-conversation-title';
 * ```
 *
 * @class Layer.UI.components.ConversationTitle
 * @extends Layer.UI.Component
 */
import { registerComponent } from './component';

registerComponent('layer-conversation-title', {
  style: `
    layer-conversation-title {
      display: block;
    }
  `,
  properties: {

    /**
     * The Layer.Core.Conversation to be rendered.
     *
     * @property {Layer.Core.Conversation} [item=null]
     */
    item: {
      set(newConversation, oldConversation) {
        if (oldConversation) oldConversation.off(null, null, this);
        if (newConversation) newConversation.on('conversations:change', this.onRerender, this);
        this.onRender();
      },
    },
  },
  methods: {

    /**
     * Rerender the widget any time a new conversation is assigned or that conversation has a relevant change event.
     *
     * @method onRerender
     * @private
     * @param {Event} evt
     */
    onRerender(evt) {
      if (!evt || evt.hasProperty('metadata') || evt.hasProperty('participants')) {
        const conversation = this.item;

        // If no conversation, empty the widget
        if (!conversation) {
          this.innerHTML = '';
        } else {
          let title = conversation.metadata.conversationName;
          if (!title) {
            const users = conversation.participants
              .filter(user => !user.isMine) // don't show the user their own name
              .filter(user => user.displayName || user.firstName || user.lastName);
            if (users.length === 1) {
              title = users[0].displayName || users[0].firstName || users[0].lastName;
            } else {
              const sortedUsers = this._sortNames();
              const sortedNames =
                sortedUsers.slice(0, 3).map(user => user.firstName || user.lastName || user.displayName);
              let names = sortedNames.join(', ');
              if (sortedUsers.length > 3) names += '&#8230;';
              title = names || 'No Title';
            }
          }
          if (title !== this.innerHTML) this.innerHTML = title;
        }
      }
    },

    /**
     * Sort the names when listing participants as part of the title
     *
     * 1. Filter out the authenticated user; they know they are in the conversation
     * 2. Filter out anyone without a name
     * 3. Sort any bot after any user
     * 4. Sort users with first/last names ahead of those with only a displayName
     * 5. Otherwise maintain the order of the `participants` array (arbitrary order)
     *
     * @method _sortNames
     * @private
     */
    _sortNames() {
      const participants = this.item.participants;
      return participants
        .filter(user => !user.isMine)
        .filter(user => user.firstName || user.lastName || user.displayName)
        .sort((userA, userB) => {
          if (userA.type === 'bot' && userB.type !== 'bot') return 1;
          if (userB.type === 'bot' && userA.type !== 'bot') return -1;
          if ((!userA.firstName && !userA.lastName) && (userB.firstName || userB.lastName)) return 1;
          if ((userA.firstName || userA.lastName) && (!userB.firstName && !userB.lastName)) return -1;
          if (!userA.firstName && !userA.lastName) {
            if (userA.displayName && !userB.displayName) return -1;
            if (!userA.displayName && userB.displayName) return 1;
          }
          if (participants.indexOf(userA) > participants.indexOf(userB)) return 1;
          return -1;
        });
    },
  },
});
