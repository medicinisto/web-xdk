/* eslint-disable */
describe("The File Drop Mixin", function() {
  beforeAll(function() {
    Layer.UI.registerComponent('filedrop-mixin-test', {
      mixins: [Layer.UI.mixins.FileDropTarget],
      properties: {
        conversation: {}
      }
    });
  });

  var el, testRoot, client, conversation;

  var imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";

  beforeEach(function() {
    jasmine.clock().install();
    called = false;
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('filedrop-mixin-test');
    testRoot.appendChild(el);

    conversation = client.createConversation({participants: ["z"]});
    el.conversation = conversation;

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (el) el.destroy();
    if (client) client.destroy();
    jasmine.clock().uninstall();
  });

  it("Should send a File Message", function() {
    spyOn(conversation, "send");
    el.onFileDrop({
      preventDefault: function() {},
      stopPropagation: function() {},
      dataTransfer: {
        files: [new Blob(["hey"], {type: "hey/ho"})]
      }
    });

    expect(conversation.send).toHaveBeenCalled();
    var message = conversation.send.calls.allArgs()[0][0];
    expect(message.getRootPart().mimeType).toEqual('application/vnd.layer.file+json');
  });

  it("Should send an Image Message", function(done) {
    spyOn(conversation, "send");
    el.onFileDrop(
      {
        preventDefault: function() {},
        stopPropagation: function() {},
        dataTransfer: {
          files: [Layer.Utils.base64ToBlob(imgBase64, "image/png")]
        }
      },
      function(message) {
        try {
          expect(message.getRootPart().mimeType).toEqual('application/vnd.layer.image+json');
          done();
        } catch(e) {
          done(e);
        }
      }
    );
  });

  it("Should send a Carousel of Files", function() {
    spyOn(conversation, "send");
    el.onFileDrop({
      preventDefault: function() {},
      stopPropagation: function() {},
      dataTransfer: {
        files: [
          new Blob(["hey"], {type: "hey1/ho1"}),
          new Blob(["ho"], {type: "hey2/ho2"})
        ]
      }
    });

    expect(conversation.send).toHaveBeenCalled();
    var message = conversation.send.calls.allArgs()[0][0];
    var carouselParts = message.getPartsMatchingAttribute({role: 'carousel-item'});
    var sourceParts = message.getPartsMatchingAttribute({role: 'source'});
    expect(message.getRootPart().mimeType).toEqual('application/vnd.layer.carousel+json');
    expect(carouselParts[0].mimeType).toEqual('application/vnd.layer.file+json');
    expect(carouselParts[1].mimeType).toEqual('application/vnd.layer.file+json');
    expect(sourceParts[0].mimeType).toEqual('hey1/ho1');
    expect(sourceParts[1].mimeType).toEqual('hey2/ho2');
  });

  it("Should send a Carousel of Images", function(done) {
    spyOn(conversation, "send");
    el.onFileDrop(
      {
        preventDefault: function() {},
        stopPropagation: function() {},
        dataTransfer: {
          files: [
            Layer.Utils.base64ToBlob(imgBase64, "image/png"),
            Layer.Utils.base64ToBlob(imgBase64, "image/png")
          ]
        }
      },
      function(message) {
        try {
          var carouselParts = message.getPartsMatchingAttribute({role: 'carousel-item'});
          var sourceParts = message.getPartsMatchingAttribute({role: 'source'});
          expect(message.getRootPart().mimeType).toEqual('application/vnd.layer.carousel+json');
          expect(carouselParts[0].mimeType).toEqual('application/vnd.layer.image+json');
          expect(carouselParts[1].mimeType).toEqual('application/vnd.layer.image+json');
          expect(sourceParts[0].mimeType).toEqual('image/png');
          expect(sourceParts[1].mimeType).toEqual('image/png');
          done();
        } catch(e) {
          done(e);
        }
      }
    );
  });
});