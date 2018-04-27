/* eslint-disable */
describe("The Message Type Model class", function() {
  var appId = "Fred's App";
  var conversation,
      client,
      requests;
  var TextModel;

  afterAll(function() {

  });

  beforeEach(function() {
      jasmine.Ajax.install();
      requests = jasmine.Ajax.requests;
      client = new Layer.init({
          appId: appId,
          url: "https://doh.com"
      }).on('challenge', function() {});
      client.userId = "999";
      client.user = new Layer.Core.Identity({
        userId: client.userId,
        id: "layer:///identities/" + client.userId,
        firstName: "first",
        lastName: "last",
        phoneNumber: "phone",
        emailAddress: "email",
        metadata: {},
        publicKey: "public",
        avatarUrl: "avatar",
        displayName: "display",
        syncState: Layer.Constants.SYNC_STATE.SYNCED,
        isFullIdentity: true,
        isMine: true
      });


      client._clientAuthenticated();
      client._clientReady();
      client.onlineManager.isOnline = true;

      conversation = Layer.Core.Conversation._createFromServer(responses.conversation2);
      requests.reset();
      client.syncManager.queue = [];
      TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
  });
  afterEach(function() {
      client.destroy();
      jasmine.Ajax.uninstall();
  });

  describe("The constructor", function() {
    it("Should initialize an empty Response Summary Model", function() {
      var model = new TextModel({});
      expect(model.responses).toEqual(jasmine.any(Layer.Core.MessageTypeResponseSummary));
      expect(Layer.Core.MessageTypeResponseSummary).not.toBe(null);
    });

    it("Should initialize an empty childParts and childModels arrays", function() {
      var model = new TextModel({});
      expect(model.childParts).toEqual([]);
      expect(model.childModels).toEqual([]);
    });

    it("Should setup currentMessageRenderer and currentLargeMessageRenderer", function() {
      var FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel')
      var model = new FeedbackModel({});
      expect(model.currentMessageRenderer).toEqual('layer-feedback-message-view');
      expect(model.currentLargeMessageRenderer).toEqual('layer-feedback-message-large-view');
    });

    it("Should only call _setupMessage if initialized with a message", function() {
      // Setup
      spyOn(Layer.Core.MessageTypeModel.prototype, "_setupMessage");

      // Run 1
      var FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel')
      var model = new FeedbackModel({});
      expect(Layer.Core.MessageTypeModel.prototype._setupMessage).not.toHaveBeenCalled();

      // Run 2
      var message = new Layer.Core.Message({
        parts: [{body: "{}", mimeType: FeedbackModel.MIMEType}]
      });
      model = new FeedbackModel({ message: message, part: message.filterParts()[0] });
      expect(Layer.Core.MessageTypeModel.prototype._setupMessage).toHaveBeenCalled();
    });

    it("Should only call parseMessage if initialized with a part", function() {
      // Setup
      spyOn(Layer.Core.MessageTypeModel.prototype, "parseMessage");

      // Run 1
      var FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel')
      var model = new FeedbackModel({});
      expect(Layer.Core.MessageTypeModel.prototype.parseMessage).not.toHaveBeenCalled();

      // Run 2
      var message = new Layer.Core.Message({
        parts: [{body: "{}", mimeType: FeedbackModel.MIMEType}]
      });
      var model2 = new FeedbackModel({ message: message, isAnonymous: true, parentModel: model });
      expect(Layer.Core.MessageTypeModel.prototype.parseMessage).not.toHaveBeenCalled();

      // Run 3
      var message = new Layer.Core.Message({
        parts: [{body: "{}", mimeType: FeedbackModel.MIMEType}]
      });
      var model3 = new FeedbackModel({ message: message, part: message.filterParts()[0] });
      expect(Layer.Core.MessageTypeModel.prototype.parseMessage).toHaveBeenCalledWith();
    });

    it("Should call initializeNewModel rather than parseMessage only when initialized without a message", function() {
      spyOn(Layer.Core.MessageTypeModel.prototype, "parseMessage");
      spyOn(Layer.Core.MessageTypeModel.prototype, "initializeNewModel");
      spyOn(Layer.Core.MessageTypeModel.prototype, "initializeAnonymousModel");
      var TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')
      var model = new TextModel({});
      expect(Layer.Core.MessageTypeModel.prototype.parseMessage).not.toHaveBeenCalled();
      expect(Layer.Core.MessageTypeModel.prototype.initializeNewModel).toHaveBeenCalledWith();
      expect(Layer.Core.MessageTypeModel.prototype.initializeAnonymousModel).not.toHaveBeenCalled();
    });

    it("Should call initializeAnonymousModel rather than parseMessage only when initialized with isAnonymous", function() {
      var parentModel = new Layer.Core.MessageTypeModel({});
      spyOn(Layer.Core.MessageTypeModel.prototype, "parseMessage");
      spyOn(Layer.Core.MessageTypeModel.prototype, "initializeNewModel");
      spyOn(Layer.Core.MessageTypeModel.prototype, "initializeAnonymousModel");
      var TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
      var message = new Layer.Core.Message({
        parts: [{body: "{}", mimeType: TextModel.MIMEType}]
      });
      var model = new TextModel({
        message: message,
        isAnonymous: true,
        parentModel: parentModel,
      });
      expect(Layer.Core.MessageTypeModel.prototype.parseMessage).not.toHaveBeenCalled();
      expect(Layer.Core.MessageTypeModel.prototype.initializeNewModel).not.toHaveBeenCalled();
      expect(Layer.Core.MessageTypeModel.prototype.initializeAnonymousModel).toHaveBeenCalledWith();
    });

    it("Should call registerAllStates for all types of initialization", function() {
      var TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
      spyOn(TextModel.prototype, "registerAllStates");
      // test local models
      var model1 = new TextModel({});
      expect(TextModel.prototype.registerAllStates).toHaveBeenCalledWith();
      TextModel.prototype.registerAllStates.calls.reset();

      // test anonymous models
      var message = new Layer.Core.Message({
        parts: [{body: "{}", mimeType: TextModel.MIMEType}]
      });
      var model2 = new TextModel({
        message: message,
        isAnonymous: true,
        parentModel: model1,
      });
      expect(TextModel.prototype.registerAllStates).toHaveBeenCalledWith();
      TextModel.prototype.registerAllStates.calls.reset();

      // test message models
      var model3 = new TextModel({
        message: message,
        part: message.filterParts()[0]
      });
      expect(TextModel.prototype.registerAllStates).toHaveBeenCalledWith();
      TextModel.prototype.registerAllStates.calls.reset();
    });
  });

  describe("The send() method", function() {
    it("Should call generateMessage", function() {
      var model = new TextModel({});
      spyOn(model, "generateMessage");

      // Run
      model.send({ conversation: conversation });

      // Posttest
      expect(model.generateMessage).toHaveBeenCalledWith(conversation, jasmine.any(Function));
    });

    it("Should call callback", function() {
      var model = new TextModel({});
      var spy = jasmine.createSpy('myspy');

      // Run
      model.send({ conversation: conversation, callback: spy });

      // Posttest
      expect(spy).toHaveBeenCalledWith(jasmine.any(Layer.Core.Message));
    });
  });

  describe("The presend() method", function() {
    it("Should call generateMessage", function() {
      var model = new TextModel({});
      spyOn(model, "generateMessage");

      // Run
      model.presend({ conversation: conversation });

      // Posttest
      expect(model.generateMessage).toHaveBeenCalledWith(conversation, jasmine.any(Function));
    });

    it("Should call callback", function() {
      var model = new TextModel({});
      var spy = jasmine.createSpy('myspy');

      // Run
      model.presend({ conversation: conversation, callback: spy });

      // Posttest
      expect(spy).toHaveBeenCalledWith(jasmine.any(Layer.Core.Message));
    });
  });

  describe("The generateMessage() method", function() {
    it("Should do nothing but call the callback if there is already a message", function() {
      var m = conversation.createMessage("Hello");
      var model = new TextModel({ message: m, part: m.filterParts()[0] });
      spyOn(conversation, "createMessage");
      var spy = jasmine.createSpy("spyme");

      // Run
      model.send({ conversation: conversation, callback: spy });

      // Posttest
      expect(conversation.createMessage).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(m);
    });

    it("Should setup the root role on the root part", function() {
      var model = new TextModel({  });

      // Run
      model.send({ conversation: conversation });

      // Posttest
      expect(model.part.mimeAttributes.role).toEqual('root');
      expect(model.part.role).toEqual('root');
    });

    it("Should create the message and call _setupMessage", function() {
      var model = new TextModel({  });
      spyOn(model, "_setupMessage");

      // Run
      model.send({ conversation: conversation });

      // Posttest
      expect(model.message).toEqual(jasmine.any(Layer.Core.Message));
      expect(model._setupMessage).toHaveBeenCalledWith();
    });

    it("Should call parseModelChildParts", function() {
      var model = new TextModel({  });
      spyOn(model, "parseModelChildParts");

      // Run
      model.send({ conversation: conversation });

      // Posttest
      expect(model.parseModelChildParts).toHaveBeenCalledWith({ isEdit: false, changes: [] });
    });

    it("Should call the callback", function() {
      var model = new TextModel({ });
      spyOn(model, "parseModelChildParts");
      var spy = jasmine.createSpy("spyme");

      // Run
      model.send({ conversation: conversation, callback: spy });

      // Posttest
      expect(spy).toHaveBeenCalledWith(model.message);
    });

    it("Should register the Model", function() {
      var model = new TextModel({  });

      // Run
      model.send({ conversation: conversation });

      // Posttest
      expect(client.getMessageTypeModel(model.id)).toBe(model);
    });
  });

  describe("The parseMessage() method", function() {
    var message;
    beforeEach(function() {
      message = conversation.createMessage("hello");
    });

    it("Should call parseModelPart", function() {
      var model = new TextModel({ message: message, part: message.findPart() });
      model._setupMessage();
      spyOn(model, "parseModelPart");

      // Run
      model.parseMessage();

      // Posttest
      expect(model.parseModelPart).toHaveBeenCalledWith({ payload: {text: "hello"}, isEdit: false });
    });

    it("Should skip _parseModelResponses and parseModelResponses if there are no responses", function() {
      var model = new TextModel({ message: message, part: message.findPart() });
      model._setupMessage();
      spyOn(model, "_parseModelResponses").and.callThrough();
      spyOn(model, "parseModelResponses").and.callThrough();

      // Run
      model.parseMessage();

      // Posttest
      expect(model._parseModelResponses).not.toHaveBeenCalled();
      expect(model.parseModelResponses).not.toHaveBeenCalled();
    });

    it("Should call _parseModelResponses and parseModelResponses if there are responses", function() {
      message.addPart(new Layer.Core.MessagePart({
        mimeType: Layer.Constants.STANDARD_MIME_TYPES.RESPONSESUMMARY + '; parent-node-id=' + message.filterParts()[0].nodeId + '; role=response_summary',
        body: JSON.stringify({
          '999': {
            hey: {
              adds: [{value: "ho", ids: ["abc"]}],
              removes: []
            }
          }
        })
      }));
      var model = new TextModel({ message: message, part: message.findPart() });
      model.responses.registerState('hey', Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS);
      model._setupMessage();
      spyOn(model, "_parseModelResponses").and.callThrough();
      spyOn(model, "parseModelResponses").and.callThrough();
      message.parts.add(new Layer.Core.MessagePart({
        mimeType: Layer.Constants.STANDARD_MIME_TYPES.RESPONSESUMMARY + '; parent-node-id=' + message.filterParts()[0].nodeId + '; role=response_summary',
        body: JSON.stringify({
          '999': {
            hey: {
              adds: [{value: "ho2", ids: ["abcd"]}],
              removes: ["abc"]
            }
          }
        })
      }));

      // Run
      model.parseMessage();

      // Post test
      expect(model._parseModelResponses).toHaveBeenCalled();
      expect(model.parseModelResponses).toHaveBeenCalled();
    });


    it("Should call parseModelChildParts", function() {
      var partRoot = message.findPart();
      var partChild = new Layer.Core.MessagePart({mimeType: "doh/ray; parent-node-id=" + message.findPart().nodeId, body: "heyho"});
      message.addPart(partChild);
      var model = new TextModel({ message: message, part: partRoot });
      model._setupMessage();
      spyOn(model, "parseModelChildParts");

      // Run
      model.parseMessage();

      // Posttest
      expect(model.parseModelChildParts).toHaveBeenCalledWith({ changes: [{ type: 'added', part: partChild }], isEdit: false });
    });
  });

  describe("The parseModelPart() method", function() {
    it("Should copy in all valid properties as camel cased properties", function() {
      var ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel');
      model = new ProductModel({
        description: "hello there"
      });

      model.parseModelPart({
        payload: {
          description: "description",
          image_urls: ["heyho"],
          frodo: "dodo"
        },
        isEdit: false
      });
      expect(model.description).toEqual("description");
      expect(model.imageUrls).toEqual(["heyho"]);
      expect(model.frodo).toBe(undefined);
    });
  });

  describe("The _parseModelResponses() method", function() {
    var model, message;

    beforeEach(function() {
      var ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel');
      model = new ProductModel({
        description: "hello there"
      });

      model.generateMessage(conversation, function(m) {message = m;});
    });
    afterEach(function() {
      model.destroy();
      message.destroy();
    });

    it("Should call responses.parseResponsePart if a response_summary is found", function() {
      // Setup
      spyOn(model, "_parseModelResponses").and.callThrough();
      spyOn(model.responses, "parseResponsePart").and.callThrough();

      // Pretest
      expect(model.responses.parseResponsePart).not.toHaveBeenCalled();
      expect(model._parseModelResponses).not.toHaveBeenCalled();

      // Run
      message.addPart(new Layer.Core.MessagePart({
        mimeType: Layer.Constants.STANDARD_MIME_TYPES.RESPONSESUMMARY + "; parent-node-id=" + model.nodeId + "; role=response_summary",
        body: JSON.stringify({
          participant_data: {
            userA: { favorite: true }
          }
        })
      }));
      Layer.Utils.defer.flush();


      // Post test
      expect(model._parseModelResponses).toHaveBeenCalledWith(jasmine.any(Layer.Core.MessagePart));
      expect(model.responses.parseResponsePart).toHaveBeenCalledWith(jasmine.any(Layer.Core.MessagePart));
    });

    it("Should trigger a change event if the response_summary contained changes", function() {
      // Setup
      var ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel');
      model.part = new Layer.Core.MessagePart({body: JSON.stringify({description: "hello"}), mimeType: ProductModel.MIMEType });
      spyOn(model, "_triggerAsync").and.callThrough();
      model.responses.registerState('favorite', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);
      model.parseMessage();

      // Pretest
      expect(model._triggerAsync).toHaveBeenCalledWith("message-type-model:change", {
        property: "description",
        oldValue: "hello there",
        newValue: "hello"
      });
      model._triggerAsync.calls.reset();

      // Run
      message.addPart(new Layer.Core.MessagePart({
        mimeType: "application/vnd.layer.responsesummary-v2+json; parent-node-id=" + model.nodeId + "; role=response_summary",
        body: JSON.stringify({
          "layer:///identities/999": {
            favorite: {
              adds: [{value: true, ids: ["abc"]}],
              removes: []
            }
          }
        })
      }));
      Layer.Utils.defer.flush();

      // Posttest
      expect(model._triggerAsync).toHaveBeenCalledWith("message-type-model:change", {
        property: 'responses.favorite',
        oldValue: null,
        newValue: true,
        identityId: 'layer:///identities/999'
      });
    });

  });
});