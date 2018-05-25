TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');

new TextModel({text: "Lat Long and Description"}).send({ conversation: $("layer-conversation-view").conversation });

model = new LocationModel({
  latitude: 37.7734858,
  longitude: -122.3916087,
  heading: 23.45,
  altitude: 35.67,
  title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
  description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
  accuracy: 0.8,
  createdAt: new Date(),
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Address and No Description"}).send({ conversation: $("layer-conversation-view").conversation });

LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
model = new LocationModel({
  city: 'San Francisco',
  title: 'Layer Inc',
  postalCode: '94107',
  administrativeArea: 'CA',
  street1: '655 4th st'
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Lat Long Only"}).send({ conversation: $("layer-conversation-view").conversation });

model = new LocationModel({
    latitude: 37.7734858,
    longitude: -122.3916087
});
model.send({ conversation: $("layer-conversation-view").conversation });


new TextModel({text: "Lat Long and Description with Buttons"}).send({ conversation: $("layer-conversation-view").conversation });

LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
ButtonsModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');
model = new ButtonsModel({
  buttons: [{"type": "action", "text": "Navigate", "event": "open-map"}],
  contentModel: new LocationModel({
    latitude: 37.7734858,
    longitude: -122.3916087,
    heading: 23.45,
    altitude: 35,
    title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
    description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
    accuracy: 0.8,
    createdAt: new Date()
  })
});
model.send({ conversation: $("layer-conversation-view").conversation });

new TextModel({text: "Address, Description and External Content"}).send({ conversation: $("layer-conversation-view").conversation });

LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
new LocationModel({
    city: 'San Francisco',
    title: 'Layer Inc',
    postalCode: '94107',
    administrativeArea: 'CA',
    street1: '655 4th st',
    description:  'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.'
  }).send({ conversation: $("layer-conversation-view").conversation });


  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');

  new TextModel({text: "Carousel of Location"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new LocationModel({
        latitude: 37.7734858,
        longitude: -122.3916087,
        heading: 23.45,
        altitude: 35.67,
        title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
        description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
        accuracy: 0.8,
        createdAt: new Date(),
      }),
      new LocationModel({
        latitude: 37.7734858,
        longitude: -122.3916087,
        heading: 23.45,
        altitude: 35.67,
        title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
        description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
        accuracy: 0.8,
        createdAt: new Date(),
      }),
      new LocationModel({
        latitude: 37.7734858,
        longitude: -122.3916087,
        heading: 23.45,
        altitude: 35.67,
        title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
        description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
        accuracy: 0.8,
        createdAt: new Date(),
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });


  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');

  new TextModel({text: "Button Message with Location"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new ButtonModel({
    buttons: [
      {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
    ],
    contentModel: new LocationModel({
      latitude: 37.7734858,
      longitude: -122.3916087,
      heading: 23.45,
      altitude: 35.67,
      title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
      description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
      accuracy: 0.8,
      createdAt: new Date(),
    })
  }).send({ conversation: $("layer-conversation-view").conversation });

  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

  new TextModel({text: "Carousel of Button Messages with Location"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LocationModel({
          latitude: 37.7734858,
          longitude: -122.3916087,
          heading: 23.45,
          altitude: 35.67,
          title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
          description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
          accuracy: 0.8,
          createdAt: new Date(),
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LocationModel({
          latitude: 37.7734858,
          longitude: -122.3916087,
          heading: 23.45,
          altitude: 35.67,
          title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
          description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
          accuracy: 0.8,
          createdAt: new Date(),
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new LocationModel({
          latitude: 37.7734858,
          longitude: -122.3916087,
          heading: 23.45,
          altitude: 35.67,
          title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
          description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
          accuracy: 0.8,
          createdAt: new Date(),
        })
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });
