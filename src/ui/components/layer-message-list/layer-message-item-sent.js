/**
 * This widget renders any message sent by this user within the Message List.
 *
 * ### Importing
 *
 * Included with the standard build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-message-list/layer-message-item-sent';
 * ```
 *
 * @class Layer.UI.components.MessageListPanel.SentItem
 * @extends Layer.UI.Component
 * @mixin Layer.UI.components.MessageListPanel.Item
 */
import { registerComponent } from '../component';
import MessageItemMixin from './layer-message-item-mixin';
import * as RCUtils from '../../ui-utils/replaceable-content-utils';

registerComponent('layer-message-item-sent', {
  mixins: [MessageItemMixin],
  template: `
    <div class='layer-list-item' layer-id='innerNode'>

      <!-- Header -->
      <layer-replaceable-content class='layer-message-header' name='messageSentHeader'></layer-replaceable-content>

      <!-- Body -->
      <div class='layer-message-row' layer-id='messageRow'>

        <!-- Body: left Side -->
        <layer-replaceable-content
          class='layer-message-left-side'
          name='messageSentLeftSide'>
        </layer-replaceable-content>


        <!-- Body: Message Contents -->
        <div class='layer-message-item-main'>
          <layer-message-viewer layer-id='messageViewer'></layer-message-viewer>
          <div class='layer-message-item-content' layer-id='content'></div>
        </div>

        <!-- Body: Right Side -->
        <layer-replaceable-content
          class='layer-message-right-side'
          name='messageSentRightSide'>
        </layer-replaceable-content>
      </div>

      <!-- Footer -->
      <layer-replaceable-content class='layer-message-footer' name='messageSentFooter'></layer-replaceable-content>
    </div>
  `,
  style: `
    layer-message-item-sent {
      display: flex;
      flex-direction: column;
      align-content: stretch;
    }
    layer-message-item-sent .layer-list-item {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    layer-message-item-sent .layer-message-item-main {
      text-align: right;
      flex-grow: 1;
      overflow: hidden;
      width: 100px; /* flexbox bug workaround */
    }
    /* For backwards compat message view node */
    layer-message-item-sent .layer-message-item-main .layer-message-item-content {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
    }
    layer-message-item-sent .layer-message-right-side > div {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    layer-message-item-sent.layer-message-item-hide-replaceable-content .layer-message-right-side,
    layer-message-item-sent.layer-message-item-hide-replaceable-content .layer-message-left-side {
      display: none;
    }
  `,
  properties: {
    replaceableContent: {
      value: {
        messageSentRightSide: RCUtils.avatarNode + RCUtils.menuNode,
        messageSentFooter: RCUtils.statusNode + RCUtils.dateNode,
      },
    },
  },
});
