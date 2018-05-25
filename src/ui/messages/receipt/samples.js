function createModel() {
  return new ReceiptModel({
    currency: 'USD',
    order: {
      number: 'FRODO-DODO-ONE'
    },
    paymentMethod: "VISA ****1234",
    summary: {
      shippingCost: 350.01,
      totalTax: 0.01,
      totalCost: 350.02
    },
    shippingAddress: new LocationModel({
      city: 'San Francisco',
      name: 'Layer Inc',
      postalCode: '94107',
      administrativeArea: 'CA',
      street1: '655 4th st',
      description: 'Description should not show'
    }),
    items: [createProductModel(), createProductModel(), createProductModel()]
  });
}

function createProductModel() {
  return new ProductModel({
    url: "http://www.neimanmarcus.com/Manolo-Blahnik-Fiboslac-Crystal-Embellished-Satin-Halter-Pump/prod200660136_cat13410734__/p.prod?icid=&searchType=EndecaDrivenCat&rte=%252Fcategory.service%253FitemId%253Dcat13410734%2526pageSize%253D30%2526No%253D0%2526Ns%253DPCS_SORT%2526refinements%253D299%252C381%252C4294910321%252C717%252C730&eItemId=prod200660136&xbcpath=cat13410734%2Ccat13030734%2Ccat000141%2Ccat000000&cmCat=product",
    price: 525,
    quantity: 1,
    currency: "USD",
    brand: "Prison Garb Inc",
    name: "Formal Strait Jacket",
    description: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
    imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ],
  });
}

TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
ReceiptModel = Layer.Core.Client.getMessageTypeModelClass('ReceiptModel')
LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel')
ListModel = Layer.Core.Client.getMessageTypeModelClass('ListModel')
ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel')
ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel')
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')

new TextModel({text: "Standard Receipt Message"}).send({ conversation: $("layer-conversation-view").conversation });

new ReceiptModel({
  currency: 'USD',
  order: {
    number: 'FRODO-DODO-ONE'
  },
  paymentMethod: "VISA ****1234",
  summary: {
    shipping_cost: 350.01,
    total_tax: 0.01,
    total_cost: 350.02
  },
  shippingAddress: new LocationModel({
    city: 'San Francisco',
    name: 'Layer Inc',
    postalCode: '94107',
    administrativeArea: 'CA',
    street1: '655 4th st',
    description: 'Description should not show'
  }),
  items: [
      new ProductModel({
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
              label: 'Size',
              type: 'Label',
              preselectedChoice: 'small',
              enabledFor: Layer.client.user.id,

              choices: [
                {text:  "Small", id: "small"},
                {text:  "Medium", id: "medium"},
                {text:  "Large", id: "large"},
              ]
            }),
            new ChoiceModel({
              label: 'Color',
              type: 'Label',
              preselectedChoice: 'white',
              enabledFor: Layer.client.user.id,

              choices: [
                {text:  "White", id: "white"},
                {text:  "Black", id: "black"},
                {text:  "Gold", id: "gold"},
              ]
            })
          ]
      }),
      new ProductModel({
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
              label: 'Size',
              type: 'Label',
              enabledFor: Layer.client.user.id,
              choices: [
                {text:  "Small", id: "small"},
                {text:  "Medium", id: "medium"},
                {text:  "Large", id: "large"},
              ]
            }),
            new ChoiceModel({
              label: 'Color',
              type: 'Label',
              preselectedChoice: 'white',
              enabledFor: Layer.client.user.id,
              choices: [
                {text:  "White", id: "white"},
                {text:  "Black", id: "black"},
                {text:  "Gold", id: "gold"},
              ]
            })
          ]
      }),
      new ProductModel({
        url: "http://www.neimanmarcus.com/Manolo-Blahnik-Fiboslac-Crystal-Embellished-Satin-Halter-Pump/prod200660136_cat13410734__/p.prod?icid=&searchType=EndecaDrivenCat&rte=%252Fcategory.service%253FitemId%253Dcat13410734%2526pageSize%253D30%2526No%253D0%2526Ns%253DPCS_SORT%2526refinements%253D299%252C381%252C4294910321%252C717%252C730&eItemId=prod200660136&xbcpath=cat13410734%2Ccat13030734%2Ccat000141%2Ccat000000&cmCat=product",
        price: 525,
        quantity: 3,
        currency: "USD",
        brand: "Prison Garb Inc",
        name: "Formal Strait Jacket",
        description: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
        imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ],
        options: [
          new ChoiceModel({
            label: 'Size',
            type: 'Label',
            enabledFor: Layer.client.user.id,
            choices: [
              {text:  "Small", id: "small"},
              {text:  "Medium", id: "medium"},
              {text:  "Large", id: "large"},
            ]
          }),
          new ChoiceModel({
            label: 'Color',
            type: 'Label',
            enabledFor: Layer.client.user.id,
            choices: [
              {text:  "White", id: "white"},
              {text:  "Black", id: "black"},
              {text:  "Gold", id: "gold"},
            ]
          })
        ]
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "External Content"}).send({ conversation: $("layer-conversation-view").conversation });


