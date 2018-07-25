/**
 * The Layer Membership Item represents a single user within a Membership List.
 *
 * ### Importing
 *
 * Not included with the standard build. To import pick one:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-membership-list';
 * import '@layerhq/web-xdk/ui/components/layer-membership-list/layer-membership-item';
 * ```
 *
 * @class Layer.UI.components.MembershipListPanel.Item
 * @experimental
 * @extends Layer.UI.Component
 * @mixins Layer.UI.mixins.ListItem
 * @mixins Layer.UI.mixins.ListItemSelection
 * @ignore
 */
import ListItem from '../../mixins/list-item';
import ListItemSelection from '../../mixins/list-item-selection';
import { registerComponent } from '../component';

registerComponent('layer-membership-item', {
  mixins: [ListItem, ListItemSelection],
  template: `
    <div class='layer-list-item'>
      <layer-avatar layer-id='avatar'></layer-avatar>
      <label class='layer-membership-name' layer-id='title'></label>
    </div>
  `,
  style: `
    layer-membership-item {
      display: flex;
      flex-direction: column;
    }
    layer-membership-item .layer-list-item {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    layer-membership-item .layer-list-item layer-avatar {
      margin-right: 20px;
    }
    layer-membership-item .layer-list-item label {
      flex-grow: 1;
      width: 100px; /* Flexbox bug */
    }
    layer-membership-item.layer-item-filtered .layer-list-item,
    layer-membership-item.layer-membership-item-empty {
      display: none;
    }
  `,
  properties: {
    item: {
      set(member) {
        if (member) member.identity.on('identities:change', this.onRerender.bind(this));
      },
    },
  },
  methods: {
    /**
     * Render/rerender the user, showing the avatar and user's name.
     *
     * @method onRender
     * @private
     */
    onRender() {
      this.nodes.avatar.users = [this.item.identity];
      this.onRerender();
    },

    /**
     * Render/rerender changes to the Identity object or Membership object.
     *
     * @method onRerender
     */
    onRerender() {
      this.nodes.title.innerHTML = this.item.identity.displayName || 'User ID ' + this.item.identity.userId;
    },

    /**
     * Run a filter on this item, and hide it if it doesn't match the filter.
     *
     * @method _runFilter
     * @param {String | RegExp | Function} filter
     */
    _runFilter(filter) {
      const identity = this.properties.item.identity;
      let match = false;
      if (!filter) {
        match = true;
      } else if (filter instanceof RegExp) {
        match = filter.test(identity.displayName) ||
          filter.test(identity.firstName) ||
          filter.test(identity.lastName) ||
          filter.test(identity.emailAddress);
      } else if (typeof filter === 'function') {
        match = filter(identity);
      } else {
        filter = filter.toLowerCase();
        match =
          identity.displayName.toLowerCase().indexOf(filter) !== -1 ||
          identity.firstName.toLowerCase().indexOf(filter) !== -1 ||
          identity.lastName.toLowerCase().indexOf(filter) !== -1 ||
          identity.emailAddress.toLowerCase().indexOf(filter) !== -1;
      }
      this.classList[match ? 'remove' : 'add']('layer-item-filtered');
    },
  },
});
