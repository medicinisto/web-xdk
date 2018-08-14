/* eslint-disable */
describe('Audio Message Components', function() {
  var AudioModel;
  var conversation;
  var testRoot;
  var client;
  var realAudio;
  var currentOnError;

  beforeAll(function() {
    realAudio = window.Audio;
    window.Audio = function(src) {
      this.paused = true;
      this.pause = function() { this.paused = true;}
      this.play = function() { this.paused = false;}
      this._events = [];
      this.addEventListener = function(name, fn) {
        this._events.push({name: name, fn: fn});
      };
      this.src = src;
    };
    Object.defineProperty(window.Audio.prototype, "src", {
      get: function(value) {
        return this.__src || "";
      },
      set: function(value) {
        this.__src = value;
        setTimeout(function() {
          if (value === "https://google.com") {
            this._events.filter(function(event) {
              return event.name === "error";
            }).forEach(function(event) {
              event.fn({});
            });
          } else if (value) {
            this._events.filter(function(event) {
              return ["durationchange", "canplay"].indexOf(event.name) !== -1;
            }).forEach(function(event) {
              event.fn({});
            });
          }
        }.bind(this), 100);
      }
    });
  });

  afterAll(function() {
    window.Audio = realAudio;
  });

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);
    } else if (el instanceof SVGElement) {
      var evt = new Event('click', { bubbles: true });
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

    AudioModel = Layer.Core.Client.getMessageTypeModelClass("AudioModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
  });


  afterEach(function() {
    jasmine.clock().uninstall();
    currentOnError = null;
    if (client) client.destroy();
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message with metadata", function() {
      var model = new AudioModel({
        title: "b",
        artist: "c",
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        size: 55,
        duration: 66,
        mimeType: "audio/mp3",
        previewUrl: "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg",
        previewWidth: 77,
        previewHeight: 88
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(AudioModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          title: "b",
          artist: "c",
          source_url: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
          size: 55,
          duration: 66,
          mime_type: "audio/mp3",
          preview_url: "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg",
          preview_width: 77,
          preview_height: 88
        });
      });
    });


    it("Should create an appropriate Message without metadata", function() {
      var model = new AudioModel({
        sourceUrl: "e",
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(AudioModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          source_url: "e"
        });
      });
    });


    it("Should create an appropriate Message with metadata and message parts from source", function(done) {
      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var imageBlob = generateBlob(imgBase64, "image/jpeg");
      var model = new AudioModel({
        source: audioBlob,
        preview: imageBlob,
        title: "title"
      });
      debugger;
      model.generateMessage(conversation, function(message) {
        try {
          expect(message.parts.size).toEqual(3);
          var rootPart = message.getRootPart();
          var sourcePart = message.getPartsMatchingAttribute({'role': 'source'})[0];
          var previewPart = message.getPartsMatchingAttribute({'role': 'preview'})[0];

          expect(rootPart.mimeType).toEqual('application/vnd.layer.audio+json');
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
      jasmine.clock().tick(200);
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
          mime_type: AudioModel.MIMEType + '; role=root; node-id=a',
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
      var m = new AudioModel({
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

    it("Should return title sourceUrl or Audio Message to getTitle() call", function() {
      expect(new AudioModel({
        title: "b",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getTitle()).toEqual("b");

      expect(new AudioModel({
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getTitle()).toEqual("e");

      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var model = new AudioModel({
        source: audioBlob,
        mimeType: "audio/mp3",
      });
      expect(model.getTitle()).toEqual("Audio Message");
      model.destroy();
    });

    it("Should return title artist album or genre to getDescription() call", function() {
      expect(new AudioModel({
        artist: "a",
        album: "b",
        genre: "c",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("a");

      expect(new AudioModel({
        album: "b",
        genre: "c",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("b");

      expect(new AudioModel({
        genre: "c",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("c");

      expect(new AudioModel({
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toEqual("");
    });

    it("Should return duration or size to a getFooter() call", function() {
      var duration = 500000;
      var hours = duration / 60 / 60;
      expect(Math.floor(hours)).toEqual(138);

      expect(new AudioModel({
        artist: "artist",
        duration: duration,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toMatch(/138.*:\d\d:\d\d/);

      expect(new AudioModel({
        artist: "artist",
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("59K");

      expect(new AudioModel({
        artist: "artist",
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("");

      // Special case where duration is promoted up to description
      expect(new AudioModel({
        duration: duration,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getFooter()).toEqual("59K");

      expect(new AudioModel({
        duration: duration,
        size: 60000,
        sourceUrl: "a/b/c/e.mp3",
        mimeType: "audio/mp3",
      }).getDescription()).toMatch(/138.*:\d\d:\d\d/);
    });



    it("Should have a suitable one line summary", function() {
      var model1 = new AudioModel({
        title: "b",
        artsit: "c",
        sourceUrl: "d"
      });
      model1.generateMessage(conversation);
      var model2 = new AudioModel({
        sourceUrl: "e"
      });
      model2.generateMessage(conversation);

      var audioBlob = generateBlob(mp3Base64, "audio/mp3");
      var model3 = new AudioModel({
        source: audioBlob,
      });
      model3.generateMessage(conversation);

      expect(model1.getOneLineSummary()).toEqual("b");
      expect(model2.getOneLineSummary()).toEqual("e");
      expect(model3.getOneLineSummary()).toEqual("Audio Message");
      model3.destroy();
    });
  });

  describe("Audio View Tests", function() {
    var el, message;
    beforeEach(function() {
      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      if (el) el.onDestroy();
    });

    it("Should setup an audio object", function() {
      var model = new AudioModel({
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      expect(el.nodes.ui.properties.audio).toEqual(jasmine.any(window.Audio));
      expect(el.nodes.ui.properties.audio.src).toEqual("http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3");
    });


    it("Should render previewUrl as a tall image", function() {
      var model = new AudioModel({
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        previewUrl: "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg",
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
      el.nodes.ui.style.height = '200px';
      el.nodes.ui.parentNode.parentNode.style.width = '300px';
      el.nodes.ui._setupPreview();

      expect(el.nodes.ui.nodes.preview.style.backgroundImage.indexOf("https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg")).not.toEqual("-1");
      expect(el.nodes.ui.nodes.preview.style.height).toEqual(el.nodes.ui.maxHeight + 'px');
      expect(el.nodes.ui.nodes.preview.style.width).toEqual(Math.max(el.nodes.ui.minWidth, (100 * el.nodes.ui.maxHeight / 1000)) + 'px');

      expect(el.nodes.ui.classList.contains('layer-audio-preview')).toBe(true);
      expect(el.nodes.ui.classList.contains('layer-file-audio')).toBe(false);
    });

    it("Should render preview as a wide image", function(done) {
      var imageBlob = generateBlob(imgBase64, "image/jpeg");
      var model = new AudioModel({
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        preview: imageBlob,
        previewWidth: 1000,
        previewHeight: 100,
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        try {
          model.previewWidth = 1000; // these values get blown away by imageBlob's dimensions
          model.previewHeight = 100;
          message = m;

          el.message = message;

          Layer.Utils.defer.flush();

          el.nodes.ui.style.height = '200px';
          el.nodes.ui.parentNode.parentNode.style.width = '300px';
          el.nodes.ui._setupPreview();

          var sizes = el.nodes.ui.getBestDimensions({
            contentWidth: model.previewWidth,
            contentHeight: model.previewHeight,
            maxWidth: el.nodes.ui.maxWidth,
            maxHeight: el.nodes.ui.maxHeight
          });
          expect(sizes.height * 10).toEqual(sizes.width);

          expect(el.nodes.ui.nodes.preview.style.backgroundImage).not.toEqual('');
          expect(el.nodes.ui.nodes.preview.style.height).toEqual(sizes.height + 'px');
          expect(el.nodes.ui.nodes.preview.style.width).toEqual(sizes.width + 'px');

          expect(el.nodes.ui.classList.contains('layer-audio-preview')).toBe(true);
          expect(el.nodes.ui.classList.contains('layer-file-audio')).toBe(false);
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("Should render file icon if no preview", function() {
      var imageBlob = generateBlob(imgBase64, "image/jpeg");
      var model = new AudioModel({
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        mimeType: "audio/mp3"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });

      el.message = message;

      Layer.Utils.defer.flush();

      expect(el.nodes.ui.classList.contains('layer-audio-preview')).toBe(false);
      expect(el.nodes.ui.classList.contains('layer-file-audio')).toBe(true);
    });

    describe("Standard Audio View Tests", function() {
      var model, ui, el, message;
      beforeEach(function(done) {
        model = new AudioModel({
          sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
          mimeType: "audio/mp3"
        });
        model.generateMessage(conversation, function(m) {
          message = m;
        });

        el = document.createElement('layer-message-viewer');
        testRoot.appendChild(el);

        el.message = message;

        Layer.Utils.defer.flush();
        ui = el.nodes.ui;
        ui.style.height = '200px';
        ui.parentNode.parentNode.style.width = '300px';
        var triggered = false;
        ui.properties.audio.addEventListener('canplay', function(evt) {
          if (!triggered) {
            triggered = true;
            done();
          }
        });
        jasmine.clock().tick(200);
      });
      afterEach(function() {
        if (el) el.onDestroy();
      });

      it("The play button should toggle the playing property", function() {
        // Pretest
        expect(el.contains(ui.properties.playButton)).toBe(true);
        expect(ui.properties.playButton).toEqual(jasmine.any(SVGElement));
        expect(ui.playing).toBe(false);

        // Run
        click(ui.properties.playButton);
        expect(ui.playing).toBe(true);
      });

      it("The play button should prevent runAction from being called", function() {
        spyOn(ui, "runAction");
        click(ui.properties.playButton);
        expect(ui.runAction).not.toHaveBeenCalled();
      });

      it("Should show the broken play button if content is not playable", function() {
        ui.model.sourceUrl = ui.properties.audio.src = 'https://google.com';
        jasmine.clock().tick(200);
        expect(ui.messageViewer.classList.contains('layer-audio-not-playable')).toBe(true);
      });

      it("Should render progress", function() {
        var audio = ui.properties.audio;
        ui.properties.audio = {currentTime: 2, duration: 5};
        ui.renderProgressBar();
        expect(ui.nodes.progressBar.style.width).toEqual(Math.round(100 * 2 / 5) + '%');
        ui.properties.audio = audio;

      });

      xit("Should render buffering", function() {

      });

      it("Should handle setting playing to true and false", function() {
        // Pretest
        expect(ui.playing).toBe(false);
        expect(el.classList.contains('layer-audio-playing')).toBe(false);
        expect(ui.properties.audio.paused).toBe(true);

        // Run 1
        ui.playing = true;

        // Posttest 1
        expect(ui.playing).toBe(true);
        expect(el.classList.contains('layer-audio-playing')).toBe(true);

        // Run 2
        ui.playing = false;

        // Posttest 2
        expect(ui.playing).toBe(false);
        expect(el.classList.contains('layer-audio-playing')).toBe(false);
      });

      it("Should pause playback and open Large Message View on tap", function() {
        ui.playing = true;
        expect(ui.properties.playing).toBe(true);
        click(el);
        expect(ui.playing).toBe(false);
        expect(document.querySelector('layer-dialog')).not.toBe(null);
        document.querySelector('layer-dialog').destroy();
      });
    });
  });

  describe("Large Message View", function() {
    var model, ui, el, message;
    beforeEach(function() {
      model = new AudioModel({
        sourceUrl: "http://www.mpgedit.org/mpgedit/testdata/mpeg1/layer3/compl.mp3",
        mimeType: "audio/mp3",
        artist: "artist",
        album: "album",
        genre: "genre",
        duration: 5,
        size: 5000
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });

      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
      CustomElements.upgradeAll(el);

      el.size = "large"
      el.message = message;
      Layer.Utils.defer.flush();
      ui = el.nodes.ui;
      CustomElements.upgradeAll(ui);
      ui.classList.remove('show-audio-file-icon');
    });

    it("Should render all sorts of metadata", function() {
      ui.style.height = '200px';
      ui.parentNode.parentNode.style.width = '300px';
      ui.onAfterCreate();

      expect(ui.nodes.title.innerText.trim()).toEqual('compl');
      expect(ui.nodes.description1.innerText.trim()).toEqual('artist');
      expect(ui.nodes.description2.innerText.trim()).toEqual('album');
      expect(ui.nodes.description3.innerText.trim()).toEqual('genre');
      expect(ui.nodes.footer1.innerText.trim()).toEqual('00:00:05');
      expect(ui.nodes.footer2.innerText.trim()).toEqual('5K');
    });

    it("Should render file icon", function() {
      // Setup
      ui.style.height = '200px';
      ui.parentNode.parentNode.style.width = '300px';
      ui.onAfterCreate();

      // Posttest
      expect(ui.classList.contains('show-audio-file-icon')).toBe(true);
    });

    it("Should render tall preview", function() {
      // Setup
      model.previewUrl = "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg";
      model.previewWidth = 100;
      model.previewHeight = 1000;
      ui.onAfterCreate();

      ui.style.height = '200px';
      ui.parentNode.parentNode.style.width = '300px';

      // Posttest
      expect(ui.nodes.preview.style.height).toEqual(ui.maxPreviewHeight + 'px');
      expect(ui.nodes.preview.style.width).toEqual((ui.maxPreviewHeight / 10) + 'px');
      expect(ui.classList.contains('show-audio-file-icon')).toBe(false);
    });

    it("Should render wide preview", function() {
      // Setup
      model.previewUrl = "https://is3-ssl.mzstatic.com/image/thumb/Music6/v4/be/44/89/be4489a2-4562-a8c9-97dc-500ea98081cb/audiomachine17.jpg/600x600bf.jpg";
      model.previewWidth = 1000;
      model.previewHeight = 100;
      ui.onAfterCreate();

      ui.style.height = '200px';
      ui.parentNode.parentNode.style.width = '300px';

      // Posttest
      expect(ui.nodes.preview.style.width).toEqual(ui.maxPreviewWidth + 'px');
      expect(ui.nodes.preview.style.height).toEqual((ui.maxPreviewWidth / 10) + 'px');
      expect(ui.classList.contains('show-audio-file-icon')).toBe(false);
    });
  });
});