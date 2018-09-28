CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json')
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json')


new TextModel({text: "Simple Text Messages"}).send({ conversation: $("layer-conversation-view").conversation });

model = new CarouselModel({
  items: [
    new TextModel({text: "Carousel item 1", "title": "C 1"}),
    new TextModel({text: "Carousel item 2", "title": "C 2"}),
    new TextModel({text: "Carousel item 3", "title": "C 3"})
  ]
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Button and Choice Button Set Carousel"}).send({ conversation: $("layer-conversation-view").conversation });

ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
CarouselModel = Layer.Core.Client.getMessageTypeModelClass('CarouselModel');
model = new CarouselModel({
  items: [
    new ButtonModel({
      buttons: [
        {"type": "choice", "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}], "data": {"responseName": "satisfaction", preselectedChoice: 'dislike', allowReselect: true}},
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}},
      ],
      contentModel: new TextModel({
        text: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. ',
        title: 'The Holy Hand Grenade',
        author: 'King Arthur'
      })
    }),
    new ButtonModel({
      buttons: [
        {"type": "choice", "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}], "data": {"responseName": "satisfaction", preselectedChoice: 'dislike', allowReselect: true}},
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}},
      ],
      contentModel: new TextModel({
        text: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. ',
        title: 'The Holy Hand Grenade',
        author: 'King Arthur'
      })
    }),
    new ButtonModel({
      buttons: [
        {"type": "choice", "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}], "data": {"responseName": "satisfaction", preselectedChoice: 'dislike', allowReselect: true}},
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}},
      ],
      contentModel: new TextModel({
        text: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. ',
        title: 'The Holy Hand Grenade',
        author: 'King Arthur'
      })
    })
  ],
  action: {
    event: 'kill-arthor'
  }
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Simple Choice Button Set Carousel"}).send({ conversation: $("layer-conversation-view").conversation });

ProductModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json')
   ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
   ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new CarouselModel({
  items: [
    new ButtonsModel({
      buttons:[{
        "type":"choice",
        "choices":[
          {"text":"A","id":"a"},
          {"text":"B","id":"b"}
        ],
        "data":{
          "responseName":"q1",
          "allowReselect":true
        }
      }]
    }),
    new ButtonsModel({
      buttons:[{
        "type":"choice",
        "choices":[
          {"text":"A","id":"a"},
          {"text":"B","id":"b"}
        ],
        "data":{
          "responseName":"q1",
          "allowReselect":true
        }
      }]
    }),
    new ButtonsModel({
      buttons:[{
        "type":"choice",
        "choices":[
          {"text":"A","id":"a"},
          {"text":"B","id":"b"}
        ],
        "data":{
          "responseName":"q1",
          "allowReselect":true
        }
      }]
    }),
    new ButtonsModel({
      buttons:[{
        "type":"choice",
        "choices":[
          {"text":"A","id":"a"},
          {"text":"B","id":"b"}
        ],
        "data":{
          "responseName":"q1",
          "allowReselect":true
        }
      }]
    }),
    new ButtonsModel({
      buttons:[{
        "type":"choice",
        "choices":[
          {"text":"A","id":"a"},
          {"text":"B","id":"b"}
        ],
        "data":{
          "responseName":"q1",
          "allowReselect":true
        }
      }]
    })
  ]
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Product and Button Carousel:"}).send({ conversation: $("layer-conversation-view").conversation });

ProductModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
ImageModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.image+json')
CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json')
   ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
   ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new CarouselModel({
  items: [
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
    new ButtonsModel({
      buttons: [
        {
          "type": "choice",
          "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
          "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
        },
        {"type": "choice", "choices": [{"text": "Buy Me", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
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
            label: 'Size',
            type: 'Label',
            preselectedChoice: 'small',
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
    }),
  ]
}).send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "External Content"}).send({ conversation: $("layer-conversation-view").conversation });

  TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
CarouselModel = Layer.Core.Client.getMessageTypeModelClass('CarouselModel');
new CarouselModel({
  items: [
    new TextModel({text: "Carousel item 1", title: "Title 1"}),
    new TextModel({text: "Carousel item 2", title: "Title 2"}),
    new TextModel({text: "Carousel item 3", title: "Title 3"}),
    new TextModel({text: "Bacon ipsum dolor amet non in minim, incididunt capicola bresaola brisket exercitation commodo nulla ex chuck dolore beef ribs.  Et beef prosciutto pig pork.  Pancetta pork loin ullamco ea nostrud minim reprehenderit labore kevin, brisket est.  Short ribs nostrud ex, beef ribs dolor tenderloin swine tail.  Minim ut corned beef, prosciutto shoulder ut exercitation pig rump leberkas pork adipisicing.  Eu beef ribs aute meatball.  Pork belly sausage in sirloin excepteur laboris, non est pancetta qui leberkas anim eiusmod spare ribs.", title: "Title 4"}),
    new TextModel({text: "Carousel item 3", title: "Title 5"}),
    new TextModel({text: "Carousel item 3", title: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.'})
  ]
}).send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Carousel of Links"}).send({ conversation: $("layer-conversation-view").conversation });

LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel');
CarouselModel = Layer.Core.Client.getMessageTypeModelClass('CarouselModel');
model = new CarouselModel({
  items: [
    new LinkModel({
      title: "hey ho",
      url: "https://layer.com",
      description: "this is just a silly link message",
      imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
    }),
    new LinkModel({
      title: "hey ho",
      url: "https://layer.com",
      description: "this is just a silly link message",
      imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
    }),
    new LinkModel({
      title: "hey ho",
      url: "https://layer.com",
      description: "this is just a silly link message",
      imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
    })
  ],
  action: {
    event: 'kill-arthor'
  }
});
model.send({ conversation: $("layer-conversation-view").conversation });