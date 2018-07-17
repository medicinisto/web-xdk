/**
 * This widget renders any message received by this user within the Message List.
 *
 * ### Importing
 *
 * Included with the standard build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-message-list/layer-message-item-received';
 * ```
 *
 * @class Layer.UI.components.MessageListPanel.ReceivedItem
 * @extends Layer.UI.Component
 * @mixin Layer.UI.components.MessageListPanel.Item
 */
import { registerComponent } from '../component';
import MessageItemMixin from './layer-message-item-mixin';
import * as RCUtils from '../../ui-utils/replaceable-content-utils';

registerComponent('layer-message-item-received', {
  mixins: [MessageItemMixin],
  template: `
    <div class='layer-list-item' layer-id='innerNode'>

      <!-- Header -->
      <layer-replaceable-content class='layer-message-header' name='messageReceivedHeader'></layer-replaceable-content>

      <!-- Body -->
      <div class='layer-message-row' layer-id='messageRow'>

        <!-- Body: Left Side -->
        <layer-replaceable-content
          class='layer-message-left-side'
          name='messageReceivedLeftSide'>
        </layer-replaceable-content>

        <!-- Body: Message Contents -->
        <div class='layer-message-item-main'>
          <layer-message-viewer layer-id='messageViewer'></layer-message-viewer>
          <div class='layer-message-item-content' layer-id='content'></div>
        </div>

        <!-- Body: Right Side -->
        <layer-replaceable-content
          class='layer-message-right-side'
          name='messageReceivedRightSide'>
        </layer-replaceable-content>
      </div>

      <!-- Footer -->
      <layer-replaceable-content class='layer-message-footer' name='messageReceivedFooter'></layer-replaceable-content>
    </div>
  `,
  style: `
    layer-message-item-received {
      display: flex;
      flex-direction: column;
      align-content: stretch;
    }
    layer-message-item-received .layer-list-item {
      display: flex;
      flex-direction: column;
      align-content: stretch;
    }
    layer-message-item-received  .layer-message-item-main {
      flex-grow: 1;
      overflow: hidden;
      width: 100px; /* flexbox bug workaround */
    }
    /* Insure that text, images, videos, etc... are all left aligned */
    layer-message-item-received layer-message-text-plain {
      display: block;
    }
    layer-message-item-received.layer-message-item-hide-replaceable-content .layer-message-right-side,
    layer-message-item-received.layer-message-item-hide-replaceable-content .layer-message-left-side {
      display: none;
    }
  `,
  properties: {
    replaceableContent: {
      value: {
        messageReceivedLeftSide: RCUtils.avatarNode,
        messageReceivedRightSide: RCUtils.menuNode,
        messageReceivedFooter: RCUtils.dateNode,
        messageReceivedHeader: RCUtils.senderNode,
      },
    },
  },
});
