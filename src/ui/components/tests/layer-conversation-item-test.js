/* eslint-disable */
describe('layer-conversation-item', function() {
  var el, testRoot, client, conversation, user;

  beforeAll(function(done) {
    setTimeout(done, 1000);
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

    user = new Layer.Core.Identity({
      userId: 'GandalfTheGruesome',
      displayName: 'Gandalf the Gruesome',
      id: 'layer:///identities/GandalfTheGruesome',
      isFullIdentity: true
    });

    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-item');
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo']
    });
    el.item = conversation;

    el.replaceableContent = Layer.UI.components['layer-conversation-list'].properties
      .filter(function(prop) { return prop.propertyName === 'replaceableContent'; })[0].value;

    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) {
      el.destroy();
      el = null;
    }
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

  });

  describe('The item property', function() {
    it("Should update  layer-conversation-last-message and layer-conversation-title", function() {
      var c2 = client.createConversation({
        participants: ['layer:///identities/GolumTheCutie']
      });
      el.item = c2;
      expect(el.nodes.lastMessage.item).toBe(c2);
      expect(el.nodes.title.item).toBe(c2);
    });

    it("Should wire up the onRerender event", function() {
      spyOn(el, "onRerender");
      var c2 = client.createConversation({
        participants: ['layer:///identities/GolumTheCutie']
      });
      el.item = c2;
      el.onRerender.calls.reset();
      c2.trigger('conversations:change', {property: 'unreadCount', oldValue: 5, newValue: 6});
      expect(el.onRerender).toHaveBeenCalledWith(jasmine.any(Layer.Core.LayerEvent));
    });

    it("Should unwire up the onRerender event if prior Conversation", function() {
      spyOn(el, "onRerender");
      el.item = null;
      el.onRerender.calls.reset();
      conversation.trigger('conversations:change', {property: 'unreadCount', oldValue: 5, newValue: 6});
      expect(el.onRerender).not.toHaveBeenCalled();
    });
  });

  describe("The dateFormat property", function() {
    it("Should set the date widgets format properties", function() {

      el.dateFormat = {
        today: {hour: "number"},
        default: {minute: "short"},
        week: {year: "short"},
        older: {weekday: "short"}
      };
      expect(el.nodes.date.todayFormat).toEqual({hour: "number"});
      expect(el.nodes.date.defaultFormat).toEqual({minute: "short"});
      expect(el.nodes.date.weekFormat).toEqual({year: "short"});
      expect(el.nodes.date.olderFormat).toEqual({weekday: "short"});
    });

    it("Should set some properties of the date widgets format properties", function() {

      el.nodes.date.todayFormat = {hour: "short"};

      el.dateFormat = {
        default: {minute: "number"}
      };
      expect(el.nodes.date.todayFormat).toEqual({hour: "short"});

      el.dateFormat = {
        today: {minute: "number"}
      };
      expect(el.nodes.date.todayFormat).toEqual({minute: "number"});
    });
  });

  describe("The size property", function() {
    it("Should pass value on to avatar", function() {
      el.item = conversation;
      el.size = 'small';
      expect(el.nodes.avatar.size).toEqual('small');

      el.size = 'medium';
      expect(el.nodes.avatar.size).toEqual('medium');

      el.size = 'large';
      expect(el.nodes.avatar.size).toEqual('large');
    });

    it("Should show/hide presence", function() {
      el.item = conversation;

      expect(el.nodes.presence.clientWidth).toEqual(0);
      el.size = 'tiny';
      jasmine.clock().uninstall();
      expect(window.getComputedStyle(el.nodes.avatar).display).toEqual("none");
      expect(window.getComputedStyle(el.nodes.presence).display).toEqual("block");
    });
  });

  describe("The getMenuItems property", function() {
    it("Should pass function to the menu button", function() {
      el.item = conversation;

      var spy = jasmine.createSpy('spy');
      el.getMenuItems = spy;
      expect(el.nodes.menuButton.getMenuItems).toBe(spy);
    });

    it("Should handle absence of menu button", function() {
      el.item = conversation;

      delete el.nodes.menuButton;
      var spy = jasmine.createSpy('spy');
      expect(function() {
        el.getMenuItems = spy;
      }).not.toThrow();
    });
  });

  describe("The onRerender() method", function() {
    it("Should setup layer-direct-message-conversation and layer-group-conversation", function() {
      conversation.addParticipants([user]);
      el.item = conversation;
      el.onRerender();
      expect(el.classList.contains('layer-direct-message-conversation')).toBe(true);
      expect(el.classList.contains('layer-group-conversation')).toBe(false);

      conversation.addParticipants([user, "zzz"]);
      el.onRerender();
      expect(el.classList.contains('layer-direct-message-conversation')).toBe(false);
      expect(el.classList.contains('layer-group-conversation')).toBe(true);
    });

    it("Should update the date", function() {
      el.item = conversation;
      el.onRerender();
      expect(el.nodes.date.date).toBe(null);

      var message = conversation.createMessage("hey").send();
      el.onRerender();
      expect(el.nodes.date.value).toEqual('Pending');

      message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
      el.onRerender();
      expect(el.nodes.date.date).toEqual(message.sentAt);

      message.destroy();
      el.onRerender();
      expect(el.nodes.date.date).toBe(null);
    });

    it("Should update layer-avatar users", function() {
      el.item = conversation;
      conversation.addParticipants(['layer:///identities/GandalfTheGruesome']);
      el.onRerender();
      expect(el.nodes.avatar.users).toEqual([client.getIdentity('layer:///identities/GandalfTheGruesome')]);
    });

    it("Should update layer-conversation-unread-messages class", function() {
      el.item = conversation;
      var message = new Layer.Core.Message({});
      message.isRead = false;
      conversation.lastMessage = message;
      el.onRerender();
      expect(el.classList.contains('layer-conversation-unread-messages')).toBe(true);

      conversation.lastMessage.isRead = true;
      el.onRerender();
      expect(el.classList.contains('layer-conversation-unread-messages')).toBe(false);
    });
  });

  describe("The _runFilter() method", function() {
    beforeEach(function() {
      el.item = conversation;
    });
    it("Should add layer-item-filtered if not a match", function() {
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('Samwise');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);
    });

    it("Should remove layer-item-filtered if it is a match", function() {
      el.classList.add('layer-item-filtered');
      el._runFilter('Frodo');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on substring against metadata.conversationName, displayName, firstName, lastName and emailAddress", function() {
      conversation.setMetadataProperties({conversationName: 'AraAcorn, returning king of squirrels'});
      el._runFilter('araacorn');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('WringRaith');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.firstName = 'Mojo';
      el._runFilter('MoJo');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('POJO');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.lastName = 'pojO';
      el._runFilter('POJO');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('pojo@layer');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.emailAddress = 'pojo@layer.com';
      el._runFilter('pojo@layer');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on RegEx against displayName, firstName, lastName and emailAddress", function() {
      conversation.setMetadataProperties({conversationName: 'AraAcorn, returning king of squirrels'});
      el._runFilter(/Araacorn/);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);
      el._runFilter(/AraAcorn/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/moJo/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.firstName = 'Mojo';
      el._runFilter(/moJo/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/POJO/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.lastName = 'pojO';
      el._runFilter(/POJO/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/pojo@layer/);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.emailAddress = 'pojo@layer.com';
      el._runFilter(/pojo@layer/);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on Callback against displayName, firstName, lastName and emailAddress", function() {
      conversation.setMetadataProperties({conversationName: 'AraAcorn, returning king of squirrels'});

      function test(conversation) {
        return conversation.metadata.conversationName == 'AraAcorn, returning king of squirrels';
      }
      el._runFilter(test);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      conversation.setMetadataProperties({conversationName: 'Frodo ala Modo'});
      el._runFilter(test);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);
    });

    it("Should match if no filter", function() {
      el._runFilter(null);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });
  });
});