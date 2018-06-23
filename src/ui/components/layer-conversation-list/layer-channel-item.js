/*
 * The Layer Channel Item widget renders a single Channel, typically for use representing a
 * channel within a list of channels.
 *
 * This is designed to go inside of the Layer.UI.components.ConversationListPanel.List widget, and be a
 * concise enough summary that it can be scrolled through along
 * with hundreds of other Conversations Item widgets.
 *
 * Future Work:
 *
 * * Badges for unread messages (currently just adds a css class so styling can change if there are any unread messages)
 *
 * ### Importing
 *
 * Not included with the standard build. To import pick one:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-conversation-list';
 * import '@layerhq/web-xdk/ui/components/layer-conversation-list/layer-channel-item';
 * ```
 *
 * @class Layer.UI.components.ConversationListPanel.Item.Channel
 * @experimental
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import ListItem from '../../mixins/list-item';
import ListItemSelection from '../../mixins/list-item-selection';
import SizeProperty from '../../mixins/size-property';

registerComponent('layer-channel-item', {
  mixins: [ListItem, ListItemSelection, SizeProperty],
  template: `
    <div class='layer-list-item' layer-id='innerNode'>
      <div class='layer-channel-item-content'>
        <div layer-id='title' class='layer-channel-title'></div>
      </div>
    </div>
  `,
  style: `
    layer-channel-item {
      display: flex;
      flex-direction: column;
    }
    layer-channel-item .layer-list-item {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    layer-channel-item  .layer-list-item .layer-channel-item-content {
      flex-grow: 1;
      width: 100px; /* Flexbox bug */
    }
    layer-channel-item.layer-item-filtered .layer-list-item {
      display: none;
    }
  `,
  properties: {

    // Every List Item has an item property, here it represents the Conversation to render
    item: {
      set(newConversation, oldConversation) {
        if (newConversation) this.onRerender();
      },
    },

    /**
     * Enable deletion of this Conversation.
     *
     * This property is currently assumed to be settable at creation time only,
     * and does not rerender if changed.
     *
     * This property does nothing if you remove the `delete` node from the template.
     *
     * @property {Boolean} [deleteConversationEnabled=false]
     * @removed
     */


    size: {
      value: 'large',
      set(size) {
        Object.keys(this.nodes).forEach((nodeName) => {
          const node = this.nodes[nodeName];
          if (node.supportedSizes && node.supportedSizes.indexOf(size) !== -1) {
            node.size = size;
          }
        });
      },
    },

    supportedSizes: {
      value: ['tiny', 'small', 'medium', 'large'],
    },
  },
  methods: {

    onRerender() {
      if (this.item) this.nodes.title.innerHTML = this.item.name;
    },

    /**
     * Run a filter on this item; not match => hidden; match => shown.
     *
     * @method _runFilter
     * @param {String | RegExp | Function} filter
     */
    _runFilter(filter) {
      const channel = this.properties.item;
      let match;
      if (!filter) {
        match = true;
      } else if (typeof filter === 'function') {
        match = filter(channel);
      } else if (filter instanceof RegExp) {
        match = filter.test(channel.name);
      } else {
        filter = filter.toLowerCase();
        match = channel.name.toLowerCase().indexOf(filter) !== -1;
      }
      this.classList[match ? 'remove' : 'add']('layer-item-filtered');
    },
  },
});

