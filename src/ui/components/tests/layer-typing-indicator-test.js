/* eslint-disable */
describe('layer-typing-indicator', function() {
  var el, testRoot, client, conversation, user1;

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

    user1 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-typing-indicator');
    spyOn(el, "onRerender").and.callThrough();
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);
  });

  describe('The conversation property', function() {

    it("Non-conversation values should set value to empty string", function() {
      el.value = "hey";
      el.conversation = conversation;
      el.conversation = null;
      expect(el.value).toEqual("");
    });
  });

  describe("Initialization", function() {
    it("Should wire up typing-indicator-change event to rerender", function() {
      el.onRerender.calls.reset();
      client.trigger('typing-indicator-change');
      expect(el.onRerender).toHaveBeenCalled();
    });
  });

  describe("The value property", function() {
    it("Should set the text in the typing indicator panel", function() {
      el.value = "Frodo is typing while being eaten";
      expect(el.nodes.panel.innerHTML).toEqual("Frodo is typing while being eaten");
    });

    it("Should setup the layer-typing-occuring class", function() {
      expect(el.classList.contains('layer-typing-occuring')).toBe(false);
      el.value = "Frodo is typing while being eaten";
      expect(el.classList.contains('layer-typing-occuring')).toBe(true);
      el.value = "";
      expect(el.classList.contains('layer-typing-occuring')).toBe(false);
    });
  });

  describe("The onCreate() method", function() {

    it("Should setup panel", function() {
      expect(el.nodes.panel).toEqual(jasmine.any(HTMLElement));
    });
  });

  describe("The onRender() method", function() {
    var userA, userB, userC;
    beforeEach(function() {
      userA = client._fixIdentities(["a"])[0];
      userB = client._fixIdentities(["b"])[0];
      userC = client._fixIdentities(["c"])[0];
    });
    it("Should call onRerender if there is a conversation", function() {
      client._typingIndicators.state[conversation.id] = {
        typing: ["a", "b"],
        paused: ["c"],
        users: {
          "a": { identity: userA},
          "b": { identity: userB},
          "c": { identity: userC},
        }
      };
      el.properties.conversation = conversation;
      el.properties.client = client;
      el.onRender({conversationId: conversation.id, typing: [user1]});
      expect(el.onRerender).toHaveBeenCalledWith({
        conversationId: conversation.id,
        typing: [userA.toObject(), userB.toObject()],
        paused: [userC.toObject()]
      });
    });

    it("Should not trigger event without a conversation", function() {
      var called = false;
      el.onRerender.calls.reset();
      el.addEventListener("layer-typing-indicator-change", function() {
        called = true;
      });
      client._typingIndicators.state[conversation.id] = {
        typing: ["a", "b"],
        paused: ["c"],
        users: {
          "a": { identity: userA},
          "b": { identity: userB},
          "c": { identity: userC},
        }
      };
      el.properties.conversation = null;
      el.onRender({conversationId: conversation.id, typing: [user1]});
      expect(called).toBe(false);

      el.properties.conversation = conversation;
      el.onRender({conversationId: conversation.id, typing: [user1]});
      expect(called).toBe(true);
    });
  });

  describe("The onRerender() method", function() {
    it("Should call onRerender if there is a conversation", function() {
      el.onRerender.calls.reset();
      el.conversation = conversation;

      expect(el.onRerender).toHaveBeenCalledWith({
        conversationId: conversation.id,
        typing: [],
        paused: []
      });
    });
  });

  describe("The onRerender() method again", function() {
    beforeEach(function() {
      el.conversation = conversation;
    });

    it("Should render a typing user if typing into same conversation", function() {
      el.onRerender({
        conversationId: conversation.id,
        typing: [user1]
      });
      expect(el.nodes.panel.innerHTML).toEqual(user1.displayName + ' is typing');
    });

    it("Should render multiple typing users if typing into same conversation", function() {
      el.onRerender({
        conversationId: conversation.id,
        typing: [user1, client.user]
      });
      expect(el.nodes.panel.innerHTML).toEqual(user1.displayName + ' and ' + client.user.displayName + ' are typing');
    });

    it("Should trigger layer-typing-indicator-change and not render typing users if prevented", function() {
      var called = false;
      var fn = function(evt) {
        called = true;
        evt.preventDefault();
      };
      document.body.addEventListener('layer-typing-indicator-change', fn);
      el.onRerender({
        conversationId: conversation.id,
        typing: [user1]
      });

      expect(called).toBe(true);
      expect(el.nodes.panel.innerHTML).toEqual("");

      // Cleanup
      document.body.removeEventListener('layer-typing-indicator-change', fn);
    });

    it("Should ignore typing users if typing into anohter conversation", function() {
      el.onRerender({
        conversationId: conversation.id + "a",
        typing: [user1]
      });
      expect(el.nodes.panel.innerHTML).toEqual("");
    });
  });
});