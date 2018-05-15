/* eslint-disable */
// NOTE: For simplicity we use an audioBlob instead of a much larger videoBlob for these tests
describe('Video Message Components', function() {
  var VideoModel;
  var conversation;
  var testRoot;
  var client;
  var sourceUrl = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
  var previewUrl = "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg";

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  var mp3Base64 = "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";


  var imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";

  function generateBlob(large, type) {
      if (large) imgBase64 += imgBase64;
      if (window.isPhantomJS) {
          var b = new Blob([atob(imgBase64)], {type: type});
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
          return new Blob( [view], { type: type });
      }
  }



  beforeEach(function() {
    jasmine.clock().install();
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

    VideoModel = Layer.Core.Client.getMessageTypeModelClass("VideoModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
    jasmine.clock().uninstall();
  });


  afterEach(function() {
    if (client) client.destroy();
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message with metadata", function() {
      var d = new Date().toISOString();
      var model = new VideoModel({
        title: "title",
        subtitle: "subtitle",
        artist: "artist",
        sourceUrl: sourceUrl,
        size: 55,
        duration: 66,
        mimeType: "video/mp4",
        previewUrl: previewUrl,
        previewWidth: 77,
        previewHeight: 88,
        createdAt: d,
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(VideoModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          title: "title",
          subtitle: "subtitle",
          artist: "artist",
          source_url: sourceUrl,
          size: 55,
          duration: 66,
          mime_type: "video/mp4",
          preview_url: previewUrl,
          preview_width: 77,
          preview_height: 88,
          created_at: d,
        });
      });
    });


    it("Should create an appropriate Message without metadata", function() {
      var model = new VideoModel({
        sourceUrl: "e",
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(VideoModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          source_url: "e"
        });
      });
    });


    it("Should create an appropriate Message with metadata and message parts from source", function(done) {
      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var imageBlob = generateBlob(imgBase64, "image/jpeg");
      var model = new VideoModel({
        source: audioBlob,
        preview: imageBlob,
        title: "title"
      });
      model.generateMessage(conversation, function(message) {
        try {
          expect(message.parts.size).toEqual(3);
          var rootPart = message.getRootPart();
          var sourcePart = message.getPartsMatchingAttribute({'role': 'source'})[0];
          var previewPart = message.getPartsMatchingAttribute({'role': 'preview'})[0];

          expect(rootPart.mimeType).toEqual('application/vnd.layer.video+json');
          expect(JSON.parse(rootPart.body)).toEqual({
            size: audioBlob.size,
            title: "title",
            mime_type: 'audio/mp3',
            preview_width: 128,
            preview_height: 128,
          });

          expect(sourcePart.mimeType).toEqual('audio/mp3');
          expect(sourcePart.body).toBe(audioBlob);

          expect(previewPart.mimeType).toEqual('image/jpeg');
          expect(previewPart.body).toBe(imageBlob);
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("Should instantiate a Model from a Message with metadata", function() {
      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var imageBlob = generateBlob(imgBase64, "image/jpeg");

      var uuid1 = Layer.Utils.generateUUID();
      var uuid2 = Layer.Utils.generateUUID();
      var uuid3 = Layer.Utils.generateUUID();
      var uuid4 = Layer.Utils.generateUUID();
      var m = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [{
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid2,
          mime_type: VideoModel.MIMEType + '; role=root; node-id=a',
          body: JSON.stringify({
            title: "b",
            artist: "c",
            source_url: "e",
            size: 55,
            mime_type: "audio/mp3",
          })
        }, {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid3,
          mime_type:  "audio/mp3; role=source; parent-node-id=a",
          body: audioBlob
        }, {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid4,
          mime_type:  "image/jpeg; role=preview; parent-node-id=a",
          body: imageBlob
        }]
      });
      var m = new VideoModel({
        message: m,
        part: m.findPart(),
      });

      expect(m.title).toEqual("b");
      expect(m.artist).toEqual("c");
      expect(m.sourceUrl).toEqual("e");
      expect(m.mimeType).toEqual("audio/mp3");
      expect(m.source.body).toBe(audioBlob);
      expect(m.preview.body).toBe(imageBlob);
    });

    it("Should return title sourceUrl or Video to getTitle() call", function() {
      expect(new VideoModel({
        title: "b",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getTitle()).toEqual("b");

      expect(new VideoModel({
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getTitle()).toEqual("e");

      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var model = new VideoModel({
        source: audioBlob,
        mimeType: "audio/mp3",
      });
      expect(model.getTitle()).toEqual("Video");
      model.destroy();
    });

    it("Should return subtitle, artist, duration, size or createdAt to getDescription() call", function() {
      expect(new VideoModel({
        artist: "a",
        subtitle: "subtitle",
        duration: 50,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("subtitle");

      expect(new VideoModel({
        artist: "artist",
        duration: 50,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("artist");

      expect(new VideoModel({
        duration: 50,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("00:00:50");

      expect(new VideoModel({
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("60K");
    });

    it("Should return duration or size or empty string to a getFooter() call", function() {
      var duration = 500000;
      var hours = duration / 60 / 60;
      expect(Math.floor(hours)).toEqual(138);

      expect(new VideoModel({
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("");

      expect(new VideoModel({
        duration: 50,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("60K");

      expect(new VideoModel({
        subtitle: 'subtitle',
        duration: 50,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("00:00:50");


      expect(new VideoModel({
        subtitle: 'subtitle',
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("60K");

      expect(new VideoModel({
        subtitle: 'subtitle',
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("");

      expect(new VideoModel({
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("");
    });



    it("Should have a suitable one line summary", function() {
      var model1 = new VideoModel({
        title: "b",
        artsit: "c",
        sourceUrl: "d"
      });
      model1.generateMessage(conversation);
      var model2 = new VideoModel({
        sourceUrl: "e"
      });
      model2.generateMessage(conversation);

      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var model3 = new VideoModel({
        source: audioBlob,
      });
      model3.generateMessage(conversation);

      expect(model1.getOneLineSummary()).toEqual("b");
      expect(model2.getOneLineSummary()).toEqual("e");
      expect(model3.getOneLineSummary()).toEqual("Video");
      model3.destroy();
    });
  });

  describe("Video View Tests", function() {
    var el, message;
    beforeEach(function() {
      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      if (el) el.onDestroy();
    });

    it("Should show tall preview", function() {
      var model = new VideoModel({
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 1000,
        previewHeight: 2000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
      expect(el.nodes.ui.maxHeight).toEqual(250);
      testRoot.style.width = '300px';
      el.nodes.ui._resizeContent();

      expect(el.nodes.ui.style.backgroundImage.indexOf(previewUrl)).not.toEqual("-1");
      expect(el.nodes.ui.maxHeight > 0).toBe(true);
      expect(el.nodes.ui.minWidth).toEqual(48);
      expect(el.nodes.ui.style.height).toEqual('250px')
      expect(el.nodes.ui.style.width).toEqual('125px');
    });

    it("Should show very tall but cropped preview", function() {
      var model = new VideoModel({
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 100,
        previewHeight: 1000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
      testRoot.style.width = '300px';
      el.nodes.ui._resizeContent();

      expect(el.nodes.ui.style.backgroundImage.indexOf(previewUrl)).not.toEqual("-1");
      expect(el.nodes.ui.maxHeight > 0).toBe(true);
      expect(el.nodes.ui.minWidth).toEqual(48);
      expect(el.nodes.ui.style.height).toEqual('250px')
      expect(el.nodes.ui.style.width).toEqual('48px');
    });

    it("Should show wide preview", function() {
      var model = new VideoModel({
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 2000,
        previewHeight: 1000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
      el.nodes.ui.style.height = '200px'; // Comes from style sheets not loaded
      testRoot.style.width = '300px';
      el.nodes.ui._resizeContent();

      expect(el.nodes.ui.style.backgroundImage.indexOf(previewUrl)).not.toEqual("-1");
      expect(el.nodes.ui.maxHeight > 0).toBe(true);

      expect(el.nodes.ui.style.height).toEqual('150px')
      expect(el.nodes.ui.style.width).toEqual('300px');
    });

    it("Should show very wide preview", function() {
      var model = new VideoModel({
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 2000,
        previewHeight: 100,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
      el.nodes.ui.style.height = '200px'; // Comes from style sheets not loaded
      testRoot.style.width = '300px';
      el.nodes.ui._resizeContent();

      expect(el.nodes.ui.style.backgroundImage.indexOf(previewUrl)).not.toEqual("-1");
      expect(el.nodes.ui.maxHeight > 0).toBe(true);

      expect(el.nodes.ui.style.height).toEqual('48px')
      expect(el.nodes.ui.style.width).toEqual('300px');
    });

    it("Should show black background", function() {
      var model = new VideoModel({
        sourceUrl: sourceUrl,
        previewWidth: 2000,
        previewHeight: 1000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
      el.nodes.ui.style.height = '200px'; // Comes from style sheets not loaded
      testRoot.style.width = '300px';
      el.nodes.ui._resizeContent();

      expect(el.nodes.ui.style.backgroundImage.indexOf(previewUrl)).not.toEqual("-1");
      expect(el.nodes.ui.maxHeight > 0).toBe(true);

      var styles = window.getComputedStyle(el.nodes.ui);
      expect(styles.getPropertyValue('background-image')).toEqual('none');
    });

    it("Should show metadata", function() {
      var model = new VideoModel({
        title: "title",
        artist: "artist",
        duration: 50,
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 1000,
        previewHeight: 2000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Posttest
      expect(el.querySelector('.layer-standard-card-container-title').innerText.trim()).toEqual('title');
      expect(el.querySelector('.layer-standard-card-container-description').innerText.trim()).toEqual('artist');
      expect(el.querySelector('.layer-standard-card-container-footer').innerText.trim()).toEqual('00:00:50');
    });

    it("Should open large video message", function() {
      var model = new VideoModel({
        title: "title",
        artist: "artist",
        duration: 50,
        sourceUrl: sourceUrl,
        previewUrl: previewUrl,
        previewWidth: 1000,
        previewHeight: 2000,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Run test
      click(el);
      Layer.Utils.defer.flush();

      // Posttest
      expect(document.querySelector('layer-dialog')).not.toBe(null);
      expect(document.querySelector('layer-dialog').content.tagName).toEqual('LAYER-MESSAGE-VIEWER');
      expect(document.querySelector('layer-dialog').content.model).toBe(model);

      // Cleanup
      document.querySelector('layer-dialog').destroy();
    });
  });

  describe("Large Message View", function() {
    var model, ui, el, message;
    beforeEach(function() {
      model = new VideoModel({
        sourceUrl: sourceUrl,
        mimeType: "audio/mp3",
        artist: "artist",
        subtitle: "subtitle",
        duration: 5,
        size: 5000,
        createdAt: new Date('2010-10-10T00:00:00'),
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });

      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
      CustomElements.upgradeAll(ui);

      el.size = "large"
      el.message = message;
      Layer.Utils.defer.flush();
      ui = el.nodes.ui;
      CustomElements.upgradeAll(ui);
    });

    it("Should render all sorts of metadata", function() {
      ui.style.height = '200px';
      ui.parentNode.parentNode.style.width = '300px';

      expect(ui.nodes.title.innerText.trim()).toEqual('ElephantsDream');
      expect(ui.nodes.description1.innerText.trim()).toEqual('subtitle');
      expect(ui.nodes.description2.innerText.trim()).toEqual('artist');
      expect(ui.nodes.footer1.innerText.trim()).toEqual('00:00:05');
      expect(ui.nodes.footer2.innerText.trim()).toEqual('5K');
      expect(ui.nodes.footer3.innerText.trim()).toEqual(new Date('2010-10-10T00:00:00').toLocaleString());
    });

    it("Should setup a video player", function() {
      expect(ui.nodes.player.src).toEqual(sourceUrl);
      expect(ui.nodes.player.tagName).toEqual('VIDEO');
    });
  });
});