/* eslint-disable */
describe("The Message Type Response Summary class", function() {
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
      client.userId = "999";
      client.user = new Layer.Core.Identity({userId: 'userA'});


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

  describe("The constructor", function() {
    it("Should initialize _trackers", function() {
      expect(new Layer.Core.MessageTypeResponseSummary({})._trackers).toEqual({});
    });
  });

  describe("The getState() method", function() {
    var parentModel, model, userId1, userId2;
    beforeEach(function() {
      parentModel = new Layer.Core.MessageTypeModel({});
      model = parentModel.responses;
      model.registerState('frodo', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);
      model.registerState('sauruman', Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS);
      model.registerState('hey', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);
      var body = {};
      body[user2.id] = {};
      body[user2.id].frodo = {
        adds: [{value: 'modo', ids: ['aaaa']}],
        removes: []
      };
      body[user2.id].sauruman = {
        adds: [{value: 'nincompoop2', ids: ['aaaa']}],
        removes: []
      };

      model.parseResponsePart(new Layer.Core.MessagePart({
        mimeType: Layer.Constants.STANDARD_MIME_TYPES.RESPONSESUMMARY,
        body: JSON.stringify(body),
      }));
      model.addState('frodo', 'dodo');
      model.addState('sauruman', 'nincompoop');
    });

    afterEach(function() {
      model.destroy();
    });
    it("Should return the specified result", function() {
      expect(model.getState('frodo', user1.id)).toEqual("dodo");
      expect(model.getState('frodo', user2.id)).toEqual("modo");
    });

    it("Should throw error if key is not registered", function() {
      expect(function() {
        expect(model.getState('bilbo', user1.id)).toBe(null);
      }).toThrowError(Layer.Core.LayerError.ErrorDictionary.modelStateNotRegistered);
    });

    it("Should return null if identity has no entry", function() {
      expect(model.getState('frodo', 'layer:///identities/userC')).toBe(null);
    });
  });

  describe("The getStates() method", function() {
    var model, parentModel;
    beforeEach(function() {
      parentModel = new Layer.Core.MessageTypeModel({});
      model = parentModel.responses;
      model.registerState('frodo', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);
      model.registerState('sauruman', Layer.Constants.CRDT_TYPES.LAST_WRITER_WINS);
      model.registerState('bilbo', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);

      var body = {};
      body[user2.id] = {};
      body[user2.id].frodo = {
        adds: [{value: 'modo', ids: ['bbbb']}],
        removes: []
      };
      body[user2.id].bilbo = {
        adds: [{value: 'bagged', ids: ['ccccc']}],
        removes: []
      };

      model.parseResponsePart(new Layer.Core.MessagePart({
        mimeType: Layer.Constants.STANDARD_MIME_TYPES.RESPONSESUMMARY,
        body: JSON.stringify(body),
      }));

      model.addState('frodo', 'dodo');
      model.addState('sauruman', 'nincompoop');
    });
    afterEach(function() {
      model.destroy();
    });

    it("Should return all values of frodo", function() {
      expect(model.getStates('frodo', [user1.id, user2.id])).toEqual([
        {identityId: user1.id, value: 'dodo'},
        {identityId: user2.id, value: 'modo'}
      ]);
    });

    it("Should return all values of frodo for userB", function() {
      expect(model.getStates('frodo', [user2.id])).toEqual([
        {identityId: user2.id, value: 'modo'}
      ]);
    });

    it("Should return one value for bilbo and one for sauruman", function() {
      expect(model.getStates('bilbo', [user1.id, user2.id])).toEqual([
        {identityId: user2.id, value: 'bagged'}
      ]);

      expect(model.getStates('sauruman', [user1.id, user2.id])).toEqual([
        {identityId: user1.id, value: 'nincompoop'}
      ]);
    });

    it("Should return one value for bilbo and zero for sauruman for user2", function() {
      expect(model.getStates('bilbo', [user2.id])).toEqual([
        {identityId: user2.id, value: 'bagged'}
      ]);

      expect(model.getStates('sauruman', [user2.id])).toEqual([
      ]);
    });
  });

  describe("The MultiIdentityStateTrackers", function() {
    it("Should create one per registered state", function() {
      // test 1
      var model = new Layer.Core.MessageTypeModel({});
      expect(model.responses._trackers).toEqual({});

      // test 2
      model.responses.registerState('hey', Layer.Constants.CRDT_TYPES.FIRST_WRITER_WINS);
      expect(model.responses._trackers).toEqual({
        hey: jasmine.any(Layer.Core.CRDT.CRDTMultiIdentityStateTracker)
      });

      // test 3
      model.responses.registerState('ho', Layer.Constants.CRDT_TYPES.SET);
      expect(model.responses._trackers).toEqual({
        hey: jasmine.any(Layer.Core.CRDT.CRDTMultiIdentityStateTracker),
        ho: jasmine.any(Layer.Core.CRDT.CRDTMultiIdentityStateTracker)
      });
    });
  });
});
