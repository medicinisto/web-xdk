/* eslint-disable */
describe('Text Message Components', function() {
  var TextModel;
  var conversation;
  var testRoot;
  var client;

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

    TextModel = Layer.Core.Client.getMessageTypeModelClass("TextModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
  });


  afterEach(function() {
    Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
    if (client) {
      client.destroy();
      client = null;
    }
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
    jasmine.clock().uninstall();
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message with metadata", function() {
      var model = new TextModel({
        text: "a",
        title: "b",
        author: "c",
        subtitle: "d"
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(TextModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          text: "a",
          title: "b",
          author: "c",
          subtitle: "d"
        });
      });
    });

    it("Should create an appropriate Message without metadata", function() {
      var model = new TextModel({
        text: "a"
      });
      model.generateMessage(conversation, function(message) {
        var rootPart = message.getRootPart();
        expect(message.parts.size).toEqual(1);
        expect(rootPart.mimeType).toEqual(TextModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          text: "a"
        });
      });

    });

    it("Should instantiate a Model from a Message with metadata", function() {
      var uuid1 = Layer.Utils.generateUUID();
      var uuid2 = Layer.Utils.generateUUID();
      var m = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [{
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid2,
          mime_type: TextModel.MIMEType + '; role=root',
          body: JSON.stringify({
            text: "a",
            title: "b",
            author: "c",
            subtitle: "d"
          })
        }]
      });
      var m = new TextModel({
        message: m,
        part: m.getRootPart(),
      });
      expect(m.text).toEqual("a");
      expect(m.title).toEqual("b");
      expect(m.author).toEqual("c");
      expect(m.subtitle).toEqual("d");
    });

    it("Should instantiate a Model from a Message without metadata", function() {
      var uuid1 = Layer.Utils.generateUUID();
      var uuid2 = Layer.Utils.generateUUID();
      var m = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [{
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid2,
          mime_type: TextModel.MIMEType + '; role=root',
          body: JSON.stringify({
            text: "a"
          })
        }]
      });
      var m = new TextModel({
        message: m,
        part: m.getRootPart(),
      });
      expect(m.text).toEqual("a");
      expect(m.title).toEqual("");
      expect(m.author).toEqual("");
      expect(m.subtitle).toEqual("");
    });

    it("Should respond to Standard Message Container calls for metadata", function() {
      var model1 = new TextModel({
        text: "a",
        title: "b",
        author: "c",
        subtitle: "d"
      });
      var model2 = new TextModel({
        text: "a"
      });

      expect(model1.getTitle()).toEqual("b");
      expect(model2.getTitle()).toEqual("");

      expect(model1.getDescription()).toEqual("d");
      expect(model2.getDescription()).toEqual("");

      expect(model1.getFooter()).toEqual("c");
      expect(model2.getFooter()).toEqual("");
    });

    it("Should have a suitable one line summary", function() {
      var model1 = new TextModel({
        text: "a",
        title: "b",
        author: "c",
        subtitle: "d"
      });
      var model2 = new TextModel({
        text: "a"
      });

      expect(model1.getOneLineSummary()).toEqual("b");
      expect(model2.getOneLineSummary()).toEqual("a");
    });
  });

  describe("View Tests", function() {
    var el;
    beforeEach(function() {
      el = document.createElement('layer-text-message-view');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
    });

    it("Should render its text", function() {
      var model = new TextModel({
        text: "hello"
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.innerHTML).toEqual("<p class=\"layer-line-wrapping-paragraphs\">hello</p>");
    });

    it("Should render newline characters", function() {
      var model = new TextModel({
        text: "hello\nthere"
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.innerHTML).toEqual("<p class=\"layer-line-wrapping-paragraphs\">hello</p><p class=\"layer-line-wrapping-paragraphs\">there</p>");
    });

    it("Should render links", function() {
      var model = new TextModel({
        text: "hello from https://layer.com"
      });
      el.model = model;
      Layer.Utils.defer.flush();
      expect(el.firstChild.tagName).toEqual("P");
      expect(el.firstChild.className).toEqual("layer-line-wrapping-paragraphs");
      expect(el.firstChild.childNodes[0].textContent).toEqual("hello from ");
      expect(el.firstChild.childNodes[1].tagName).toEqual("A");
      expect(el.firstChild.childNodes[1].href).toEqual("https://layer.com/");
      expect(el.firstChild.childNodes[1].innerHTML).toEqual("layer.com");
    });

    it("Should render emoji characters", function() {
      var model = new TextModel({
        text: "hello :)"
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.innerHTML).toMatch("<p class=\"layer-line-wrapping-paragraphs\">hello <img");
    });
    it("Should render emoji codes", function() {
      var model = new TextModel({
        text: "hi :smile:"
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.innerHTML).toMatch("<p class=\"layer-line-wrapping-paragraphs\">hi <img");

    });
  });
});
