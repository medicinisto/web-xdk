/* eslint-disable */
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel')
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')

new TextModel({text: "Simple product, no image, description or options"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 175,
  quantity: 3,
  brand: 'Apple',
  name: 'Apple 2 plus desktop computer',
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Simple Product with image and customData"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 175,
  quantity: 3,
  brand: 'Apple',
  name: 'Apple 2 plus desktop computer',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Simple Product with description, image and customData"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 175,
  quantity: 3,
  brand: 'Apple',
  name: 'Apple 2 plus desktop computer',
  description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Product with Options"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
   customData: {
     product_id: "Frodo-the-dodo",
     sku: "frodo-is-askew"
   },
   url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
   currency: 'USD',
   price: 175,
   quantity: 3,
   brand: 'Apple',
   name: 'Apple 2 plus desktop computer',
   description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
   imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
   options: [
     new ChoiceModel({
       enabledFor: Layer.client.user.id,
       label: 'RAM',
       type: 'label',
       allowReselect: true,
       preselectedChoice: 'large',
       choices: [
         {text:  "2K", id: "small"},
         {text:  "4K", id: "medium"},
         {text:  "8K", id: "large"},
       ]
     }),
     new ChoiceModel({
       enabledFor: Layer.client.user.id,
       label: 'Color',
       type: 'label',
       allowReselect: true,
       preselectedChoice: 'offwhite',
       choices: [
         {text:  "Off White", id: "offwhite"},
         {text:  "Awful White", id: "awfwhite"}
       ]
     }),
   ]
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Choices within Choices: A Button Message with Choice Buttons wrapping a Product Message with Options"}).send({ conversation: $("layer-conversation-view").conversation });

ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel')
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
model = new ButtonsModel({
buttons: [
 {
   "type": "choice",
   "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
   "data": {"enabledFor": Layer.client.user.id, "responseName": "thumborientation", allowReselect: true, allowDeselect: true}
 },
 {"type": "choice", "choices": [{"text": "I want to order one", "id": "buy", "tooltip": "buy"}], "data": {"enabledFor": Layer.client.user.id, "responseName": "buy", allowReselect: false}}
],
contentModel: new ProductModel({
 url: "http://www.neimanmarcus.com/Manolo-Blahnik-Fiboslac-Crystal-Embellished-Satin-Halter-Pump/prod200660136_cat13410734__/p.prod?icid=&searchType=EndecaDrivenCat&rte=%252Fcategory.service%253FitemId%253Dcat13410734%2526pageSize%253D30%2526No%253D0%2526Ns%253DPCS_SORT%2526refinements%253D299%252C381%252C4294910321%252C717%252C730&eItemId=prod200660136&xbcpath=cat13410734%2Ccat13030734%2Ccat000141%2Ccat000000&cmCat=product",
 price: 525,
 quantity: 1,
 currency: "USD",
 brand: "Prison Garb Inc",
 name: "Formal Strait Jacket",
 description: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
 imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ],
 options: [
   new ChoiceModel({
     enabledFor: Layer.client.user.id,
     label: 'Size',
     type: 'label',
     preselectedChoice: 'small',
     choices: [
       {text:  "Small", id: "small"},
       {text:  "Medium", id: "medium"},
       {text:  "Large", id: "large"},
     ]
   }),
   new ChoiceModel({
     enabledFor: Layer.client.user.id,
     label: 'Color',
     type: 'label',
     preselectedChoice: 'white',
     choices: [
       {text:  "White", id: "white"},
       {text:  "Black", id: "black"},
       {text:  "Gold", id: "gold"},
     ]
   })
 ]
}),
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Simple Product with no name"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 175,
  quantity: 3,
  brand: 'Apple',
  description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Simple Product with no price"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  quantity: 3,
  brand: 'Apple',
  name: 'Apple 2 plus desktop computer',
  description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Simple Product with no price"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 0,
  quantity: 3,
  brand: 'Apple',
  name: 'Apple 2 plus desktop computer',
  description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Simple Product with no brand"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ProductModel({
  customData: {
    product_id: "Frodo-the-dodo",
    sku: "frodo-is-askew"
  },
  url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
  currency: 'USD',
  price: 175,
  quantity: 3,
  name: 'Apple 2 plus desktop computer',
  description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
  imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
});
model.send({ conversation: $("layer-conversation-view").conversation });

