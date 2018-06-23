/**
 * Helps manage separators between List Items.
 *
 * @class Layer.UI.UIUtils
 * @static
 */


/**
 * CSS Class to use with Layer.UI.ListSeparatorManager.createItemSeparator() created ndoes
 *
 * @property {String} [itemSeparatorParentClassName=layer-list-item-separator-parent]
 */
module.exports.itemSeparatorParentClassName = 'layer-list-item-separator-parent';


/**
 * Utility for getting a node for use in List Item `customNodeAbove` and `customNodeBelow`
 *
 * ```
 * if (!listItem.customNodeAbove) {
 *    var node = Layer.UI.ListSeparatorManager.createItemSeparator();
 *    node.appendChild(newSeparatorContent);
 *    listItem.customNodeAbove = node;
 * }
 * ```
 * @method createItemSeparator
 * @returns {HTMLElement}
 */
module.exports.createItemSeparator = () => {
  const node = document.createElement('div');
  node.classList.add(module.exports.itemSeparatorParentClassName);
  return node;
};


/**
 * Adds a separator between list items.
 *
 * While one can directly assign a node to `listItem.customNodeAbove`, there may be many processes that run
 * and which consider adding content between two list items. To do this, there should be a parent container,
 * as well as the ability to find this content and remove it from that parent container.
 *
 * ```
 * Layer.UI.ListSeparatorManager.addListItemSeparator(messageListItem, 'You have read up to here', 'layer-item-separator-read-indicator', true);
 * ```
 *
 * Or
 *
 * ```
 * var node = document.createElement('div');
 * node.innerHTML = 'You have read up to here';
 * Layer.UI.ListSeparatorManager.addListItemSeparator(messageListItem, node, 'layer-item-separator-read-indicator', true);
 * ```
 *
 * Both of these calls will result in `messageListItem.customNodeAbove` looking like:
 *
 * ```
 * <div class='layer-list-item-separator-parent'>
 *     <div class='layer-item-separator-read-indicator'>
 *         You have read up to here
 *     </div>
 * </div>
 * ```
 *
 * @method addListItemSeparator
 * @param {Layer.UI.mixins.ListItem} listItem    The List Item that the separator is associated with
 * @param {String/HTMLElement} content          The content to put in the separator
 * @param {String} contentClass                 Create a div with this class to put the content into; this allows us to see
 *                                               if there is already a node of that class.
 * @param {Boolean} isAboveItem                 If true, `listItem.customNodeAbove` is used, else `listItem.customNodeBelow`
 */
module.exports.addListItemSeparator = function addListItemSeparator(listItemNode, content, contentClass, isAboveItem) {
  const nodeName = isAboveItem ? 'customNodeAbove' : 'customNodeBelow';
  let node;

  if (content) {
    node = document.createElement('div');
    if (contentClass) node.classList.add(contentClass);
    node.classList.add('layer-list-item-separator');
  }

  if (content) {
    if (typeof content === 'string') {
      node.innerHTML = content;
    } else {
      node.appendChild(content);
    }
  }

  // If there is already a layer-list-item-separator-parent, then we just need to make sure it has this content
  if (listItemNode[nodeName] && node) {
    // If it looks like the content already exists, replace it
    const existingContent = listItemNode[nodeName].querySelector('.' + contentClass);
    if (existingContent) {
      existingContent.parentNode.replaceChild(node, existingContent);
    } else {
      listItemNode[nodeName].appendChild(node);
    }
  } else if (!listItemNode[nodeName] && node) {
    // Create a parent node and then add this to it
    const parent = module.exports.createItemSeparator();
    parent.appendChild(node);
    listItemNode[nodeName] = parent;
  } else if (listItemNode[nodeName] && !node) {
    const existingContent = listItemNode[nodeName].querySelector('.' + contentClass);
    if (existingContent) {
      existingContent.parentNode.removeChild(existingContent);
    }
  }
};
