/* eslint-disable */
describe('layer-conversation-title', function() {
  var el, testRoot, client, conversation, user2, user3;

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
    user2 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      firstName: 'Sauruman',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });
    user3 = new Layer.Core.Identity({
      userId: 'GandalfTheGruesome',
      displayName: 'Gandalf the Gruesome',
      id: 'layer:///identities/GandalfTheGruesome',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-title');
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    jasmine.clock().uninstall();

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
      conversation.trigger('conversations:change', {property: 'unreadCount', oldValue: 5, newValue: 6});
      expect(el.onRerender).toHaveBeenCalledWith(jasmine.any(Layer.Core.LayerEvent));
    });

    it("Should unwire up the onRerender event if prior Conversation", function() {
      spyOn(el, "onRerender");
      el.item = conversation;
      el.item = null;
      el.onRerender.calls.reset();
      conversation.trigger('conversations:change', {property: 'unreadCount', oldValue: 5, newValue: 6});
      expect(el.onRerender).not.toHaveBeenCalled();
    });
  });

  describe("The onRerender() method", function() {
    it("Should clear the label if no item", function(){
      el.item = conversation;
      expect(el.innerHTML).not.toEqual('');
      el.item = null;
      expect(el.innerHTML).toEqual('');
    });

    it("Should use metadata.conversationName", function() {
      el.item = conversation;
      conversation.setMetadataProperties({conversationName: "Gandalf the Gruesome"});
      jasmine.clock().tick(1);
      expect(el.innerHTML).toEqual("Gandalf the Gruesome");
    });

    it("Should use displayName or firstName or lastName if one-on-one conversation", function() {
      conversation.participants = [new Layer.Core.Identity({
          userId: 'AAA',
        displayName: 'display',
        firstName: "first",
        lastName: "last",
        id: 'layer:///identities/AAA',
        isMine: false
      })];
      conversation.metadata = {};
      el.item = conversation;
      el.onRender();
      expect(el.innerHTML).toEqual('display');

      conversation.participants[0].displayName = '';
      el.onRender();
      expect(el.innerHTML).toEqual('first');

      conversation.participants[0].firstName = '';
      el.onRender();
      expect(el.innerHTML).toEqual('last');

      conversation.participants[0].lastName = '';
      el.onRender();
      expect(el.innerHTML).toEqual('No Title');
    });

    it("Should use _sortNames to list participants names favoring first or last names", function() {
      spyOn(el, "_sortNames").and.callThrough();
      conversation.metdata = {};
      el.item = conversation;
      conversation.addParticipants([user3]);
      jasmine.clock().tick(1);
      expect(el.innerHTML).toEqual(user2.firstName + ', ' + user3.displayName);

      user3.lastName = 'Hey';
      el.onRerender();
      expect(el.innerHTML).toEqual(user2.firstName + ', ' + user3.lastName);

      // For this state it should treat it as though there were a single user, and therefore use the displayName
      user3.lastName = user3.displayName = '';
      el.onRerender();
      expect(el.innerHTML).toEqual(user2.displayName);
    });

    it("Should just show No Title", function() {
      conversation.metdata = {};
      el.item = conversation;
      conversation.removeParticipants([user2]);
      jasmine.clock().tick(1);
      expect(el.innerHTML).toEqual("No Title");
    });
  });

  describe("The _sortNames method", function() {
    var results;
    beforeEach(function() {
      conversation.participants = [
        client.user,
        new Layer.Core.Identity({
              userId: 'A',
          id: 'layer:///identities/A',
        }),
        new Layer.Core.Identity({
              userId: 'B',
          id: 'layer:///identities/B',
          displayName: "B"
        }),
        new Layer.Core.Identity({
              userId: 'bot',
          id: 'layer:///identities/bot',
          firstName: "bot",
          type: "bot"
        }),
        new Layer.Core.Identity({
              userId: 'D',
          id: 'layer:///identities/D',
          lastName: "D"
        }),
      ];
      el.item = conversation;
      results = el._sortNames();
    });

    it("Should remove the session owner", function() {
      expect(results.indexOf(client.user)).toEqual(-1);
    });

    it("Should put the bot last", function() {
      expect(results[results.length - 1].userId).toEqual('bot');
    });

    it("Should not list anonymous user", function() {
      expect(results.indexOf(client.getIdentity('A'))).toEqual(-1);
    });

    it("Should put users with first/last names before users with display names", function() {
      expect(results[0].lastName).toEqual("D");
      expect(results[1].displayName).toEqual("B");
    });
  });
});