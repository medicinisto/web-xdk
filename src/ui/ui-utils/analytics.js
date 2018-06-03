module.exports.getWhereClicked = (messageViewer) => {
  const rootMessageViewer = messageViewer.getRootMessageViewer();
  let whereClicked;
  let parentName;
  if (rootMessageViewer.parentComponent) {
    parentName = rootMessageViewer.parentComponent.tagName.toLowerCase();
  } else if (rootMessageViewer.parentNode.classList.length) {
    parentName =
      rootMessageViewer.parentNode.tagName.toLowerCase() + '.' + Array.prototype.join.call(rootMessageViewer.parentNode.classList, '.');
  } else {
    parentName = rootMessageViewer.parentNode.tagName.toLowerCase();
  }
  switch (parentName) {
    case 'layer-message-item-sent':
    case 'layer-message-item-received':
    case 'layer-message-item-status':
      whereClicked = 'message-list';
      break;
    default:
      whereClicked = parentName;
  }
  return whereClicked;
};
