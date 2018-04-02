/* eslint-disable */
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
new TextModel({text: "One Button"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Two Buttons"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"},
   {"type": "action", "text": "Give Holy Grail", "event": "grant-grail"}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });



new TextModel({text: "Custom Event Data"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "Kill Arthur, all his friends, his horse and his dog", "event": "open-url", data: {url: "http://docs.layer.com"}},
   {"type": "action", "text": "Give Holy Grail", "event": "open-url", data: {url: "http://layer.com"}}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "One Button and Text Model"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
model = new ButtonModel({
  buttons: [
    {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
  ],
  contentModel: new TextModel({
    title: "Text Model Title",
    text: "Text Model Contents"
  })
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Two Buttons and Text Model"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
model = new ButtonModel({
  buttons: [
    {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"},
    {"type": "action", "text": "Give Holy Grail", "event": "grant-grail"}
  ],
  contentModel: new TextModel({
    title: "Text Model Title",
    text: "Text Model Contents"
  })
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "open-url, open-file buttons with a Link Message"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
model = new ButtonModel({
  buttons: [
    {"type": "action", "text": "Open Url", "event": "open-url"},
    {"type": "action", "text": "Open File", "event": "open-file"}
  ],
  contentModel: new LinkModel({
    title: "Text Model Title",
    description: "Layer Has Docs",
    url: "http://docs.layer.com"
  })
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "One Choice Button set and one Regular Button"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {
      "type": "choice",
      "choices": [
        {"text": "like", "id": "like", "tooltip": "like"},
        {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
      ],
      data: {
        enabledFor: Layer.client.user.id
      }
    }
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "3 button choice set with emoji characters"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [{
   "type": "choice",
   "choices": [
     {"text": "\uD83D\uDC4D", "id": "like"},
     {"text": "\uD83D\uDC4E", "id": "dislike"},
     {"text": "\ud83d\udc4c", "id": "ok"},
    ],
      data: {
        enabledFor: Layer.client.user.id
      }
  }
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "3 button choice with a name for a customized Response Message"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [{
   "type": "choice",
   "choices": [
     {"text": "\uD83D\uDC4D", "id": "like"},
     {"text": "\uD83D\uDC4E", "id": "dislike"},
     {"text": "\ud83d\udc4c", "id": "ok"},
    ],
    data: {
      name: "Judgement Message"
    },
  }
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Choice Button custom responseName"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ],
    data: {
      enabledFor: Layer.client.user.id,
      responseName: "satisfaction"
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Choice Buttons with allowReselect"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      enabledFor: Layer.client.user.id,
      allowReselect: true,
      name: 'Liking Layer'
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Choice Buttons with allowReselect with preselectedChoice"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      preselectedChoice: 'dislike',
      allowReselect: true,
      enabledFor: Layer.client.user.id
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Choice Buttons with allowDeselect"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      enabledFor: Layer.client.user.id,
      allowDeselect: true
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Choice Buttons with allowMultiselect"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      enabledFor: Layer.client.user.id,
      allowMultiselect: true
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Multiple Choice Sets"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {"type": "action", "text": "open layer", event: 'open-url', data: {url: 'https://layer.com'}},
   {"type": "choice", "choices": [
     {"text": "like", "id": "like", "tooltip": "like"},
     {"text": "dislike", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      enabledFor: Layer.client.user.id,
      "responseName": "satisfaction",
      allowReselect: true
    }},
  {"type": "choice", "choices": [
    {"text": "like 2", "id": "like", "tooltip": "like"},
    {"text": "dislike 2", "id": "dislike", "tooltip": "dislike"}
    ], "data": {
      enabledFor: Layer.client.user.id,
      "responseName": "satisfaction2",
      allowReselect: true
    }}
 ]
});
model.send({ conversation: $("layer-conversation-view").conversation });



new TextModel({text: "Product Demo"}).send({ conversation: $("layer-conversation-view").conversation });

ProductModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {
     "type": "choice",
     "choices": [{"text": "like", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "dislike", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "satisfaction", preselectedChoice: 'dislike', allowReselect: true}
   },
   {
     "type": "choice",
     "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "thumborientation", allowReselect: true, allowDeselect: false}
   },
   {
     "type": "choice",
     "choices": [{"text": "helpful", "id": "helpful", "tooltip": "helpful"}, {"text": "unhelpful", "id": "unhelpful", "tooltip": "unhelpful"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "helpfulness", allowReselect: false}
   },
 ],
 contentModel: new ProductModel({
   currency: 'USD',
   price: 175,
   quantity: 3,
   brand: "randomcrap.com",
   name: "A pretty picture",
   imageUrls: [ "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg" ],
 })
});
model.send({ conversation: $("layer-conversation-view").conversation });



ProductModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {
     "type": "choice",
     "choices": [{"text": "like", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "dislike", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "satisfaction", preselectedChoice: 'dislike', allowReselect: true}
   },
   {
     "type": "choice",
     "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "thumborientation", allowReselect: true, allowDeselect: false, customResponseData: {howdy: "ho der"}}
   },
   {
     "type": "choice",
     "choices": [{"text": "helpful", "id": "helpful", "tooltip": "helpful"}, {"text": "unhelpful", "id": "unhelpful", "tooltip": "unhelpful"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "helpfulness", allowReselect: false}
   },
 ],
 contentModel: new ProductModel({
   currency: 'USD',
   price: 175,
   quantity: 3,
   brand: "randomcrap.com",
   name: "A pretty picture",
   imageUrls: [ "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg" ],
 })
});
model.send({ conversation: $("layer-conversation-view").conversation });

ProductModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonModel({
 buttons: [
   {
     "type": "choice",
     "choices": [
       {
         "text": "like",
         "id": "like",
         "tooltip": "like",
         "style": "style name supported by UI Framework or provided by customer",
         "states": {
           "default": {
             "text": "love",
             "tooltip": "love",
             "style": "override the base style"
           },
           "selected": {
             "text": "please deselect me"
           },
           "disabled": {
             "text": "Feature not enabled",
             "style": "warning_button"
           }
         }
       },
       {
         "text": "dislike",
         "id": "dislike",
         "tooltip": "dislike"
       }],
     "data": {enabledFor: Layer.client.user.id,"responseName": "satisfaction", allowReselect: true}
   },
   {
     "type": "choice",
     "choices": [{"text": "\uD83D\uDC4D", "id": "up", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "down", "tooltip": "dislike", "icon": "custom-dislike-button"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "thumborientation", allowReselect: true, allowDeselect: false, customResponseData: {howdy: "ho der"}}
   },
   {
     "type": "choice",
     "choices": [{"text": "helpful", "id": "helpful", "tooltip": "helpful"}, {"text": "unhelpful", "id": "unhelpful", "tooltip": "unhelpful"}],
     "data": {enabledFor: Layer.client.user.id,"responseName": "helpfulness", allowReselect: false}
   },
 ],
 contentModel: new ProductModel({
   currency: 'USD',
   price: 175,
   quantity: 3,
   brand: "randomcrap.com",
   name: "A pretty picture",
   imageUrls: [ "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg" ],
 })
});
model.send({ conversation: $("layer-conversation-view").conversation });
