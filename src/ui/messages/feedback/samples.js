/* eslint-disable */
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');

new TextModel({text: "Basic Feedback"}).send({ conversation: $("layer-conversation-view").conversation });

model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
});
model.send({ conversation: $("layer-conversation-view").conversation });


TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');
new TextModel({text: "Custom prompt"}).send({ conversation: $("layer-conversation-view").conversation });

model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
  prompt: "Hey Ho"
});
model.send({ conversation: $("layer-conversation-view").conversation });


TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');

new TextModel({text: "Custom promptWait"}).send({ conversation: $("layer-conversation-view").conversation });
model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
  promptWait: "Hey Ho"
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Custom placeholder"}).send({ conversation: $("layer-conversation-view").conversation });
model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
  placeholder: "Hey Ho"
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Custom title"}).send({ conversation: $("layer-conversation-view").conversation });
model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
  title: "Hey Ho"
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Custom action"}).send({ conversation: $("layer-conversation-view").conversation });
model = new FeedbackModel({
  enabledFor: Layer.client.user.id,
  action: {event: "open-url", data: {url: "https://layer.com"}}
});
model.send({ conversation: $("layer-conversation-view").conversation });

TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');
ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');

new TextModel({text: "Feedback with Open Feedback Button"}).send({ conversation: $("layer-conversation-view").conversation });
model = new ButtonsModel({
  contentModel: new FeedbackModel({
    enabledFor: Layer.client.user.id,
    action: {
      data: {hey: 'ho'}
    }
  }),
  buttons: [{type: "action", text: "open", event: "layer-show-large-message", data: {hey: "there"}}],
});
model.send({ conversation: $("layer-conversation-view").conversation });

CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

new TextModel({text: "Carousel of Feedback"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [
    new FeedbackModel({
      enabledFor: Layer.client.user.id,
      action: {
        data: {hey: 'ho'}
      }
    }),
    new FeedbackModel({
      enabledFor: Layer.client.user.id,
      action: {
        data: {hey: 'ho'}
      }
    }),
    new FeedbackModel({
      enabledFor: Layer.client.user.id,
      action: {
        data: {hey: 'ho'}
      }
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });

CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel');
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

new TextModel({text: "Carousel of Feedback in Buttons"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [
    new ButtonsModel({
      contentModel: new FeedbackModel({
        enabledFor: Layer.client.user.id,
        action: {
          data: {hey: 'ho'}
        }
      }),
      buttons: [{type: "action", text: "open", event: "layer-show-large-message", data: {hey: "there"}}],
    }),
    new ButtonsModel({
      contentModel: new FeedbackModel({
        enabledFor: Layer.client.user.id,
        action: {
          data: {hey: 'ho'}
        }
      }),
      buttons: [{type: "action", text: "open", event: "layer-show-large-message", data: {hey: "there"}}],
    }),
    new ButtonsModel({
      contentModel: new FeedbackModel({
        enabledFor: Layer.client.user.id,
        action: {
          data: {hey: 'ho'}
        }
      }),
      buttons: [{type: "action", text: "open", event: "layer-show-large-message", data: {hey: "there"}}],
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });