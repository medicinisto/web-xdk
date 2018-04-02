/* eslint-disable */
describe('layer-conversation-list', function() {
  var el, testRoot, client, query;

  beforeAll(function(done) {
    if (Layer.UI.components['layer-conversation-view'] && !Layer.UI.components['layer-conversation-view'].classDef) Layer.UI.init({});
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
      isFullIdentity: true
    });
    client._clientAuthenticated();


    if (Layer.UI.components['layer-conversation-view'] && !Layer.UI.components['layer-conversation-view'].classDef) Layer.UI.init({});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-list');
    testRoot.appendChild(el);
    query = client.createQuery({
      model: Layer.Core.Query.Conversation,
      sortBy: [{ 'lastMessage.sentAt': 'desc' }]
    });
    query.isFiring = false;
    for (i = 0; i < 35; i++) {
      query.data.push(
        new Layer.Core.Conversation({
              participants: [client.user],
          id: 'layer:///conversations/c' + i,
          distinct: false,
          metadata: {conversationName: "C " + i}
        })
      );
    }
    el.query = query;
    Layer.Utils.defer.flush();
    jasmine.clock().tick(50);
    Layer.Utils.defer.flush();
    jasmine.clock().tick(50);

  });

  afterEach(function() {
    try {
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
    } catch(e) {}
  });

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  describe('Event Handling', function() {
    it("Should call onConversationSelected when layer-conversation-selected is triggered", function() {
      var spy = jasmine.createSpy('callback');
      el.onConversationSelected = spy;
      el.trigger('layer-conversation-selected', {conversation: query.data[1]});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });
  });

  describe("The sortBy property", function() {
    it("Should setup a proper values", function() {
      expect(query.sortBy).toEqual([{'lastMessage.sentAt': 'desc'}]);
      el.sortBy = Layer.UI.Constants.CONVERSATIONS_SORT.CREATED_AT;
      expect(el.sortBy).toEqual([{'createdAt': 'desc'}]);

      el.sortBy = Layer.UI.Constants.CONVERSATIONS_SORT.LAST_MESSAGE;
      expect(el.sortBy).toEqual([{'lastMessage.sentAt': 'desc'}]);
    });
  });

  describe("The filter property", function() {
    it("Should call _runFilter when set", function() {
      spyOn(el, "_runFilter");
      el.filter = "User";
      expect(el._runFilter).toHaveBeenCalledWith();
    });
  });


  describe("The created() method", function() {
    it("Should call _updateQuery if there is a queryId passed into the innerHTML", function() {
      testRoot.innerHTML = '<layer-conversation-list query-id="' + query.id + '" app-id="' + client.appId + '"></layer-conversation-list>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      var el = testRoot.firstChild;
      expect(el.query).toBe(query);

      // _updateQuery sets up the query listener to call _processQueryEvt
      spyOn(el, "_processQueryEvt");
      query.trigger('change');
      expect(el._processQueryEvt).toHaveBeenCalled();
    });

    it("Should call render", function() {
      testRoot.innerHTML = '<layer-conversation-list></layer-conversation-list>';
      CustomElements.takeRecords();
      var el = testRoot.firstChild;
      expect(el.nodes.loadIndicator).toEqual(jasmine.any(HTMLElement));
    });

    it("Should wire up onClick", function() {
      var selectSpy = jasmine.createSpy('click');
      el.addEventListener('layer-conversation-selected', selectSpy);
      click(el.childNodes[10]);
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("The onClick() method", function() {
    it("Should call evt.preventDefault and evt.stopPropagation ", function() {
      var preventDefaultSpy = jasmine.createSpy('preventDefault');
      var stopPropSpy = jasmine.createSpy('stopPropagation');
      el._onClick({
        target: el.childNodes[10],
        detail: {
          conversation: query.data[1]
        },
        stopPropagation: stopPropSpy,
        preventDefault: preventDefaultSpy
      });
      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(stopPropSpy).toHaveBeenCalledWith();
    });

    it("Should trigger layer-conversation-selected and update selectedConversationId if not canceled", function() {
      el.selectedConversationId = null;
      var called = false;
      el.addEventListener('layer-conversation-selected', function(evt) {
        called = true;
        //evt.preventDefault();
      });

      var preventDefaultSpy = jasmine.createSpy('preventDefault');
      var stopPropSpy = jasmine.createSpy('stopPropagation');
      el._onClick({
        target: el.childNodes[10],
        detail: {
          conversation: query.data[10]
        },
        stopPropagation: stopPropSpy,
        preventDefault: preventDefaultSpy
      });
      expect(called).toBe(true);
      expect(stopPropSpy).toHaveBeenCalledWith();
      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(el.selectedConversationId).toBe(query.data[10].id);
    });

    it("Should trigger layer-conversation-selected and not update selectedConversationId if canceled", function() {
      el.selectedConversationId = null;
      var called = false;
      el.addEventListener('layer-conversation-selected', function(evt) {
        called = true;
        evt.preventDefault();
      });
      var preventDefaultSpy = jasmine.createSpy('preventDefault');
      var stopPropSpy = jasmine.createSpy('stopPropagation');

      el._onClick({
        target: el.childNodes[10],
        detail: {
          conversation: query.data[10]
        },
        stopPropagation: stopPropSpy,
        preventDefault: preventDefaultSpy
      });
      expect(called).toBe(true);
      expect(stopPropSpy).toHaveBeenCalledWith();
      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(el.selectedConversationId).toBe(null);
    });
  });

  describe("The _generateItem() method", function() {
    it("Should return a layer-conversation-item with a conversation setup", function() {
      var result = el._generateItem(query.data[10]);
      expect(result.tagName).toEqual('LAYER-CONVERSATION-ITEM');
      expect(result.item).toBe(query.data[10]);
    });

    it("Should return a layer-channel-item with a channel setup", function() {
      var result = el._generateItem(client.createChannel({name: "hey"}));
      expect(result.tagName).toEqual('LAYER-CHANNEL-ITEM');
    });

    it("Should set getMenuItems callback", function() {
      var spy = jasmine.createSpy('menuOptions');
      el.getMenuItems = spy;
      var result = el._generateItem(query.data[1]);
      Layer.Utils.defer.flush();
      expect(result.getMenuItems).toBe(spy);
    });

    it("Should set size", function() {
      el.size = "small";
      var result = el._generateItem(query.data[1]);
      Layer.Utils.defer.flush();
      expect(result.size).toEqual("small");
    });

    it("Should set dateFormat", function() {
      el.dateFormat = {year: "number"};
      var result = el._generateItem(query.data[1]);
      Layer.Utils.defer.flush();
      expect(result.dateFormat).toEqual({year: "number"});
    });

    it("Should run the filter", function() {
      el.filter = 'Not this again';
      var result = el._generateItem(query.data[10]);
      Layer.Utils.defer.flush();
      expect(result.classList.contains('layer-item-filtered')).toBe(true);
    });
  });

  describe("The onRerender() method", function() {
    it("Should call _processQueryEvt", function() {
      spyOn(el, "_processQueryEvt");
      var evt = {};
      el.onRerender(evt);
      expect(el._processQueryEvt).toHaveBeenCalledWith(evt);
    });
  });

  describe("The _runFilter() method", function() {
    it("Should flag all nodes as unfiltered if there is no filter", function() {
      el.childNodes[1].classList.add('layer-item-filtered');
      el.childNodes[2].classList.add('layer-item-filtered');
      el._runFilter('');
      expect(el.querySelectorAllArray('.layer-item-filtered')).toEqual([]);
    });

    it("Should call _runFilter on all children", function() {
      el.childNodes[1].classList.add('layer-item-filtered');
      el.childNodes[2].classList.add('layer-item-filtered');
      el.filter = 'C 25';
      expect(el.querySelectorAllArray('layer-conversation-item:not(.layer-item-filtered)')).toEqual([el.childNodes[25]]);
    });
  });
});