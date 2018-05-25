imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";

  ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel');
  TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');

  new TextModel({text: "Source Message Part and Metadata"}).send({ conversation: $("layer-conversation-view").conversation });

  new ImageModel({
    source: Layer.Utils.base64ToBlob(imgBase64, 'image/png'),
    artist: 'PNG Generator',
    size: Layer.Utils.base64ToBlob(imgBase64, 'image/png').size,
    title: 'This is an image',
    subtitle: 'A beautiful image full of many many glorious pixels',
    width: 128,
    height: 128,
  }).send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "source_url and Metadata"}).send({ conversation: $("layer-conversation-view").conversation });

  new ImageModel({
    sourceUrl: "https://78.media.tumblr.com/1b019b4237ab18f789381941eca98784/tumblr_nlmlir7Lhk1u0k6deo1_400.gif",
    artist: "Monty Python",
    title: "Tis only a flesh wound",
    subtitle: "Your arm's off!"
  }).send({ conversation: $("layer-conversation-view").conversation });

  new TextModel({text: "Source url and External Content"}).send({ conversation: $("layer-conversation-view").conversation });

new ImageModel({
    sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
    title: 'this is a long subtitle',
    subtitle:  'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.  And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.'
  }).send({ conversation: $("layer-conversation-view").conversation });


  // Test image is shorter and narrower than available space, but more wide than tall
  img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAA4UlEQVR42u3TMQ0AAAjAMIIa/MvjAQO8fD1qYMmiKwe4hQhgEDAIGAQMAgYBg4BBwCBgEMAgYBAwCBgEDAIGAYOAQcAgYBAhwCBgEDAIGAQMAgYBg4BBwCCAQcAgYBAwCBgEDAIGAYOAQcAggEHAIGAQMAgYBAwCBgGDgEEAg4BBwCBgEDAIGAQMAgYBg4BBAIOAQcAgYBAwCBgEDAIGAYMABgGDgEHAIGAQMAgYBAwCBgGDAAYBg4BBwCBgEDAIGAQMAgYBg4gABgGDgEHAIGAQMAgYBAwCBgEMAgYBg8CnBfHt+BvKmDEFAAAAAElFTkSuQmCC', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 200,
    height: 100,
    title: "Smaller than card but wider than tall"
  }).send({ conversation: $("layer-conversation-view").conversation });

  // Test image is shorter and narrower than available space, but more tall than wide
img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAGQAAACgCAYAAAD6m8n2AAAA+ElEQVR42u3RIREAAAgAMY409I+HgQhYxMQX+EVXjv4UJgARECACAkRAgAgIECOACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiAADEBiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAA0dUCqb+TTA4q67EAAAAASUVORK5CYII=', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 100,
    height: 160,
    title: "Smaller than card but taller than wide"
  }).send({ conversation: $("layer-conversation-view").conversation });

  // Test image is taller than available space and narrower than available space
img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAGQAAAGQCAYAAABYlsXvAAACO0lEQVR42u3RIREAAAgAMY409I+HgQpIxMQX+EVXjv4UJgARECACAkRAgAgIECOACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiACAgQAQEiIEAEBIiAADEBiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAIiIAAERAgAgJEQIAICBATgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAgIEAEBIiBABASIgAAxAYiAABEQIAICRECAGAFEQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAREQIAICBABASIgQAQEiAlABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIbi0xKPBEOUSsQgAAAABJRU5ErkJggg==', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 100,
    height: 400,
    title: "Taller than card but narrower than card"
  }).send({ conversation: $("layer-conversation-view").conversation });


  // Test image is shorter than available space and wider than available space
