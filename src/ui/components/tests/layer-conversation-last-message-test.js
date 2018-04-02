/* eslint-disable */
describe('layer-conversation-last-message', function() {
  var el, testRoot, client, conversation, message;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    Layer.Utils.defer.reset();
    jasmine.clock().uninstall();

    if (el) {
      el.destroy();
      el = null;
    }
    if (client) {
      client.destroy();
      client = null;
    }
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
    el = document.createElement('layer-conversation-last-message');
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });
    message = conversation.createMessage("Hello Earthlings").send();
    Layer.Utils.defer.flush();
  });


  describe('The item property', function() {
    it("Should call onRender", function() {
      spyOn(el, "onRender");
      el.item = conversation;
      expect(el.onRender).toHaveBeenCalledWith();
    });

    it("Should wire up the onRerender event", function() {
      spyOn(el, "onRerender");
      el.item = conversation;
      el.onRerender.calls.reset();
      conversation.trigger('conversations:change', {});
      expect(el.onRerender).not.toHaveBeenCalled();

      conversation.trigger('conversations:change', {
        property: 'lastMessage',
        oldValue: null,
        newValue: conversation.lastMessage,
      });
      expect(el.onRerender).toHaveBeenCalledWith();
    });

    it("Should unwire up the onRerender event if prior Conversation", function() {
      spyOn(el, "onRerender");
      el.item = conversation;
      el.item = null;
      el.onRerender.calls.reset();
      conversation.trigger('conversations:change', {
        property: 'lastMessage',
        oldValue: null,
        newValue: conversation.lastMessage,
      });
      expect(el.onRerender).not.toHaveBeenCalled();
    });

    it("Should setup a model property", function() {
      el.item = conversation;
      expect(el.model.text).toEqual('Hello Earthlings');
      expect(el.model).toEqual(jasmine.any(Layer.Core.Client.getMessageTypeModelClass('TextModel')));
    });
  });

  describe("The onRerender() method", function() {
    it("Should render results of model.getOneLineSummary", function() {
      expect(el.innerHTML).toEqual('');
      var model = conversation.lastMessage.createModel();
      spyOn(model, "getOneLineSummary").and.returnValue("Frodo is a Dodo");
      el.item = conversation;
      expect(el.innerHTML).toEqual('Frodo is a Dodo');
    });

    it("Should remove the text if changing item to null", function(){
      el.item = conversation;
      expect(el.innerHTML).toEqual('Hello Earthlings');
      el.item = null;
      expect(el.innerHTML).toEqual('');
    });
  });
});