/* eslint-disable */
describe('Response Message Components', function() {
  var ResponseModel, StatusModel;
  var conversation;
  var testRoot;
  var uuidPart, uuidMessage;
  var responseToMessage;
  var client;
  var op1;
  var op1Serialized;

  beforeEach(function() {
    uuidMessage = Layer.Utils.generateUUID();
    uuidPart = Layer.Utils.generateUUID();

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

    ResponseModel = Layer.Core.Client.getMessageTypeModelClass("ResponseModel");
    StatusModel = Layer.Core.Client.getMessageTypeModelClass("StatusModel");

    responseToMessage = conversation.createMessage("hello");
    responseToMessage.presend();

    op1 = new Layer.Core.CRDT.Changes({
      id: 'aaaaaa',
      name: 'state1',
      oldValue: 1,
      value: 2,
      operation: 'add',
      type: 'FWW',
      userId: client.user.userId,
    });
    op1Serialized = {
      operation: 'add',
      type: 'FWW',
      value: 2,
      name: 'state1',
      id: 'aaaaaa',
    };

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
    it("Should reject calls to addOperation if it already has a message", function() {
      var rootResponsePart = responseToMessage.getRootPart();
      var model = new ResponseModel({
        responseTo: rootResponsePart.id,
        displayModel: new StatusModel({text: "howdy"}),
      });
      model.addOperations([op1]);

      var message;
      model.generateMessage(conversation, function(m) { message = m; });
      expect(function() {
        model.addOperations([op1]);
      }).toThrowError(Layer.Core.LayerError.ErrorDictionary.useBeforeMessageCreation);
      expect(Layer.Core.LayerError.ErrorDictionary.useBeforeMessageCreation).toEqual(jasmine.any(String));
    });

    it("Should create an appropriate Message with a display", function() {
      var rootResponsePart = responseToMessage.getRootPart();
      var model = new ResponseModel({
        responseTo: rootResponsePart.id,
        displayModel: new StatusModel({text: "howdy"}),
      });
      model.addOperations([op1]);


      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(2);
        var rootPart = message.getRootPart();
        var textPart = message.findPart(function(part) {
          return part.role === 'status';
        });
        expect(rootPart.mimeType).toEqual(ResponseModel.MIMEType);
        expect(textPart.mimeType).toEqual(StatusModel.MIMEType);

        expect(JSON.parse(rootPart.body)).toEqual({
          response_to: rootResponsePart.id,
          changes: [op1Serialized]
        });

        expect(JSON.parse(textPart.body)).toEqual({
          text: "howdy"
        });
      });
    });

    it("Should create an appropriate Message without a display", function() {
      var rootResponsePart = responseToMessage.getRootPart();

      var model = new ResponseModel({
        responseTo: rootResponsePart.id,
      });
      model.addOperations([op1]);

      model.generateMessage(conversation, function(message) {
        var rootPart = message.getRootPart();
        expect(message.parts.size).toEqual(1);
        expect(rootPart.mimeType).toEqual(ResponseModel.MIMEType);

        expect(JSON.parse(rootPart.body)).toEqual({
          response_to: rootResponsePart.id,
          changes: [op1Serialized]
        });
      });
    });


    it("Should instantiate a Model from a Message with a display", function() {
      var message = conversation.createMessage({
        parts: [
          {
            mimeType: ResponseModel.MIMEType + '; role=root; node-id=' + uuidPart,
            body: JSON.stringify({
              response_to: uuidMessage,
              changes: [op1Serialized],
            })
          },
          {
            mimeType: StatusModel.MIMEType + '; role=message; parent-node-id=' + uuidPart,
            body: JSON.stringify({text: "ho hum"})
          }
        ]
      });
      var model = new ResponseModel({
        message: message,
        part: message.getRootPart(),
      });
      expect(model.responseTo).toEqual(uuidMessage);
      //expect(model.changes).toEqual([jasmine.any(Layer.CRDT.Changes)]);
      expect(model.displayModel.text).toEqual("ho hum");
    });

    it("Should instantiate a Model from a Message without a display", function() {
      var m = conversation.createMessage({
        parts: [
          {
            mimeType: ResponseModel.MIMEType + '; role=root; node-id=' + uuidPart,
            body: JSON.stringify({
              response_to: uuidMessage,
              changes: [op1Serialized],
            })
          }
        ]
      });
      var m = new ResponseModel({
        message: m,
        part: m.getRootPart(),
      });
      expect(m.responseTo).toEqual(uuidMessage);
      //expect(model.changes).toEqual([jasmine.any(Layer.CRDT.Changes)]);
      expect(m.displayModel).toBe(null);
    });

    it("Should have a suitable one line summary", function() {
      var rootResponsePart = responseToMessage.getRootPart();

      var model1 = new ResponseModel({
        responseTo: rootResponsePart.id,
        changes: [op1Serialized],
        displayModel: new StatusModel({text: "howdy"}),
      });

      var model2 = new ResponseModel({
        responseTo: rootResponsePart.id,
        changes: [op1Serialized],
      });

      expect(model1.getOneLineSummary()).toEqual("howdy");
      expect(model2.getOneLineSummary()).toEqual("");
    });
  });

  describe("View Tests", function() {
    var el;
    beforeEach(function() {
      el = document.createElement('layer-response-message-view');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
    });

    it("Should render its displayModel", function() {
      var rootResponsePart = responseToMessage.getRootPart();

      var model = new ResponseModel({
        responseTo: rootResponsePart.id,
        changes: [op1Serialized],
        displayModel: new StatusModel({text: "howdy"}),
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.firstChild.tagName).toEqual("LAYER-MESSAGE-VIEWER");
      expect(el.firstChild.model).toBe(model.displayModel);
    });

    it("Should omit its displayModel", function() {
      var rootResponsePart = responseToMessage.getRootPart();

      var model = new ResponseModel({
        responseTo: rootResponsePart.id,
        changes: [op1Serialized],
      });
      el.model = model;
      Layer.Utils.defer.flush();

      expect(el.firstChild).toBe(null);
    });
  });
});
