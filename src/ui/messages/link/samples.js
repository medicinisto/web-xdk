LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')

new TextModel({text: "URL Only"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "URL and empty description"}).send({ conversation: $("layer-conversation-view").conversation });

   model = new LinkModel({
    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
    description: ""
  });
  model.send({ conversation: $("layer-conversation-view").conversation });


  new TextModel({text: "URL, Image, Metadata"}).send({ conversation: $("layer-conversation-view").conversation });

 model = new LinkModel({
    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
    title: "Introducing the Layer Conversation Design System",
    imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
    description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
    author: "layer.com"
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "URL Only"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "URL and Title"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
    title: "Layer Web SDK"
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "URL title and author"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
    title: "Layer Web SDK",
    author: "Michael Kantor"
  });
  model.send({ conversation: $("layer-conversation-view").conversation });


  new TextModel({text: "Metadata but no image"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
    title: "Layer Web SDK",
    author: "Michael Kantor",
    description: "SDKs for accessing layer's services from web, mobile web and WebViews",
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "Long Title No Image"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
    title: "Layer Web SDK",
    author: "Michael Kantor",
    description: "The Layer Web SDK is a JavaScript library for adding chat services to your web application. For detailed documentation, tutorials and guides please visit our Web SDK documentation. Supported Browsers: IE 11 and Edge, Safari 7, Chrome 42 and up, Firefox 40 and up.  Older versions of Chrome and Firefox will likely work.",
  });
  model.send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "Fancy Image"}).send({ conversation: $("layer-conversation-view").conversation });

  LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
  model = new LinkModel({
    url: "https://github.com/layerhq/layer-websdk",
    title: "Layer Web SDK",
    author: "Michael Kantor",
    imageUrl: "https://78.media.tumblr.com/1b019b4237ab18f789381941eca98784/tumblr_nlmlir7Lhk1u0k6deo1_400.gif",
    description: "The Layer Web SDK is a JavaScript library for adding chat services to your web application. For detailed documentation, tutorials and guides please visit our Web SDK documentation. Supported Browsers: IE 11 and Edge, Safari 7, Chrome 42 and up, Firefox 40 and up.  Older versions of Chrome and Firefox will likely work.",
  });
  model.send({ conversation: $("layer-conversation-view").conversation });


  new TextModel({text: "External Content"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new LinkModel({
    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
    description:  'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.'
  });
  model.send({ conversation: $("layer-conversation-view").conversation });



  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel');

  new TextModel({text: "Carousel of File"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new LinkModel({
        url: "https://layer.com/introducing-the-layer-conversation-design-system/",
        title: "Introducing the Layer Conversation Design System",
        imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
        description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
        author: "layer.com"
      }),
      new LinkModel({
        url: "https://layer.com/introducing-the-layer-conversation-design-system/",
        title: "Introducing the Layer Conversation Design System",
        imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
        description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
        author: "layer.com"
      }),
      new LinkModel({
        url: "https://layer.com/introducing-the-layer-conversation-design-system/",
        title: "Introducing the Layer Conversation Design System",
        imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
        description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
        author: "layer.com"
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });


  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel');

  new TextModel({text: "Button Message with File"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new ButtonModel({
    buttons: [
      {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
    ],
    contentModel: new LinkModel({
      url: "https://layer.com/introducing-the-layer-conversation-design-system/",
      title: "Introducing the Layer Conversation Design System",
      imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
      description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
      author: "layer.com"
    })
  }).send({ conversation: $("layer-conversation-view").conversation });

  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel');
  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

  new TextModel({text: "Carousel of Button Messages with File"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LinkModel({
          url: "https://layer.com/introducing-the-layer-conversation-design-system/",
          title: "Introducing the Layer Conversation Design System",
          imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
          description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
          author: "layer.com"
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LinkModel({
          url: "https://layer.com/introducing-the-layer-conversation-design-system/",
          title: "Introducing the Layer Conversation Design System",
          imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
          description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
          author: "layer.com"
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LinkModel({
          url: "https://layer.com/introducing-the-layer-conversation-design-system/",
          title: "Introducing the Layer Conversation Design System",
          imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
          description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
          author: "layer.com"
        })
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });
