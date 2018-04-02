/* eslint-disable */
describe('Choice Message Components', function() {
  var ChoiceModel;
  var conversation;
  var testRoot;
  var client;
  var message;

  var styleNode;
  beforeAll(function() {
    styleNode = document.createElement('style');
    styleNode.innerHTML = 'layer-message-viewer.layer-choice-message-view  {width: 300px; height: 150px;}';
    document.body.appendChild(styleNode);
  });

  afterAll(function() {
    document.body.removeChild(styleNode);
  });

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

    ChoiceModel = Layer.Core.Client.getMessageTypeModelClass("ChoiceModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
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
    it("Should create an appropriate Basic Model with suitable properties and defaults", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });

      expect(model.label).toEqual("hello");
      expect(model.choices).toEqual([
        jasmine.objectContaining({text: "a", id: "aa"}),
        jasmine.objectContaining({text: "b", id: "bb"}),
        jasmine.objectContaining({text: "c", id: "cc"}),
      ]);
      expect(model.allowReselect).toBe(false);
      expect(model.allowDeselect).toBe(false);
      expect(model.allowMultiselect).toBe(false);
      expect(model.responseName).toBe('selection');
      expect(model.selectedAnswer).toBe('');
    });

    it("Should create an appropriate Basic Message", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });

      var rootPart = message.getRootPart();

      expect(message.parts.size).toEqual(1);
      expect(rootPart.mimeType).toEqual('application/vnd.layer.choice+json');
      expect(JSON.parse(rootPart.body)).toEqual({
        enabled_for: client.user.id,
        label: "hello",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });

      expect(model.actionModels).toEqual([
        {
          type: 'action',
          text: 'a',
          event: 'layer-choice-select',
          data: { id: 'aa' },
        },
        {
          type: 'action',
          text: 'b',
          event: 'layer-choice-select',
          data: { id: 'bb' },
        },
        {
          type: 'action',
          text: 'c',
          event: 'layer-choice-select',
          data: { id: 'cc' },
        },
      ]);
    });



    it("Should instantiate a Basic Model from a Message with metadata", function() {
      var uuid1 = Layer.Utils.generateUUID();

      var m = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [{
          id: 'layer:///messages/' + uuid1 + '/parts/' + Layer.Utils.generateUUID(),
          mime_type: ChoiceModel.MIMEType + '; role=root; node-id=a',
          body: JSON.stringify({
            label: "hello",
            choices: [
              {text: "a", id: "aa", states: {
                selected: {
                  text: "B",
                  tooltip: "BBB"
                }
              }},
              {text: "b", id: "bb", custom_response_data: {hey: "ho"}},
              {text: "c", id: "cc", tooltip: "Tips"},
            ]
          })
        }]
      });
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        message: m,
        part: m.findPart(),
      });

      expect(model.label).toEqual("hello");
      expect(model.choices).toEqual([
        jasmine.objectContaining({text: "a", id: "aa", states: {
          selected: {
            text: "B",
            tooltip: "BBB"
          }
        }}),
        jasmine.objectContaining({text: "b", id: "bb", customResponseData: {hey: "ho"}}),
        jasmine.objectContaining({text: "c", id: "cc", tooltip: "Tips"}),
      ]);

      expect(model.actionModels).toEqual([
        {
          type: 'action',
          text: 'a',
          event: 'layer-choice-select',
          data: { id: 'aa' },
        },
        {
          type: 'action',
          text: 'b',
          event: 'layer-choice-select',
          data: { id: 'bb' },
        },
        {
          type: 'action',
          text: 'c',
          event: 'layer-choice-select',
          data: { id: 'cc' },
        },
      ]);
    });


    it("Should have a suitable one line summary", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        title: "hey",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });
      expect(model.getOneLineSummary()).toEqual("hello");

      var model = new ChoiceModel({
        enabledFor: client.user.id,
        title: "hey",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });
      expect(model.getOneLineSummary()).toEqual("hey");

      var model = new ChoiceModel({
        enabledFor: client.user.id,
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ]
      });
      expect(model.getOneLineSummary()).toEqual(model.constructor.prototype.title);
      expect(model.constructor.prototype.title.length > 0).toBe(true);
    });

    describe("The allowReselect property", function() {
      it("Should correctly initialize Message with allowReselect", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          allowReselect: true,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ]
        });
        model.generateMessage(conversation, function(m) {
          message = m;
        });
        expect(JSON.parse(message.findPart().body).allow_reselect).toBe(true);
      });

      it("Should correctly initialize Model with allowReselect", function() {
        var uuid1 = Layer.Utils.generateUUID();

        var m = conversation.createMessage({
          id: 'layer:///messages/' + uuid1,
          parts: [{
            id: 'layer:///messages/' + uuid1 + '/parts/' + Layer.Utils.generateUUID(),
            mime_type: ChoiceModel.MIMEType + '; role=root; node-id=a',
            body: JSON.stringify({
              allow_reselect: true,
              label: "hello",
              choices: [
                {text: "a", id: "aa"},
                {text: "b", id: "bb"},
                {text: "c", id: "cc"},
              ]
            })
          }]
        });
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          message: m,
          part: m.findPart(),
        });

        expect(model.allowReselect).toBe(true);
      });

      it("Should enable/disable selection", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          preselectedChoice: "bb"
        });

        // All are false because it has a value, and allowReselect is false
        expect(model.isSelectionEnabledFor(0)).toBe(false);
        expect(model.isSelectionEnabledFor(1)).toBe(false);
        expect(model.isSelectionEnabledFor(2)).toBe(false);

        model.allowReselect = true;

        expect(model.isSelectionEnabledFor(0)).toBe(true);
        expect(model.isSelectionEnabledFor(1)).toBe(false);
        expect(model.isSelectionEnabledFor(2)).toBe(true);
      });
    });


    describe("The allowDeselect property", function() {
      it("Should correctly initialize Message with allowDeselect", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          allowDeselect: true,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ]
        });
        model.generateMessage(conversation, function(m) {
          message = m;
        });

        // This is *not* passed as part of the message; its set implicitly via allowDeselect
        expect(JSON.parse(message.findPart().body).allow_deselect).toBe(true);
      });

      it("Should correctly initialize Model with allowDeselect", function() {
        var uuid1 = Layer.Utils.generateUUID();

        var m = conversation.createMessage({
          id: 'layer:///messages/' + uuid1,
          parts: [{
            id: 'layer:///messages/' + uuid1 + '/parts/' + Layer.Utils.generateUUID(),
            mime_type: ChoiceModel.MIMEType + '; role=root; node-id=a',
            body: JSON.stringify({
              allow_deselect: true,
              label: "hello",
              choices: [
                {text: "a", id: "aa"},
                {text: "b", id: "bb"},
                {text: "c", id: "cc"},
              ]
            })
          }]
        });
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          message: m,
          part: m.findPart(),
        });

        expect(model.allowReselect).toBe(true);
        expect(model.allowDeselect).toBe(true);
      });

      it("Should enable/disable selection", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowReselect: true,
          preselectedChoice: "bb"
        });
        expect(model.isSelectionEnabledFor(0)).toBe(true);
        expect(model.isSelectionEnabledFor(1)).toBe(false);
        expect(model.isSelectionEnabledFor(2)).toBe(true);

        model.allowDeselect = true;

        expect(model.isSelectionEnabledFor(0)).toBe(true);
        expect(model.isSelectionEnabledFor(1)).toBe(true);
        expect(model.isSelectionEnabledFor(2)).toBe(true);
      });
    });

    describe("The allowMultiselect property", function() {
      it("Should correctly initialize Message with allowMultiselect", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          allowMultiselect: true,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ]
        });
        model.generateMessage(conversation, function(m) {
          message = m;
        });

        // This is *not* passed as part of the message; its set implicitly via allowMultiselect
        //expect(JSON.parse(message.parts[0].body).allow_reselect).toBe(true);
        //expect(JSON.parse(message.parts[0].body).allow_deselect).toBe(true);
        expect(JSON.parse(message.findPart().body).allow_multiselect).toBe(true);
      });

      it("Should correctly initialize Model with allowMultiselect", function() {
        var uuid1 = Layer.Utils.generateUUID();

        var m = conversation.createMessage({
          id: 'layer:///messages/' + uuid1,
          parts: [{
            id: 'layer:///messages/' + uuid1 + '/parts/' + Layer.Utils.generateUUID(),
            mime_type: ChoiceModel.MIMEType + '; role=root; node-id=a',
            body: JSON.stringify({
              allow_multiselect: true,
              label: "hello",
              choices: [
                {text: "a", id: "aa"},
                {text: "b", id: "bb"},
                {text: "c", id: "cc"},
              ]
            })
          }]
        });
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          message: m,
          part: m.findPart(),
        });

        expect(model.allowReselect).toBe(true);
        expect(model.allowDeselect).toBe(true);
        expect(model.allowMultiselect).toBe(true);
      });

      it("Should enable selection", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          preselectedChoice: "bb",
          allowReselect: true
        });
        expect(model.isSelectionEnabledFor(0)).toBe(true);
        expect(model.isSelectionEnabledFor(1)).toBe(false);
        expect(model.isSelectionEnabledFor(2)).toBe(true);

        model.allowMultiselect = true;

        expect(model.isSelectionEnabledFor(0)).toBe(true);
        expect(model.isSelectionEnabledFor(1)).toBe(true);
        expect(model.isSelectionEnabledFor(2)).toBe(true);
      });


      it("Should route calls to the proper version of selectAnswer", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          preselectedChoice: "bb",
          allowReselect: true
        });
        model.generateMessage(conversation, function(m) {
          message = m;
        });

        spyOn(model, "_selectMultipleAnswers");
        spyOn(model, "_selectSingleAnswer");

        // Run 1
        model.selectAnswer({id: "cc"});
        jasmine.clock().tick(1000);
        expect(model._selectSingleAnswer).toHaveBeenCalledWith({id: "cc"});
        model._selectSingleAnswer.calls.reset();
        expect(model._selectMultipleAnswers).not.toHaveBeenCalled();

        // Run 2
        model.allowMultiselect = true;
        model.selectAnswer({id: "cc"});
        jasmine.clock().tick(1000);
        expect(model._selectSingleAnswer).not.toHaveBeenCalled();
        expect(model._selectMultipleAnswers).toHaveBeenCalledWith({id: "cc"});
      });
    });

    describe("The _selectSingleAnswer() method", function() {
      it("Will depend upon getChoiceIndexById()", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          preselectedChoice: "bb"
        });

        // Run 1: Uses preselectedChoice
        expect(model.getChoiceIndexById(model.selectedAnswer)).toBe(1);

        // Run 2: Uses selectedAnswer
        model.selectedAnswer = "cc";
        expect(model.getChoiceIndexById(model.selectedAnswer)).toBe(2);
      });


      it("Will handle standard selection without the name property", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: selectedAnswer starts unset and is changed to the specified value
        expect(model.selectedAnswer).toBe('');
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe("bb");

        // Capture the Response Message's two parts
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === Layer.Core.Client.getMessageTypeModelClass('StatusModel').MIMEType;
        });

        // Validate the Status Part of the Response Message
        expect(textPart.mimeType).toEqual('application/vnd.layer.status+json');
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo selected "b"'
        });

        // Validate the Response Part of the Response Message
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'FWW',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: '',
          newValue: 'bb'
        });
      });

      it("Will handle standard selection with the name property", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          name: "Ardvark!"
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: selectedAnswer starts unset and is changed to the specified value
        expect(model.selectedAnswer).toBe('');
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe("bb");

        // Capture the Response Message's two parts
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === Layer.Core.Client.getMessageTypeModelClass('StatusModel').MIMEType;
        });

        // Validate the Status Part of the Response Message
        expect(textPart.mimeType).toEqual('application/vnd.layer.status+json');
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo selected "b" for "Ardvark!"'
        });

        // Validate the Response Part of the Response Message
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'FWW',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: '',
          newValue: 'bb'
        });
      });

      it("Will handle standard deselection with a preselectedChoice", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowDeselect: true,
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({id: 'bb'});
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: Starts with a preselected choice and deselects it
        expect(model.selectedAnswer).toBe("bb");
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe('');

        // Capture the two parts of the Response Message
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        // Validate the status part
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo deselected "b"'
        });

        // Validate the Response Part
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({ // Actual behavior here needs verification
          changes: [{
            operation: 'remove',
            type: 'LWWN',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: 'bb',
          newValue: ''
        });
      });

      it("Will handle standard deselection without a name property", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowDeselect: true,
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: Starts with "bb" and deselects it
        expect(model.selectedAnswer).toBe("bb");
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe('');

        // Gather the parts of the Response Message
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        // Validate the Status Part
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo deselected "b"'
        });

        // Validate the Response Part
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'remove',
            type: 'LWWN',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: 'bb',
          newValue: ''
        });
      });

      it("Will handle standard deselection with a name property", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          name: "Ardvark!",
          allowDeselect: true,
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: Deselect the second choice
        expect(model.selectedAnswer).toBe("bb");
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe('');

        // Gather the parts of the Response Message
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        // Validate the Status Part
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo deselected "b" for "Ardvark!"'
        });

        // Validate the Response Part
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'remove',
            type: 'LWWN',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        // Validate the change event
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: 'bb',
          newValue: ''
        });
      });

      it("Will handle responseName", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          responseName: "frodo"
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        // Select the second choice
        expect(model.selectedAnswer).toBe('');
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        // Verify that a correct operation is sent to the server
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'FWW',
            value: 'bb',
            name: 'frodo',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });

      it("Will allow and disallow edit with enabledFor", function() {
        var model = new ChoiceModel({
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          enabledFor: client.user.id + "a"
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run 1: User not permitted to change this state
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);

        expect(responseMessage).toBe(undefined);
        expect(model._triggerAsync).not.toHaveBeenCalledWith('message-type-model:changes', jasmine.any(Object));

        // Run 2: User IS permitted to change this state
        model.enabledFor = client.user.id;
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);

        expect(responseMessage).toEqual(jasmine.any(Layer.Core.Message));
        expect(model._triggerAsync).not.toHaveBeenCalledWith('message-type-model:changes', jasmine.any(Object));
      });
    });

    describe("The _selectMultipleAnswer() method", function() {
      it("Will handle standard selection", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowMultiselect: true
        });

        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({id: 'cc'});
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Validate initial state for multi-select
        expect(model.selectedAnswer).toBe('cc');

        // Run: Test basic selection
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe("cc,bb");

        // Gather the Response Message Parts
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        // Validate the STatus Part
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo selected "b"'
        });

        // Validate the Response Part
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'Set',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        // Validate the change event
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: 'cc',
          newValue: 'cc,bb'
        });
      });

      it("Will handle standard deselection", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowMultiselect: true
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({id: 'bb'});
        model.selectAnswer({id: 'cc'});
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "_triggerAsync").and.callThrough();

        // Run: Deselect the second choice
        expect(model.selectedAnswer).toBe("bb,cc");
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        expect(model.selectedAnswer).toBe("cc");

        // Gather the Response Message Parts
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        // Validate the Status Part
        expect(textPart.mimeType).toEqual('application/vnd.layer.status+json');
        expect(textPart.parentId).toEqual(responsePart.nodeId);
        expect(textPart.role).toEqual("status");
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'Frodo the Dodo deselected "b"'
        });

        // Validate the Response Part
        expect(responsePart.nodeId.length > 0).toBe(true);
        expect(responsePart.mimeType).toEqual('application/vnd.layer.response-v2+json');
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'remove',
            type: 'Set',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });

        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
          property: 'selectedAnswer',
          oldValue: 'bb,cc',
          newValue: 'cc'
        });
      });
    });

    it("Will handle responseName", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ],
        preselectedChoice: "cc",
        allowMultiselect: true,
        responseName: "frodo"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
        message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
      });
      var responseMessage;
      spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
      spyOn(model, "trigger").and.callThrough();

      // Run: Select choice 2
      expect(model.selectedAnswer).toBe('cc');
      model.selectAnswer({id: "bb"});
      jasmine.clock().tick(1000);

      var responsePart = responseMessage.getRootPart();

      // Verify that response name is used in multiselect
      expect(JSON.parse(responsePart.body)).toEqual({
        changes: [{
          operation: 'add',
          type: 'Set',
          value: 'bb',
          name: 'frodo',
          id: jasmine.any(String),
        }],
        response_to: message.id,
        response_to_node_id: model.part.nodeId
      });
    });

    it("Will allow and disallow edit with enabledFor", function() {
      var model = new ChoiceModel({
        label: "hello",
        choices: [
          {text: "a", id: "aa"},
          {text: "b", id: "bb"},
          {text: "c", id: "cc"},
        ],
        allowMultiselect: true,
        enabledFor: client.user.id + "a"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
        message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
      });

      var responseMessage;
      spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
      spyOn(model, "_triggerAsync").and.callThrough();

      // Run 1: Multiselect should block selection if not enabled for
      model.selectAnswer({id: "bb"});
      expect(responseMessage).toBe(undefined);
      expect(model._triggerAsync).not.toHaveBeenCalled();

      // Run 1: Multiselect should enable selection if IS enabled for
      model.enabledFor = client.user.id;
      model.selectAnswer({id: "bb"});
      jasmine.clock().tick(1000);
      expect(responseMessage).toEqual(jasmine.any(Layer.Core.Message));

      expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', {
        property: 'selectedAnswer',
        oldValue: '',
        newValue: 'bb'
      });
    });

    describe("Text and Tooltip state", function() {
      it("Should return the same text if no state settings", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", tooltip: "aaa", id: "aa"},
            {text: "b", tooltip: "bbb", id: "bb"},
            {text: "c", tooltip: "ccc", id: "cc"},
          ]
        });
        expect(model.getText(1)).toEqual("b");
        expect(model.getTooltip(1)).toEqual("bbb");

        model.selectedAnswer = "bb";
        expect(model.getText(1)).toEqual("b");
        expect(model.getTooltip(1)).toEqual("bbb");
      });

      it("Should apply selected state text", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", tooltip: "aaa", id: "aa"},
            {text: "b", tooltip: "bbb", id: "bb", states: {
              selected: {
                text: "B",
                tooltip: "BBB"
              }
            }},
            {text: "c", tooltip: "ccc", id: "cc"},
          ]
        });
        expect(model.getText(1)).toEqual("b");
        expect(model.getTooltip(1)).toEqual("bbb");

        model.selectedAnswer = "bb";
        expect(model.getText(1)).toEqual("B");
        expect(model.getTooltip(1)).toEqual("BBB");
      });

      it("Should apply default state text", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", tooltip: "aaa", id: "aa"},
            {text: "b", tooltip: "bbb", id: "bb", states: {
              default: {
                text: "B",
                tooltip: "BBB"
              }
            }},
            {text: "c", tooltip: "ccc", id: "cc"},
          ]
        });
        expect(model.getText(1)).toEqual("B");
        expect(model.getTooltip(1)).toEqual("BBB");

        model.selectedAnswer = "bb";
        expect(model.getText(1)).toEqual("b");
        expect(model.getTooltip(1)).toEqual("bbb");
      });
    });

    describe("Should send customResponseData", function() {
      it("Should send with singleSelect", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        // Sends "custom_response_data"
        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'FWW',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              hey: "ho",
              there: "goes"
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }
        ],
        response_to: message.id,
        response_to_node_id: model.part.nodeId
        });
      });

      it("Should send with multiSelect", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          },
          allowMultiselect: true
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'Set',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              hey: "ho",
              there: "goes"
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });

      it("Should send with singleSelect and custom item data", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa", customResponseData: {hey: "ho5", a: "aaa"}},
            {text: "b", id: "bb", customResponseData: {hey: "ho10", a: "bbb"}},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'FWW',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              hey: "ho10",
              there: "goes",
              a: "bbb"
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });

      it("Should send with deselected and custom item data", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          allowDeselect: true,
          choices: [
            {text: "a", id: "aa", customResponseData: {hey: "ho5", a: "aaa"}},
            {text: "b", id: "bb", customResponseData: {hey: "ho10", a: "bbb"}},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        // Deselect
        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'remove',
            type: 'LWWN',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              there: "goes",
              hey: "ho"
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });

      it("Should send with multiSelect and custom item data", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          allowMultiselect: true,
          choices: [
            {text: "a", id: "aa", customResponseData: {hey: "ho5", a: "aaa"}},
            {text: "b", id: "bb", customResponseData: {hey: "ho10", a: "bbb"}},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'add',
            type: 'Set',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              hey: "ho10",
              there: "goes",
              a: "bbb"
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });

      it("Should send with deselected multiSelect and custom item data", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          allowMultiselect: true,
          choices: [
            {text: "a", id: "aa", customResponseData: {hey: "ho5", a: "aaa"}},
            {text: "b", id: "bb", customResponseData: {hey: "ho10", a: "bbb"}},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });
        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);


        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        spyOn(model, "trigger").and.callThrough();

        // Deselect
        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);

        var responsePart = responseMessage.getRootPart();

        expect(JSON.parse(responsePart.body)).toEqual({
          changes: [{
            operation: 'remove',
            type: 'Set',
            value: 'bb',
            name: 'selection',
            id: jasmine.any(String),
          }, {
            operation: 'add',
            type: 'LWWN',
            value: {
              hey: "ho",
              there: "goes",
            },
            name: 'custom_response_data',
            id: jasmine.any(String),
          }],
          response_to: message.id,
          response_to_node_id: model.part.nodeId
        });
      });
    });

    describe("Event Tests", function() {
      it("Should use the message-type-model:sending-response-message event", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          name: "Ardvark!",
          allowMultiselect: true,
          choices: [
            {text: "a", id: "aa", customResponseData: {hey: "ho5", a: "aaa"}},
            {text: "b", id: "bb", customResponseData: {hey: "ho10", a: "bbb"}},
            {text: "c", id: "cc"},
          ],
          customResponseData: {
            hey: "ho",
            there: "goes"
          }
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });

        var called = false;
        model.once('message-type-model:sending-response-message', function(evt) {
          called = true;

          // Posttest
          expect(evt).toEqual(jasmine.objectContaining({
            respondingToModel: model,
            responseModel: jasmine.objectContaining({
              displayModel: jasmine.objectContaining({
                text: 'Frodo the Dodo selected "b" for "Ardvark!"',
              }),
              operations: [jasmine.objectContaining({
                type: 'Set',
                identityId: "layer:///identities/FrodoTheDodo",
                name: 'selection',
                value: 'bb',
                oldValue: [],
                operation: 'add',
                id: jasmine.any(String)
              }), jasmine.objectContaining({
                type: 'LWWN',
                name: 'custom_response_data',
                identityId: "layer:///identities/FrodoTheDodo",
                value: {
                  hey: "ho10",
                  there: 'goes',
                  a: "bbb"
                },
                oldValue: null,
                operation: 'add',
                id: jasmine.any(String)
              })]
            })
          }));
        });

        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);
        expect(called).toBe(true);

        // Test 2:
        called = false;
        model.once('message-type-model:sending-response-message', function(evt) {
          called = true;
          // Posttest
          expect(evt).toEqual(jasmine.objectContaining({
            respondingToModel: model,
            responseModel: jasmine.objectContaining({
              displayModel: jasmine.objectContaining({
                text: 'Frodo the Dodo deselected "b" for "Ardvark!"',
              }),
              operations: [jasmine.objectContaining({
                type: 'Set',
                name: 'selection',
                value: 'bb',
                oldValue: null,
                operation: 'remove',
                id: jasmine.any(String)
              }), jasmine.objectContaining({
                type: 'LWWN',
                name: 'custom_response_data',
                identityId: "layer:///identities/FrodoTheDodo",
                value: {
                  hey: "ho",
                  there: "goes"
                },
                oldValue: {
                  hey: "ho10",
                  there: 'goes',
                  a: "bbb"
                },
                operation: 'add',
                id: jasmine.any(String)
              })]
            })
          }));
        });
        model.selectAnswer({ id: "bb" });
        jasmine.clock().tick(1000);
        expect(called).toBe(true);
      });

      it("Should use the message-type-model:sending-response-message event", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "a", id: "aa"},
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
        });
        model.generateMessage(conversation, function(m) {
          message = m;
          message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });

        var called = false;
        model.once('message-type-model:sending-response-message', function(evt) {
          called = true;
          evt.responseModel.displayModel.text = 'hey ho';
        });

        var responseMessage;
        spyOn(Layer.Core.Message.prototype, "send").and.callFake(function() {responseMessage = this;});
        model.selectAnswer({id: "bb"});
        jasmine.clock().tick(1000);
        var responsePart = responseMessage.getRootPart();
        var textPart = responseMessage.findPart(function(part) {
          return part.mimeType === 'application/vnd.layer.status+json';
        });

        expect(textPart.mimeType).toEqual('application/vnd.layer.status+json');
        expect(JSON.parse(textPart.body)).toEqual({
          text: 'hey ho'
        });
      });
    });

    describe("The expandedType property", function() {
      it("Should return its own value or type if no value", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "c", id: "cc"},
          ],
          type: 'label',
          expandedType: 'standard'
        });
        expect(model.expandedType).toEqual('standard');
        model.expandedType = 'label';
        expect(model.expandedType).toEqual('label');
        model.expandedType = '';
        expect(model.expandedType).toEqual('label'); // returns type value

        var model2 = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "c", id: "cc"},
          ],
          type: 'label'
        });
        expect(model2.expandedType).toEqual('label'); // returns type value
      });
    });

    describe("The preselectedChoice property", function() {
      it("Should set the selectedAnswer property", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          preselectedChoice: "cc"
        });
        expect(model.selectedAnswer).toEqual("cc");
      });
    });

    describe("The parseModelResponses method", function() {
      it("Should compare arrays", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowMultiselect: true
        });
        spyOn(model, '_triggerAsync');

        // Run 1: Does nothing if nothing changed
        model.parseModelResponses();
        expect(model._triggerAsync).not.toHaveBeenCalled();

        // Run 2: Detects change in value
        model.selectedAnswer = "bb";
        model.responses.addState('selection', 'bb');
        model.responses.addState('selection', 'cc');
        model._triggerAsync.calls.reset();

        model.parseModelResponses();
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', jasmine.objectContaining({
          property: 'selectedAnswer',
          oldValue: 'bb',
          newValue: 'bb,cc'
        }));
        expect(model.selectedAnswer).toEqual("bb,cc");

        // Run 3: ignores difference in array sequence
        model._triggerAsync.calls.reset();
        model.selectedAnswer = "bb,cc";
        model.parseModelResponses();
        model.selectedAnswer = "cc,bb";
        model.parseModelResponses();
        expect(model._triggerAsync).not.toHaveBeenCalled();

        // Run 4: Detects removal of values
        model.responses.removeState('selection', 'cc');
        model._triggerAsync.calls.reset();

        model.parseModelResponses();
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', jasmine.objectContaining({
          property: 'selectedAnswer',
          newValue: 'bb',
          oldValue: 'cc,bb'
        }));
        expect(model.selectedAnswer).toEqual("bb");
      });

      it("Should compare values", function() {
        var model = new ChoiceModel({
          enabledFor: client.user.id,
          label: "hello",
          choices: [
            {text: "b", id: "bb"},
            {text: "c", id: "cc"},
          ],
          allowDeselect: true
        });
        spyOn(model, '_triggerAsync');

        // Run 1: Does nothing if nothing changed
        model.parseModelResponses();
        expect(model._triggerAsync).not.toHaveBeenCalled();

        // Run 2: Detects change in value
        model.selectedAnswer = "bb";
        model.responses.addState('selection', 'cc');
        model._triggerAsync.calls.reset();

        model.parseModelResponses();
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', jasmine.objectContaining({
          property: 'selectedAnswer',
          oldValue: 'bb',
          newValue: 'cc'
        }));
        expect(model.selectedAnswer).toEqual('cc');

        // Run 3: Detects removal of value
        model.responses.removeState('selection', 'cc');
        model._triggerAsync.calls.reset();

        model.parseModelResponses();
        expect(model._triggerAsync).toHaveBeenCalledWith('message-type-model:change', jasmine.objectContaining({
          property: 'selectedAnswer',
          oldValue: 'cc',
          newValue: ''
        }));
        expect(model.selectedAnswer).toEqual('');
      });
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

    it("Should render 3 action buttons", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", tooltip: "aaa", id: "aa"},
          {text: "b", tooltip: "bbb", id: "bb"},
          {text: "c", tooltip: "ccc", id: "cc"},
        ]
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Message Viewer: gets the layer-card-width-any-width class
      expect(el.classList.contains('layer-card-width-flex-width')).toBe(true);

      // Message UI:
      expect(el.nodes.ui.nodes.label.innerHTML).toEqual("hello");
      expect(el.nodes.ui.nodes.choices.childNodes[0].tagName).toEqual('LAYER-ACTION-BUTTON');
      expect(el.nodes.ui.nodes.choices.childNodes[1].tagName).toEqual('LAYER-ACTION-BUTTON');
      expect(el.nodes.ui.nodes.choices.childNodes[2].tagName).toEqual('LAYER-ACTION-BUTTON');

      expect(el.nodes.ui.nodes.choices.childNodes[0].text).toEqual("a");
      expect(el.nodes.ui.nodes.choices.childNodes[1].text).toEqual("b");
      expect(el.nodes.ui.nodes.choices.childNodes[2].text).toEqual("c");

      expect(el.nodes.ui.nodes.choices.childNodes[0].tooltip).toEqual("aaa");
      expect(el.nodes.ui.nodes.choices.childNodes[1].tooltip).toEqual("bbb");
      expect(el.nodes.ui.nodes.choices.childNodes[2].tooltip).toEqual("ccc");

      expect(el.nodes.ui.nodes.choices.childNodes[0].event).toEqual("layer-choice-select");
      expect(el.nodes.ui.nodes.choices.childNodes[1].event).toEqual("layer-choice-select");
      expect(el.nodes.ui.nodes.choices.childNodes[2].event).toEqual("layer-choice-select");

      expect(el.nodes.ui.nodes.choices.childNodes[0].data).toEqual({ id: "aa" });
      expect(el.nodes.ui.nodes.choices.childNodes[1].data).toEqual({ id: "bb" });
      expect(el.nodes.ui.nodes.choices.childNodes[2].data).toEqual({ id: "cc" });
    });

    it("Selection of an action button should update model and UI state", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", tooltip: "aaa", id: "aa"},
          {text: "b", tooltip: "bbb", id: "bb"},
          {text: "c", tooltip: "ccc", id: "cc"},
        ]
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      el.nodes.ui.nodes.choices.childNodes[1]._onClick({
        preventDefault: function() {},
        stopPropagation: function() {},
        target: {
          blur: function() {}
        }
      });

      jasmine.clock().tick(1);

      expect(model.selectedAnswer).toEqual("bb");
      expect(el.nodes.ui.nodes.choices.childNodes[1].selected).toBe(true);
    });

    it("Should update text based on state", function() {
      var model = new ChoiceModel({
        enabledFor: client.user.id,
        label: "hello",
        choices: [
          {text: "a", tooltip: "aaa", id: "aa"},
          {text: "b", tooltip: "bbb", id: "bb", states: {
            selected: {
              text: "B",
              tooltip: "BBB"
            }
          }},
          {text: "c", tooltip: "ccc", id: "cc"},
        ]
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      expect(el.nodes.ui.nodes.choices.childNodes[1].text).toEqual("b");
      model.selectAnswer({id: "bb" });
      jasmine.clock().tick(1000);
      expect(el.nodes.ui.nodes.choices.childNodes[1].text).toEqual("B");
    });

    it("Should trigger an event based on the responseName", function() {
      var model = new ChoiceModel({
        label: "hello",
        enabledFor: client.user.id,
        choices: [
          {text: "a", tooltip: "aaa", id: "aa"},
          {text: "b", tooltip: "bbb", id: "bb"},
          {text: "c", tooltip: "ccc", id: "cc"},
        ],
        responseName: 'clickme'
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      var spy = jasmine.createSpy('clickme');
      el.addEventListener('clickme', spy);

      Layer.Utils.defer.flush();

      el.nodes.ui.nodes.choices.childNodes[1]._onClick({
        preventDefault: function() {},
        stopPropagation: function() {},
        target: {
          blur: function() {}
        }
      });

      expect(spy).toHaveBeenCalled();
      var details = spy.calls.argsFor(0)[0].detail;
      expect(details.model).toBe(model);
      expect(details.rootModel).toBe(model);
      expect(details.data).toBe(model);
    });
  });
});
