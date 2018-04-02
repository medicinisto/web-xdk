/**
 * Utilities for customizing Replaceable Content for common use cases.
 *
 * To use this, you should import it:
 *
 * ```
 * import RCUtils from '@layerhq/web-xdk/ui/ui-utils/replaceable-content-utils';
 *
 * Layer.init({
 *   mixins: {
 *     'layer-message-item-sent': {
 *        properties: {
 *          replaceableContent: {
 *            messageSentRightSide: RCUtils.menuNode,
 *            messageSentLeftSide: RCUtils.emptyNode,
 *            messageSentFooter: function(widget) {
 *              var model = widget.item.createModel();
 *              if (model.getModelName() === 'TextModel') {
 *                return RCUtils.date + RCUtils.statusNode + '<div>Hello World</div>';
 *              } else {
 *                var div = document.createElement('div');
 *                div.innerHTML = RCUtils.date + RCUtils.statusNode;
 *
 *                var button = document.createElement('button');
 *                button.innerHTML = 'Delete';
 *                button.addEventListener('click', function(evt) {
 *                  widget.item.delete(Layer.Constants.DELETION_MODE.ALL);
 *                });
 *                div.appendChild(button);
 *                return div;
 *              }
 *            }
 *          }
 *        }
 *      },
 *   }
 * });
 * ```
 *
 * @class Layer.UI.UIUtils.ReplaceableContent
 * @static
 */
module.exports = {
  /**
   * @property {String} avatarNode Describes an avatar for use within a Message List
   */
  avatarNode: '<layer-avatar size="small" show-presence="false" layer-id="avatar"></layer-avatar>',

  /**
   * @property {String} menuNode Describes a menu button for use within a Message List.  Use {@link Layer.UI.components.ConversationView#getMenuItems} to customize the menu.
   */
  menuNode: '<layer-menu-button layer-id="menuButton"></layer-menu-button>',

  /**
   * @property {String} dateNode Describes a date widget for rendering Message Sent Date for use within a Message List
   */
  dateNode: '<layer-date layer-id="date"></layer-date>',

  /**
   * @property {String} statusNode Describes a Status widget for rendering Message Read/Delivered/Pending status within a Message List
   */
  statusNode: '<layer-message-status layer-id="status"></layer-message-status>',

  /**
   * @property {String} senderNode Describes a `div` for rendering Message sender's name within a Message List
   */
  senderNode: '<div layer-id="sender" class="layer-sender-name"></div>',

  /**
   * @property {String} Age of the current Conversation, for rendering Conversation Items
   */
  conversationAge: '<layer-conversation-item-date layer-id="date"></layer-conversation-item-date>',
};
