/* eslint-disable */
describe("The Multi Identity CRDT Tracker class", function() {
  var appId = "Fred's App";
  var conversation,
      client,
      user1, user2,
      requests;

  afterAll(function() {

  });

  beforeEach(function() {
      jasmine.Ajax.install();
      requests = jasmine.Ajax.requests;
      client = new Layer.init({
          appId: appId,
          url: "https://doh.com"
      }).on('challenge', function() {});
      client.userId = "frodo";
      client.user = new Layer.Core.Identity({userId: 'frodo'});


      client._clientAuthenticated();
      client._clientReady();
      client.onlineManager.isOnline = true;

      user1 = client.user;
      user2 = new Layer.Core.Identity({userId: 'userB'});

      conversation = Layer.Core.Conversation._createFromServer(responses.conversation2).conversation;
      requests.reset();
      client.syncManager.queue = [];
  });
  afterEach(function() {
      client.destroy();
      jasmine.Ajax.uninstall();
  });

  it("Should initalize with users, name and type", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    expect(tracker.name).toEqual("fred");
    expect(tracker.type).toEqual("Set");
    expect(tracker.users).toEqual({});
  });

  it("Should reject invalid state types", function() {
    expect(function() {
      var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
        name: "fred",
        type: "fred"
      });
    }).toThrowError(Layer.Core.LayerError.ErrorDictionary.invalidCRDTType);
    expect(Layer.Core.LayerError.ErrorDictionary.invalidCRDTType).toEqual(jasmine.any(String));
  });

  it("Should add a user", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    tracker._addUser("layer:///identities/frodo");
    expect(tracker.users).toEqual({
      'layer:///identities/frodo': jasmine.any(Layer.Core.CRDT.CRDTStateTracker)
    });
  });

  it("Should add a user on adding a value", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    tracker.addValue("hey");
    expect(tracker.users).toEqual({
      'layer:///identities/frodo': jasmine.any(Layer.Core.CRDT.CRDTStateTracker)
    });
  });

  it("Should add a user on removing a value", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    tracker.removeValue("hey");
    expect(tracker.users).toEqual({
      'layer:///identities/frodo': jasmine.any(Layer.Core.CRDT.CRDTStateTracker)
    });
  });

  it("Should return suitable value or null", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    tracker._addUser("layer:///identities/frodo");
    tracker.users['layer:///identities/frodo'].add("dodo");

    // Test returning for an existing user:
    expect(tracker.getValue('layer:///identities/frodo')).toEqual(['dodo']);

    // Test returning for non-present user:
    expect(tracker.getValue('layer:///identities/frodo1')).toEqual([]);
  });

  it("Should return suitable collection of values and ommit missing users", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.SET
    });
    tracker._addUser("layer:///identities/frodo");
    tracker.users['layer:///identities/frodo'].add("dodo");
    tracker._addUser("layer:///identities/sauruman");
    tracker.users['layer:///identities/sauruman'].add("wise");
    tracker._addUser("layer:///identities/sauron");

    expect(tracker.getValues([
      new Layer.Core.Identity({userId: 'frodo'}).id,
      new Layer.Core.Identity({userId: 'sauruman'}).id,
      new Layer.Core.Identity({userId: 'sauron'}).id,
      new Layer.Core.Identity({userId: 'frodo2'}).id
    ])).toEqual([
      {identityId: 'layer:///identities/frodo', value: ['dodo']},
      {identityId: 'layer:///identities/sauruman', value: ['wise']},
      {identityId: 'layer:///identities/sauron', value: []},
    ]);
  });


  it("Should remove the value", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS_NULLABLE
    });

    tracker.addValue("dodo");
    expect(tracker.getValue('layer:///identities/frodo')).toEqual("dodo");

    tracker.removeValue("dodo");
    expect(tracker.getValue('layer:///identities/frodo')).toEqual(null);
  });

  it("Should not remove the value", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS
    });

    tracker.addValue("dodo");
    expect(tracker.getValue('layer:///identities/frodo')).toEqual("dodo");

    tracker.removeValue("dodo");
    expect(tracker.getValue('layer:///identities/frodo')).toEqual("dodo");
  });

  it("Should sync all of its users", function() {
    var tracker = new Layer.Core.CRDT.CRDTMultiIdentityStateTracker({
      name: "fred",
      type: Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS
    });
    tracker.addValue("hey");
    spyOn(tracker.users['layer:///identities/frodo'], "synchronize").and.callThrough();

    var obj = {
      'layer:///identities/frodo': {
        fred: {
          removes: ["abc"],
          adds: []
        }
      }
    };
    tracker.synchronize(obj);
    expect(tracker.users['layer:///identities/frodo'].synchronize).toHaveBeenCalledWith(obj);
  });
});
