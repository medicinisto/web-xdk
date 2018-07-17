/**
 * @class Layer.UI.UIUtils
 */

/**
 * Use this module to put a date separator between Messages from different dates in your Messages List.
 *
 * ```
 * conversationView.onRenderListItem = Layer.UI.UIUtils.dateSeparator;
 * ```
 *
 * Or if you have multiple `onRenderListItem` handlers:
 *
 * ```
 * conversationView.onRenderListItem = function(widget, messages, index, isTopItem) {
 *     Layer.UI.UIUtils.dateSeparator(widget, messages, index);
 *     handler2(widget, messages, index, isTopItem);
 *     handler3(widget, messages, index, isTopItem);
 * }
 * ```
 *
 * Date separators come as `<div class='layer-list-item-separator-date'><span>DATE</span></div>`
 *
 * @method dateSeparator
 * @param {Layer.UI.mixins.ListItem} widget
 * @param {Layer.Core.Message} message
 * @param {Number} index
 */
import { addListItemSeparator } from './list-separator-manager';

const dateClassName = 'layer-list-item-separator-date';

export default function dateSeparator(widget, messages, index) {
  try {
    if (index > messages.length) return;
    const message = widget.item;
    const needsBoundary = index === 0 || message.sentAt.toDateString() !== messages[index - 1].sentAt.toDateString();

    if (needsBoundary) {
      const dateWidget = document.createElement('layer-date');
      dateWidget.weekFormat = { weekday: 'long' };
      dateWidget.defaultFormat = { month: 'long', day: 'numeric' };
      dateWidget.olderFormat = { month: 'long', day: 'numeric', year: 'numeric' };
      dateWidget.date = messages[index].sentAt;
      const parent = document.createElement('div');
      parent.appendChild(dateWidget);
      parent.classList.add(dateClassName + '-inner');
      addListItemSeparator(widget, parent, dateClassName, true);
    } else {
      addListItemSeparator(widget, '', dateClassName, true);
    }
  } catch (e) {
    // no-op
  }
}
