/* eslint-disable */
describe('layer-compose-bar', function() {
  var el, testRoot, client, conversation;
  var TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel')

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
    jasmine.clock().uninstall();
  });

  beforeEach(function() {
    jasmine.clock().install();

    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });

    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-compose-bar');
    testRoot.appendChild(el);

    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    if (el) {
      el.destroy();
      el = null;
    }
    if (client) {
      client.destroy();
      client = null;
    }
  });

  describe('The conversation property', function() {

    it("Should call _setTypingListenerConversation", function() {
      spyOn(el, "_setTypingListenerConversation");
      el.conversation = conversation;
      expect(el._setTypingListenerConversation).toHaveBeenCalledWith();
    });

    it("Should manage the disabled state if manageDisabledState is true", function() {
      expect(el.manageDisabledState).toBe(true);
      expect(el.disabled).toBe(false);
      el.conversation = '';
      expect(el.disabled).toBe(true);
      el.conversation = conversation;
      expect(el.disabled).toBe(false);

      // If manageDisabledState is false...
      el.manageDisabledState = false;
      el.conversation = '';
      expect(el.disabled).toBe(false);
      el.conversation = conversation;
      expect(el.disabled).toBe(false);
    });

  });


  describe("The value property", function() {
    it("Should set the text in the composer", function() {
      el.value = "Please eat Frodo";
      expect(el.nodes.input.value).toEqual("Please eat Frodo");
    });

    it("Should resize the composer if needed", function() {
      var width = el.clientWidth;
      var height = el.clientHeight;
      el.value = new Array(500).join('Please eat Frodo');
      jasmine.clock().tick(100);
      expect(width).toEqual(el.clientWidth);
      expect(height * 2 < el.clientHeight).toBe(true);
    });

    it("Should retreive the value in the composer", function() {
      el.nodes.input.value = "Please Gollum, just eat him";
      expect(el.value).toEqual("Please Gollum, just eat him");
    });

    it("Should call _triggerChange", function() {
      el.value = "hi";
      spyOn(el, "_triggerChange");
      el.value = "hi ho";
      expect(el._triggerChange).toHaveBeenCalledWith("hi ho", "hi");
    });
  });

  describe("The placeholder property", function() {
    it("Should set the text in the composer", function() {
      el.placeholder = "Please eat Frodo";
      expect(el.nodes.input.placeholder).toEqual("Please eat Frodo");
    });

    it("Should retreive the placeholder in the composer", function() {
      el.nodes.input.placeholder = "Please Gollum, just eat him";
      expect(el.placeholder).toEqual("Please Gollum, just eat him");
    });
  });

  describe("The disabled property", function() {
    it("Should toggle layer-is-disabled", function() {
      expect(el.classList.contains('layer-is-disabled')).toBe(false);
      el.disabled = true;
      expect(el.classList.contains('layer-is-disabled')).toBe(true);
      el.disabled = false;
      expect(el.classList.contains('layer-is-disabled')).toBe(false);
    });

    it("Should toggle input-disabled", function() {
      expect(el.nodes.input.disabled).toBe(false);
      el.disabled = true;
      expect(el.nodes.input.disabled).toBe(true);
      el.disabled = false;
      expect(el.nodes.input.disabled).toBe(false);
    });
  });

  describe("The created() method", function() {
    it("Should add the layer-compose-bar-one-line-of-text class", function() {
      expect(el.classList.contains('layer-compose-bar-one-line-of-text')).toBe(true);
    });

    it("Should setup input, resizer and lineHeighter", function() {
      expect(el.nodes.input).toEqual(jasmine.any(HTMLTextAreaElement));
      expect(el.nodes.resizer).toEqual(jasmine.any(HTMLElement));
      expect(el.nodes.lineHeighter).toEqual(jasmine.any(HTMLElement));
    });
  });

  describe("The focus() method", function() {
    it("Should set the focus", function() {
      document.body.tabIndex = 1;
      document.body.focus();
      expect(document.activeElement).toBe(document.body);
      el.focus();
      expect(document.activeElement).toBe(el.nodes.input);
    });
  });

  describe("The _setTypingListenerConversation() method", function() {
    it("Should update the conversation being reported upon", function() {
      el._setTypingListenerConversation();
      el.properties.conversation = conversation;
      expect(el.properties.typingListener.conversation).toBe(null);
      el._setTypingListenerConversation();
      expect(el.properties.typingListener.conversation).toBe(conversation);
    });
  });

  describe("The send() method", function() {
    beforeEach(function() {
      el.value = "Frodo shall hang until he is dead or until we get tired of watching him laugh at us";
      el.conversation = conversation;
    });

    it("Should clear the input", function() {
      el.send();
      expect(el.value).toEqual("");
    });

    it("Should trigger layer-send-message and send the message typed", function() {
      var calledForModel = null;
      el.addEventListener("layer-send-message", function(evt) {
        calledForModel = evt.detail.model;
      });
      el.send();

      expect(calledForModel.text).toEqual("Frodo shall hang until he is dead or until we get tired of watching him laugh at us");
      expect(calledForModel.part.body).toEqual('{"text":"Frodo shall hang until he is dead or until we get tired of watching him laugh at us"}');
      expect(calledForModel.message.syncState).toEqual(Layer.Constants.SYNC_STATE.SAVING);
    });

    it("Should trigger layer-send-message and cancel the message on evt.preventDefault()", function() {
      var calledForModel = null;
      el.addEventListener("layer-send-message", function(evt) {
        calledForModel = evt.detail.model;
        evt.preventDefault();
      });
      el.send();

      expect(calledForModel.text).toEqual("Frodo shall hang until he is dead or until we get tired of watching him laugh at us");
      expect(calledForModel.part.body).toEqual('{"text":"Frodo shall hang until he is dead or until we get tired of watching him laugh at us"}');
      expect(calledForModel.message.syncState).toEqual(Layer.Constants.SYNC_STATE.NEW);
    });

    it("Should trigger events even if no conversation", function() {
      var calledForModel = null;
      el.addEventListener("layer-send-message", function(evt) {
        calledForModel = evt.detail.model;
        evt.preventDefault();
      });
      el.conversation = null;
      el.send();

      expect(calledForModel.text).toEqual("Frodo shall hang until he is dead or until we get tired of watching him laugh at us");
      expect(calledForModel.part).toBe(null);
      expect(calledForModel.message).toBe(null);
    });
  });

  describe("The sendModels() method", function() {
    it("Should send models and leave text as-is", function() {
      el.conversation = conversation;
      el.value = "Frodo shall hang until he is dead or until we get tired of watching him laugh at us";
      var model = new TextModel({text: "hello"});

      var calledForModel = null;
      el.addEventListener("layer-send-message", function(evt) {
        calledForModel = evt.detail.model;
        evt.preventDefault();
      });

      // Run
      el.sendModels([model]);

      // Posttest
      expect(calledForModel).toBe(model);
      expect(calledForModel.part.body).toEqual('{"text":"hello"}');
      expect(el.value).toEqual("Frodo shall hang until he is dead or until we get tired of watching him laugh at us");
    });
  });

  describe("The _send() method", function() {
    it("Should trigger layer-send-message and then call onSend", function() {
      el.conversation = conversation;
      spyOn(el, "onSend");
      var spy = jasmine.createSpy('spy');
      el.addEventListener('layer-send-message', spy);

      var model = new TextModel({text: "hello"});
      var notification = {
        title: 'New Message from ' + client.user.displayName,
        text: 'hello'
      };
      el._send(model);

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
        detail: {
          model: model,
          notification: notification,
          conversation: conversation
        }
      }));
      expect(el.onSend).toHaveBeenCalledWith(model, notification);
    });

    it("Should trigger layer-send-message and then skip onSend if evt.preventDefault", function() {
      el.conversation = conversation;
      spyOn(el, "onSend");
      var evtDetails = null;
      var f = function(evt) {
        evtDetails = evt.detail;
        evt.preventDefault();
      };
      el.addEventListener('layer-send-message', f)
      var model = new TextModel({text: "hello"});
      var notification = {
        title: 'New Message from ' + client.user.displayName,
        text: 'hello'
      };
      el._send(model);

      expect(evtDetails).toEqual({
        model: model,
        notification: notification,
        conversation: conversation
      });
      expect(el.onSend).not.toHaveBeenCalled();
    });
  });

  describe("The onSend() method", function() {
    it("Should call the model send method", function() {
      el.conversation = conversation;
      var model = new TextModel({text: "hello"});
      spyOn(model, "send");

      // Run
      el.onSend(model, {text: "hey"});

      // Posttest
      expect(model.send).toHaveBeenCalledWith({
        conversation: conversation,
        notification: {text: "hey"}
      });
    });
  });

  describe("The _onKeyDown() method", function() {
    it("Should preventDefault on ENTER and call send", function() {
      el.client = client;
      spyOn(el, 'send');
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onKeyDown({
        preventDefault: preventSpy,
        keyCode: 13,
        shiftKey: false,
        ctrlKey: false
      });
      expect(el.send).toHaveBeenCalledWith();
      expect(preventSpy).toHaveBeenCalledWith();
    });

    it("Should allow ENTER if shifted", function() {
      spyOn(el, 'send');
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onKeyDown({
        preventDefault: preventSpy,
        keyCode: 13,
        shiftKey: true,
        ctrlKey: false,
        target: el.nodes.input
      });
      expect(el.send).not.toHaveBeenCalledWith();
      expect(preventSpy).not.toHaveBeenCalledWith();
    });

    it("Should preventDefault and insert a tab if tabs are enabled", function() {
      spyOn(el, 'send');
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onKeyDown({
        preventDefault: preventSpy,
        keyCode: 9,
        shiftKey: false,
        ctrlKey: false,
        target: el.nodes.input
      });
      expect(el.send).not.toHaveBeenCalledWith();
      expect(preventSpy).toHaveBeenCalledWith();
      expect(el.nodes.input.value).toEqual("\t  ");
    });

    it("Should not preventDefault nor insert a tab if tabs are not enabled", function() {
      Layer.UI.settings.disableTabAsWhiteSpace = true;
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onKeyDown({
        preventDefault: preventSpy,
        keyCode: 9,
        shiftKey: false,
        ctrlKey: false,
        target: el.nodes.input
      });
      expect(preventSpy).not.toHaveBeenCalledWith();
      expect(el.nodes.input.value).toEqual("");
      Layer.UI.settings.disableTabAsWhiteSpace = false;
    });

    it("Should call onRender() whether its an ENTER or a letter", function() {
      el.value = "hello";
      el.properties.client = client;

      spyOn(el, "onRender");
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onKeyDown({
        preventDefault: preventSpy,
        keyCode: 13,
        shiftKey: false,
        ctrlKey: false,
        target: el.nodes.input
      });
      expect(el.onRender).toHaveBeenCalledWith();
    });

    it("Should call _triggerChange", function() {
      el.value = "hi";
      el.properties.client = client;

      spyOn(el, "_triggerChange");
      el._onKeyDown({
        preventDefault: function() {},
        keyCode: 13,
        shiftKey: false,
        ctrlKey: false,
        target: el.nodes.input
      });
      expect(el._triggerChange).toHaveBeenCalledWith("", "hi");
    });
  });

  describe("The _onInput() method", function() {
    it("Should call onRender() ", function() {
      spyOn(el, "onRender");
      var preventSpy = jasmine.createSpy('preventDefault');
      el._onInput({});
      expect(el.onRender).toHaveBeenCalledWith();
    });

    it("Should call _triggerChange", function() {
      el.nodes.input.value = "hi ho";
      el.properties.value = "hi";

      spyOn(el, "_triggerChange");
      el._onInput({});
      expect(el._triggerChange).toHaveBeenCalledWith("hi ho", "hi");
    });
  });

  describe("The _triggerChange() method", function() {
    it("Should trigger a change event", function() {
      el.properties.value = "hi";
      spyOn(el, "trigger");
      el._triggerChange("hi ho", "hi");
      expect(el.trigger).toHaveBeenCalledWith("layer-compose-bar-change-value", {
        newValue: "hi ho",
        oldValue: "hi"
      });
    });

    it("Should update this.data.value", function() {
      el.properties.value = "hi";
      el._triggerChange("hi ho", "hi");
      expect(el.properties.value).toEqual("hi ho");
    });

    it("Should abort if no change", function() {
      el.properties.value = "hi";
      spyOn(el, "trigger");
      el._triggerChange("hi ho", "hi ho");
      expect(el.properties.value).toEqual("hi");
      expect(el.trigger).not.toHaveBeenCalled();
    });
  });

  describe("The onRender() method", function() {
    it("Should assign resizer and lineHeighter the same value as input", function() {
      el.value = "Please eat Frodo\nand then we can at last digest the Shire";
      el.nodes.resizer.innerHTML = '';
      el.nodes.lineHeighter.innerHTML = '';

      // Run
      el.onRender();
      jasmine.clock().tick(100);

      // Posttest
      expect(el.nodes.resizer.innerHTML).toEqual("Please eat Frodo<br>and then we can at last digest the Shire");
      expect(el.nodes.lineHeighter.innerHTML).toEqual("Please eat Frodo<br>and then we can at last digest the Shire");
    });

    it("Should assign resizer and lineHeighter non-breaking-space if input is empty", function() {
      el.value = "";
      el.nodes.resizer.innerHTML = '';
      el.nodes.lineHeighter.innerHTML = '';

      // Run
      el.onRender();
      jasmine.clock().tick(100);

      // Posttest
      expect(el.nodes.resizer.innerHTML).toEqual("&nbsp;");
      expect(el.nodes.lineHeighter.innerHTML).toEqual("&nbsp;");
    });

    it("Should add and remove layer-compose-bar-one-line-of-text", function() {
      el.value = new Array(30).join('Frodo is a Dodo');
      el.nodes.resizer.innerHTML = '';
      el.nodes.lineHeighter.innerHTML = '';

      // Run
      el.onRender();
      jasmine.clock().tick(100);

      // Posttest
      expect(el.classList.contains('layer-compose-bar-one-line-of-text')).toBe(false);

      // Run 2
      el.value = new Array(1).join('Frodo is a Dodo');
      el.nodes.resizer.innerHTML = '';
      el.nodes.lineHeighter.innerHTML = '';
      el.onRender();
      jasmine.clock().tick(100);

      // Posttest
      expect(el.classList.contains('layer-compose-bar-one-line-of-text')).toBe(true);
    });
  });

  describe("The onModelsGenerated() method", function() {
    it("Should call send with its models", function() {
      var FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel')
      var model = new FileModel({sourceUrl: "hey ho", mimeType: "text/plain"});
      spyOn(el, 'sendModels');

      // Run
      el.onModelsGenerated([model]);

      // Posttest
      expect(el.sendModels).toHaveBeenCalledWith([model]);
    });
  });
});