img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAABOUlEQVR42u3VIREAAAgAMY409I+HgQwI3MQKvPnoygGAqxABAAMBwEAAMBAADAQADAQAAwHAQAAwEAAMBAAMBAADAcBAADAQAAwEAAwEAAMBwEAAMBAADAQADAQAAwHAQAAwEAAMBAAMBAADAcBAADAQAAwEAAwEAAMBwEAAMBAADAQADAQAAwHAQAAwEAAwEAAMBAADAcBAADAQADAQAAwEAAMBwEAAMBAAMBAADAQAAwHAQAAwEAAwEAAMBAADAcBAADAQADAQAAwEAAMBwEAAMBAAMBAADAQAAwHAQAAwEAAwEAAMBAADAcBAADAQEQAwEAAMBAADAcBAAMBAADAQAAwEAAMBwEAAwEAAMBAADAQAAwHAQADAQAAwEAAMBAADAcBAAMBAADAQAAwEAAMBwEAAwEAA+LFgd/BENFnevQAAAABJRU5ErkJggg==', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 400,
    height: 100,
    title: "Wider than card but shorter than card"
  }).send({ conversation: $("layer-conversation-view").conversation });

  // Test image is wider and taller than available space, but much taller than wide
img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAyAAAAGQCAYAAABWJQQ0AAAHJ0lEQVR42u3XIREAAAgAMY409I+HgRSgJlbg3UdXDgAAwIcQAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAA7i0k6IKC1Z+b/AAAAABJRU5ErkJggg==', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 400,
    height: 800,
    title: "Wider and taller than card but much taller than wide"
  }).send({ conversation: $("layer-conversation-view").conversation });

  // Test image is wider and taller than available space, but much wider than tall
img = Layer.Utils.base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAyAAAAGQCAYAAABWJQQ0AAAHJ0lEQVR42u3XIREAAAgAMY409I+HgRSgJlbg3UdXDgAAwIcQAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAAAABgQAADAgAAAABgQAADAgAAAAAYEAADAgAAAAAYEAADAgAAAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAgAERAQAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAADAgAAGBAAAAADAgAAGBAAAAAAwIAAGBAAAAAAwIAAGBAAAAAAwIAABgQAAAAAwIAABgQAAAAAwIAABgQAADAgAgBAAAYEAAAwIAAAAAYEAAAwIAAAAAYEAAAwIAAAAAGBAAAwIAAAAAGBAAAwIAAAAAGBAAAMCAAAAAGBAAAMCAAAAAGBAAAMCAAAIABAQAAMCAAAIABAQAAMCAAAIABAQAADAgAAIABAQAADAgAAIABAQAADAgAAGBAAAAA7i0k6IKC1Z+b/AAAAABJRU5ErkJggg==', 'image/png')
  new ImageModel({
    source: img,
    size: img.size,
    width: 800,
    height: 400,
    title: "Wider and taller than card but much wider than tall"
  }).send({ conversation: $("layer-conversation-view").conversation });



  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel');

  new TextModel({text: "Carousel of File"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new ImageModel({
        sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
        title: 'this is a long subtitle',
        width: 1505,
        height: 846,
      }),
      new ImageModel({
        sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
        title: 'this is a long subtitle',
        width: 1505,
        height: 846,
      }),
      new ImageModel({
        sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
        title: 'this is a long subtitle',
        width: 1505,
        height: 846,
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });


  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel');

  new TextModel({text: "Button Message with File"}).send({ conversation: $("layer-conversation-view").conversation });

  model = new ButtonModel({
    buttons: [
      {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
    ],
    contentModel: new ImageModel({
      sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
      title: 'this is a long subtitle',
      width: 1505,
      height: 846,
    })
  }).send({ conversation: $("layer-conversation-view").conversation });

  CarouselModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.carousel+json');
  TextModel = Layer.client.getMessageTypeModelClassForMimeType('application/vnd.layer.text+json');
  ImageModel = Layer.Core.Client.getMessageTypeModelClass('ImageModel');
  ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel')

  new TextModel({text: "Carousel of Button Messages with File"}).send({ conversation: $("layer-conversation-view").conversation });

  new CarouselModel({
    items: [
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new ImageModel({
          sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
          title: 'this is a long subtitle',
          width: 1505,
          height: 846,
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new ImageModel({
          sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
          title: 'this is a long subtitle',
          width: 1505,
          height: 846,
        })
      }),
      new ButtonModel({
        buttons: [
          {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"}
        ],
        contentModel: new ImageModel({
          sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg",
          title: 'this is a long subtitle',
          width: 1505,
          height: 846,
        })
      })
    ]
  }).send({ conversation: $("layer-conversation-view").conversation });
