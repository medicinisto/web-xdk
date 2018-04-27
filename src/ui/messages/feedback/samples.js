/* eslint-disable */
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');

new TextModel({text: "Basic Feedback"}).send({ conversation: $("layer-conversation-view").conversation });

model = new FeedbackModel({
  enabledFor: [Layer.client.user.id],
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Feedback with custom action data"}).send({ conversation: $("layer-conversation-view").conversation });

model = new FeedbackModel({
  enabledFor: [Layer.client.user.id],
  action: {
    data: {hey: 'ho'}
  }
});
model.send({ conversation: $("layer-conversation-view").conversation });


TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');
ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');

new TextModel({text: "Feedback with Button with custom action data"}).send({ conversation: $("layer-conversation-view").conversation });
model = new ButtonsModel({
  contentModel: new FeedbackModel({
    enabledFor: [Layer.client.user.id],
    action: {
      data: {hey: 'ho'}
    }
  }),
  buttons: [{type: "action", text: "open", event: "layer-show-large-message", data: {hey: "there"}}],
});
model.send({ conversation: $("layer-conversation-view").conversation });

