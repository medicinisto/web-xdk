/*
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
MessageTypeListModel = Layer.Core.Client.getMessageTypeModelClass('MessageTypeListModel');
  model = new MessageTypeListModel({
    items: [
      new TextModel({text: "Hello world", "title": "This is a Welcome"}),
      new TextModel({text: "The world is not enough"}),
      new TextModel({text: "Farewell world, I'm off to find a better planet"})
    ]
  });
  model.send({ conversation });


* @class Layer.UI.cards.MessageTypeListModel
* @extends layer.model
*/
import Core, { MessagePart, MessageTypeModel } from '../../../core/namespace';

class MessageTypeListModel extends MessageTypeModel {
  generateParts(callback) {
    const body = this.initBodyWithMetadata([]);

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });

    let asyncCount = 0;
    const parts = [this.part];
    this.items.forEach((item) => {
      this.addChildModel(item, 'message-item', (moreParts) => {
        moreParts.forEach(p => parts.push(p));
        asyncCount++;
        if (asyncCount === this.items.length) {
          callback(parts);
        }
      });
    });
    this.items.forEach(item => item.mergeAction(this.action));
  }

  parseModelChildParts() {
    super.parseModelChildParts();

    // Gather all of the parts that represent a high level list element (ignoring any subparts they may bring with them)
    // Exclucde our main list part that defines the list rather than its list items
    const parts = this.childParts.filter(part => part.mimeAttributes.role === 'message-item');
    this.items = parts.map(part => part.createModel());
    this.items.forEach(item => item.mergeAction(this.action));
  }

  getOneLineSummary() {
    return this.items[this.items.length - 1].text;
  }
}

MessageTypeListModel.prototype.action = null;
MessageTypeListModel.prototype.items = null;

MessageTypeListModel.Label = 'Messages';
MessageTypeListModel.messageRenderer = 'layer-message-type-list-view';
MessageTypeListModel.MIMEType = 'application/x.layer.message-type-list+json';

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(MessageTypeListModel, 'MessageTypeListModel');

module.exports = MessageTypeListModel;

