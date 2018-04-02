/* eslint-disable */
describe("List Selection Mixin", function() {

  var el, testRoot, client, query;

  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-list');
    testRoot.appendChild(el);
    query = client.createQuery({
      model: Layer.Core.Query.Conversation
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
      jasmine.clock().uninstall();
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
      if (client) client.destroy();
    } catch(e) {}
  });


  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.click();
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  describe("The selectedId property", function() {
    it("Should set isSelected for the specified item", function() {
      expect(el.childNodes[5].isSelected).toBe(false);
      el.selectedId = el.childNodes[5].item.id;
      expect(el.childNodes[5].isSelected).toBe(true);
    });

    it("Should clear isSelected for the last selected item", function() {
      el.selectedId = el.childNodes[5].item.id;
      expect(el.childNodes[5].isSelected).toBe(true);
      expect(el.selectedId).toEqual(el.childNodes[5].item.id);
      el.selectedId = el.childNodes[6].item.id;
      expect(el.childNodes[5].isSelected).toBe(false);
    });

    it("Should set isSelected when generating items", function() {
      var query2 = new Layer.Core.Query({
        });
      el.query = query2;
      expect(el.childNodes.length).toBe(1);
      el.selectedId = query.data[5].id;
      el.query = query;
      expect(el.childNodes[5].isSelected).toBe(true);
    });

    it("Should trigger change events", function() {
      var calledWith;
      document.addEventListener('layer-conversation-selected', function(evt) {calledWith = evt;});
      el.selectedId = el.childNodes[5].item.id;
      expect(el.childNodes[5].isSelected).toBe(true);
      expect(calledWith.detail).toEqual({
        item: el.childNodes[5].item
      });
    });

    it("Should be cancelable trigger", function() {
      var f = function(evt) {evt.preventDefault();};
      document.addEventListener('layer-conversation-selected', f);
      el.selectedId = el.childNodes[5].item.id;
      expect(el.childNodes[5].isSelected).toBe(false);
      expect(el.selectedId).not.toEqual(el.childNodes[5].item.id);
      document.removeEventListener('layer-conversation-selected', f);
    });
  });

  describe("User Selection Handling", function() {
    it("Should wire up _onClick and onClick", function() {
      spyOn(el, "onClick");
      click(el);
      expect(el.onClick).toHaveBeenCalled();
    });

    it("Should trigger a cancelable event", function() {
      el.addEventListener('layer-conversation-selected', function(evt) {
        evt.preventDefault();
        expect(evt.detail).toEqual({
          item: el.childNodes[5].item,
        });
      });
      click(el.childNodes[5]);
      expect(el.childNodes[5].isSelected).toBe(false);
    });

    it("Should select the item if not canceled", function() {
      click(el.childNodes[5]);
      expect(el.childNodes[5].isSelected).toBe(true);
    });

    it("Should call onClick", function() {
      spyOn(el, "onClick");
      click(el);
      expect(el.onClick).toHaveBeenCalledWith(jasmine.any(Event));
    });
  });
});
