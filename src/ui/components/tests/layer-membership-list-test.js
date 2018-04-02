/* eslint-disable */
describe('layer-membership-list', function() {
  var el, testRoot, client, query, channel;

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
      isFullIdentity: true
    });
    client._clientAuthenticated();

    channel = client.createChannel({
      name: "Frodo"
    });
    channel.syncState = Layer.Constants.SYNC_STATE.SYCNED;

    if (!Layer.UI.components['layer-conversation-view']) Layer.UI.init({layer: layer});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-membership-list');
    testRoot.appendChild(el);
    query = client.createQuery({
      model: Layer.Core.Query.Membership
    });
    query.isFiring = false;
    query.data = [];
    for (i = 0; i < 35; i++) {

        var ident = new Layer.Core.Identity({
              userId: 'user' + i,
          id: 'layer:///identities/user' + i,
          displayName: 'User ' + i,
          isFullIdentity: true
        })
      query.data.push(
        new Layer.Core.Membership({
              identity: ident
        })
      );
    }

    el.query = query;
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
    Layer.Utils.defer.flush();
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
      Layer.UI.settings.appId = null;
      document.body.removeChild(testRoot);
    } catch(e) {}
  });



  describe("The filter property", function() {
    it("Should call _runFilter when set", function() {
      spyOn(el, "_runFilter");
      el.filter = "Member";
      expect(el._runFilter).toHaveBeenCalledWith();
    });
  });

  describe("The channelId property", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-membership-list></layer-membership-list>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should ignore if not a properly formatted id", function() {
      el.channelId = 'Frodo';
      expect(el.channelId).toEqual('');
    });

    it("Should call the channel setter if there is a client", function() {
      el.client = client;
      expect(el.channelId).toEqual(null);;
      el.channelId = channel.id;
      expect(el.channelId).toEqual(channel.id);
    });
  });

  describe("The channel property", function() {
    it("Should reject non-channel values", function() {
      el.channel = client.createConversation({participants: []});
      expect(el.channel).toBe(null);
    });

    it("Should update the query", function() {
      expect(el.query.predicate).toEqual("");
      el.channel = channel;
      expect(el.query.predicate).toEqual("channel.id = '" + channel.id + "'");
    });
  });

  describe("The created() method", function() {
    it("Should call _updateQuery if there is a queryId passed into the innerHTML", function() {
      testRoot.innerHTML = '<layer-membership-list query-id="' + query.id + '" app-id="' + client.appId + '"></layer-membership-list>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      var el = testRoot.firstChild;
      expect(el.query).toBe(query);
      spyOn(el, "_processQueryEvt"); // _updateQuery sets up the query listener to call _processQueryEvt
      query.trigger('change');
      expect(el._processQueryEvt).toHaveBeenCalled();
    });

    it("Should call render", function() {
      testRoot.innerHTML = '<layer-membership-list></layer-membership-list>';
      CustomElements.takeRecords();
      var el = testRoot.firstChild;
      expect(el.nodes.loadIndicator).toEqual(jasmine.any(HTMLElement));
    });
  });

  describe("The _generateItem() method", function() {
    it("Should return a layer-membership-item with an identity setup", function() {
      var result = el._generateItem(query.data[1]);
      expect(result.tagName).toEqual('LAYER-MEMBERSHIP-ITEM');
      expect(result.item).toBe(query.data[1]);
    });

    it("Should run the filter", function() {
      el.filter = 'Not this again';
      var result = el._generateItem(query.data[1]);
      expect(result.classList.contains('layer-item-filtered')).toBe(true);
    });
  });

  describe("The _processQueryEvt() method", function() {
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
      el.filter = 'User 4';
      expect(el.querySelectorAllArray('layer-membership-item:not(.layer-item-filtered)')[0]).toBe(el.childNodes[5]);
    });
  });
});