ReceiptModel = client.getMessageTypeModelClassForMimeType('application/vnd.layer.receipt+json')
LocationModel = client.getMessageTypeModelClassForMimeType('application/vnd.layer.location+json')
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
ProductModel = client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
new ReceiptModel({
  currency: 'USD',
  order: {
    number: 'FRODO-DODO-ONE'
  },
  paymentMethod: "VISA ****1234",
  summary: {
    subtotal: 325.67,
    shipping_cost: 350.01,
    total_tax: 0.01,
    total_cost: 350.02
  },
  shippingAddress: new LocationModel({
    city: 'San Francisco',
    name: 'Layer Inc',
    postalCode: '94107',
    administrativeArea: 'CA',
    street1: '655 4th st',
    description: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.'
  }),
  items: [
    createProductModel(),
    new ProductModel({
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
            label: 'Size',
            type: 'Label',
            choices: [
              {text:  "Small", id: "small"},
              {text:  "Medium", id: "medium"},
              {text:  "Large", id: "large"},
            ]
          }),
          new ChoiceModel({
            label: 'Color',
            type: 'Label',
            preselectedChoice: 'white',
            choices: [
              {text:  "White", id: "white"},
              {text:  "Black", id: "black"},
              {text:  "Gold", id: "gold"},
            ]
          })
        ]
    }),
    new ProductModel({
      url: "http://www.neimanmarcus.com/Manolo-Blahnik-Fiboslac-Crystal-Embellished-Satin-Halter-Pump/prod200660136_cat13410734__/p.prod?icid=&searchType=EndecaDrivenCat&rte=%252Fcategory.service%253FitemId%253Dcat13410734%2526pageSize%253D30%2526No%253D0%2526Ns%253DPCS_SORT%2526refinements%253D299%252C381%252C4294910321%252C717%252C730&eItemId=prod200660136&xbcpath=cat13410734%2Ccat13030734%2Ccat000141%2Ccat000000&cmCat=product",
      price: 525,
      quantity: 3,
      currency: "USD",
      brand: "Prison Garb Inc",
      name: "Formal Strait Jacket",
      description: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.',
      imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ],
      options: [
        new ChoiceModel({
          label: 'Size',
          type: 'Label',
          choices: [
            {text:  "Small", id: "small"},
            {text:  "Medium", id: "medium"},
            {text:  "Large", id: "large"},
          ]
        }),
        new ChoiceModel({
          label: 'Color',
          type: 'Label',
          choices: [
            {text:  "White", id: "white"},
            {text:  "Black", id: "black"},
            {text:  "Gold", id: "gold"},
          ]
        })
      ]
    }),
  ]
}).send({ conversation: $("layer-conversation-view").conversation });

ReceiptModel = Layer.Core.Client.getMessageTypeModelClass('ReceiptModel');
LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel');
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel');
CarouselModel = Layer.Core.Client.getMessageTypeModelClass('CarouselModel');

new TextModel({text: "Carousel of Receipts"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [createModel(), createModel(), createModel(), createModel()]
}).send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Button Message with Receipt"}).send({ conversation: $("layer-conversation-view").conversation });

new ButtonModel({
  buttons: [
    {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
  ],
  contentModel: createModel()
}).send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Carousel of Button Message with Receipt"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: createModel()
    }),
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: createModel()
    }),
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: createModel()
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });

