var imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";

  FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');
  TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');

  new TextModel({text: "Source Message Part and Metadata"}).send({ conversation: $("layer-conversation-view").conversation });

  new FileModel({
    source: Layer.Utils.base64ToBlob(imgBase64, 'image/png'),
    mimeType: 'image/png',
    author: 'PNG Generator',
    size: Layer.Utils.base64ToBlob(imgBase64, 'image/png').size,
    title: 'This is a file.png',
  }).send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "Source Message Part and longer title"}).send({ conversation: $("layer-conversation-view").conversation });

  new FileModel({
    source: Layer.Utils.base64ToBlob(imgBase64, 'image/png'),
    mimeType: 'image/png',
    author: 'PNG Generator',
    size: Layer.Utils.base64ToBlob(imgBase64, 'image/png').size,
    title: 'This is a file with a longish title that you won\'t be bothered to read just yet if ever',
  }).send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "Source URL and Metadata"}).send({ conversation: $("layer-conversation-view").conversation });

  new FileModel({
    sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    mimeType: "image/png",
    title: "This is a logo for someone in silicon valley"
  }).send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "External Content"}).send({ conversation: $("layer-conversation-view").conversation });


  new FileModel({
    sourceUrl: "",
    mimeType: "image/png",
    title:  'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.',
    sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
  }).send({ conversation: $("layer-conversation-view").conversation });

  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');

new TextModel({text: "Carousel of File"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [
    new FileModel({
      sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
      mimeType: "image/png",
      title: "This is a logo for someone in silicon valley"
    }),
    new FileModel({
      sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
      mimeType: "image/png",
      title: "This is a logo for someone in silicon valley"
    }),
    new FileModel({
      sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
      mimeType: "image/png",
      title: "This is a logo for someone in silicon valley"
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });


ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');

new TextModel({text: "Button Message with File"}).send({ conversation: $("layer-conversation-view").conversation });

model = new ButtonModel({
  buttons: [
    {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
  ],
  contentModel: new FileModel({
    sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    mimeType: "image/png",
    title: "This is a logo for someone in silicon valley"
  })
}).send({ conversation: $("layer-conversation-view").conversation });

CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');
ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

new TextModel({text: "Carousel of Button Messages with File"}).send({ conversation: $("layer-conversation-view").conversation });

new CarouselModel({
  items: [
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: new FileModel({
        sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        mimeType: "image/png",
        title: "This is a logo for someone in silicon valley"
      })
    }),
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: new FileModel({
        sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        mimeType: "image/png",
        title: "This is a logo for someone in silicon valley"
      })
    }),
    new ButtonModel({
      buttons: [
        {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
      ],
      contentModel: new FileModel({
        sourceUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        mimeType: "image/png",
        title: "This is a logo for someone in silicon valley"
      })
    })
  ]
}).send({ conversation: $("layer-conversation-view").conversation });
