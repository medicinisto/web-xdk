/* eslint-disable */
describe('File Message Components', function() {
  var FileModel;
  var conversation;
  var testRoot;
  var client;

  var imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";

  function generateBlob(large) {
      if (large) imgBase64 += imgBase64;
      if (window.isPhantomJS) {
          var b = new Blob([atob(imgBase64)], {type: "image/png"});
          b.length = large ? 12345 : 125;
          return b;
      } else {
          var imageBinary = atob(imgBase64),
              buffer = new ArrayBuffer(imageBinary.length),
              view = new Uint8Array(buffer),
              i;

          for (i = 0; i < imageBinary.length; i++) {
              view[i] = imageBinary.charCodeAt(i);
          }
          return new Blob( [view], { type: "image/png" });
      }
  }



  beforeEach(function() {
    jasmine.clock().install();
    restoreAnimatedScrollTo = Layer.UI.UIUtils.animatedScrollTo;
    spyOn(Layer.UI.UIUtils, "animatedScrollTo").and.callFake(function(node, position, duration, callback) {
      var timeoutId = setTimeout(function() {
        node.scrollTop = position;
        if (callback) callback();
      }, duration);
      return function() {
        clearTimeout(timeoutId);
      };
    });

    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });
    client._clientAuthenticated();
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';

    FileModel = Layer.Core.Client.getMessageTypeModelClass("FileModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
    jasmine.clock().uninstall();
  });


  afterEach(function() {
    if (client) client.destroy();
    Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
    jasmine.clock().uninstall();
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message with metadata", function() {
      var model = new FileModel({
        title: "b",
        author: "c",
        sourceUrl: "e",
        size: 55,
        mimeType: "image/jpeg",
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(FileModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          title: "b",
          author: "c",
          source_url: "e",
          size: 55,
          mime_type: "image/jpeg",
        });
      });
    });


    it("Should create an appropriate Message without metadata", function() {
      var model = new FileModel({
        sourceUrl: "e",
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(FileModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          source_url: "e"
        });
      });
    });


    it("Should create an appropriate Message with metadata and message parts from source", function(done) {
      var blob = generateBlob(imgBase64);
      var model = new FileModel({
        source: blob,
        title: "title"
      });
      model.generateMessage(conversation, function(message) {
        try {
          expect(message.parts.size).toEqual(2);
          var rootPart = message.getRootPart();
          var sourcePart = message.getPartsMatchingAttribute({'role': 'source'})[0];
          expect(rootPart.mimeType).toEqual('application/vnd.layer.file+json');
          expect(JSON.parse(rootPart.body)).toEqual({
            size: blob.size,
            title: "title",
            mime_type: 'image/png',
          });
          expect(sourcePart.mimeType).toEqual('image/png');
          expect(sourcePart.body).toBe(blob);
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("Should instantiate a Model from a Message with metadata", function() {
      var blob = generateBlob(imgBase64);
      var uuid1 = Layer.Utils.generateUUID();
      var uuid2 = Layer.Utils.generateUUID();
      var uuid3 = Layer.Utils.generateUUID();
      var m = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [{
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid2,
          mime_type: FileModel.MIMEType + '; role=root; node-id=a',
          body: JSON.stringify({
            title: "b",
            author: "c",
            source_url: "e",
            size: 55,
            mime_type: "image/jpeg",
          })
        }, {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid3,
          mime_type:  "image/png; role=source; parent-node-id=a",
          body: blob
        }]
      });
      var m = new FileModel({
        message: m,
        part: m.findPart(),
      });

      expect(m.title).toEqual("b");
      expect(m.author).toEqual("c");
      expect(m.sourceUrl).toEqual("e");
      expect(m.mimeType).toEqual("image/jpeg");
      expect(m.source.body).toBe(blob);
    });

    it("Should instantiate a Model from a Message without metadata", function() {
      var m = conversation.createMessage({
        parts: [{
          mimeType: FileModel.MIMEType + '; role=root',
          body: JSON.stringify({
            source_url: "a"
          })
        }]
      });
      var m = new FileModel({
        message: m,
        part: m.findPart(),
      });
      expect(m.title).toEqual("");
      expect(m.author).toEqual("");
      expect(m.sourceUrl).toEqual("a");
      expect(m.mimeType).toEqual("");
    });

    it("Should respond to Standard Message Container calls for metadata", function() {
      var model1 = new FileModel({
        title: "b",
        author: "c",
        sourceUrl: "e",
        size: 55,
        mimeType: "image/jpeg",
      });
      var model2 = new FileModel({
        sourceUrl: "e"
      });

      expect(model1.getTitle()).toEqual("b");
      expect(model2.getTitle()).toEqual("");

      expect(model1.getDescription()).toEqual("c");
      expect(model2.getDescription()).toEqual("");

      expect(model1.getFooter()).toEqual('0K');
      expect(model2.getFooter()).toEqual("");
    });

    it("Should have a suitable one line summary", function() {
      var model1 = new FileModel({
        title: "b",
        author: "c",
        subtitle: "d",
        sourceUrl: "e"
      });
      model1.generateMessage(conversation);
      var model2 = new FileModel({
        sourceUrl: "e"
      });
      model2.generateMessage(conversation);

      expect(model1.getOneLineSummary()).toEqual("b");
      expect(model2.getOneLineSummary()).toEqual("File");
    });
  });

  describe("View Tests", function() {
    var el, message;
    beforeEach(function() {
      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
    });

    it("Should render sourceUrl alone", function() {
      var model = new FileModel({
        sourceUrl: "https://s3.amazonaws.com/static.layer.com/sdk/sampleavatars/0.png",
        mimeType: "image/png"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Message Viewer: gets the layer-card-width-any-width class
      expect(el.classList.contains('layer-card-width-flex-width')).toBe(true);

      // Container: hide metadata
      expect(el.nodes.cardContainer.classList.contains('layer-card-no-metadata')).toEqual(true);

      // Message UI: contains anchor tag
      expect(el.nodes.ui.classList.contains('layer-file-image-png')).toBe(true);
    });


    it("Should render source alone", function() {
      var blob = generateBlob(imgBase64);
      var model = new FileModel({
        source: blob,
        mimeType: "image/png"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });

      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Message Viewer: gets the layer-card-width-any-width class
      expect(el.classList.contains('layer-card-width-flex-width')).toBe(true);

      // Message UI: contains anchor tag
      expect(el.nodes.ui.classList.contains('layer-file-image-png')).toBe(true);
    });

    it("Should render sourceUrl and title", function() {
      var model = new FileModel({
        sourceUrl: "https://s3.amazonaws.com/static.layer.com/sdk/sampleavatars/0.png",
        title: "Picture here",
        mimeType: "image/png"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Message Viewer: gets the layer-card-width-flex-width class
      expect(el.classList.contains('layer-card-width-flex-width')).toBe(true);

      // Container: show metadata
      expect(el.nodes.cardContainer.classList.contains('layer-card-no-metadata')).toEqual(false);
      expect(el.querySelector(' .layer-standard-card-container-title').innerText.trim()).toEqual('Picture here');

      // Message UI: contains anchor tag
      expect(el.nodes.ui.classList.contains('layer-file-image-png')).toBe(true);

    });

    it("Should open the image using the sourceUrl", function() {
      var tmp = Layer.UI.UIUtils.showFullScreen;
      spyOn(Layer.UI.UIUtils, "showFullScreen");
      var model = new FileModel({
        sourceUrl: "https://s3.amazonaws.com/static.layer.com/sdk/sampleavatars/0.png",
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      expect(model.actionEvent).toEqual('open-file');
      el._runAction({});
      expect(Layer.UI.UIUtils.showFullScreen).toHaveBeenCalledWith("https://s3.amazonaws.com/static.layer.com/sdk/sampleavatars/0.png");

      // Restore
      Layer.UI.UIUtils.showFullScreen = tmp;
    });

    it("Should open the link using Blob url", function(done) {
      var tmp = Layer.UI.UIUtils.showFullScreen;
      spyOn(Layer.UI.UIUtils, "showFullScreen");
      var blob = generateBlob(imgBase64);

      var model = new FileModel({
        source: blob
      });
      model.generateMessage(conversation, function(m) {
        try {
          message = m;

          el.client = client;
          el.message = message;
          Layer.Utils.defer.flush();

          expect(model.actionEvent).toEqual('open-file');
          el._runAction({});
          expect(Layer.UI.UIUtils.showFullScreen.calls.argsFor(0)[0]).toMatch(/^blob\:/);
          done();
        } catch(e) {
          done(e);
        }

        // Restore
      Layer.UI.UIUtils.showFullScreen = tmp;
      });
    });
  });
});
