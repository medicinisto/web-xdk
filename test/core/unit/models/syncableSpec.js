/*eslint-disable */
describe("The Syncable Class", function() {
    var appId = "Fred's App";

    var conversation,
        message,
        announcement,
        client,
        requests,
        getObjectResult;

    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        });
        client.sessionToken = "sessionToken";
        client.user = new Layer.Core.Identity({
          userId: "Frodo",
          id: "layer:///identities/" + client.userId,
          firstName: "first",
          lastName: "last",
          phoneNumber: "phone",
          emailAddress: "email",
          metadata: {},
          publicKey: "public",
          avatarUrl: "avatar",
          displayName: "display",
          syncState: Layer.Constants.SYNC_STATE.SYNCED,
          isFullIdentity: true,
          isMine: true
        });
        client.isTrustedDevice = true;
        client._clientAuthenticated();
        getObjectResult = null;
        spyOn(client.dbManager, "getObject").and.callFake(function(tableName, ids, callback) {
            setTimeout(function() {
                callback(getObjectResult);
            }, 10);
        });
        client._clientReady();

        conversation = client._createObject(responses.conversation1);
        message = client._createObject(responses.message1);
        announcement = client._createObject(responses.announcement);
        requests.reset();
        client.syncManager.queue = [];
        jasmine.clock().tick(11);
    });

    afterEach(function() {
        client.destroy();
        jasmine.Ajax.uninstall();
        jasmine.clock().uninstall();
    });

    afterAll(function() {

    });


    describe("The load() method", function() {
      describe("Message subclass", function() {
        it("Should return a Message", function() {
          expect(Layer.Core.Message.load(responses.message1.id) instanceof Layer.Core.Message).toEqual(true);
          expect(Layer.Core.Message.load(responses.message1.id) instanceof Layer.Core.Announcement).toEqual(false);
          expect(Layer.Core.Syncable.load(responses.message1.id) instanceof Layer.Core.Message).toEqual(true);
        });

        it("Should call dbManager.getObject", function() {
          client.dbManager.getObject.calls.reset();

          // Run
          Layer.Core.Message.load(responses.message1.id);

          // Posttest
          expect(client.dbManager.getObject).toHaveBeenCalledWith('messages', responses.message1.id, jasmine.any(Function));
        });

        it("Should populateFromServer and trigger loaded if db has data", function() {
            getObjectResult = {parts: []};

            // Run
            var ident = Layer.Core.Message.load(responses.message1.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "trigger");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).toHaveBeenCalledWith({parts: []});
            expect(ident.trigger).toHaveBeenCalledWith('loaded');
        });

        it("Should call _load", function() {
            // Run
            var ident = Layer.Core.Message.load(responses.message1.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "_load");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).not.toHaveBeenCalled();
            expect(ident._load).toHaveBeenCalledWith();
        });

        it("Should call _load once client is ready", function() {
            client.isReady = false;
            var ident = Layer.Core.Message.load(responses.message1.id);
            spyOn(ident, "_load");
            jasmine.clock().tick(11);

            // Midtest
            expect(ident._load).not.toHaveBeenCalled();

            // Posttest
            client._clientReady();
            expect(ident._load).toHaveBeenCalledWith();
        });

        it("Should call _load once client is ready for new client", function() {
            var _load = Layer.Core.Message.prototype._load;
            Layer.Core.Message.prototype._load = jasmine.createSpy('load');
            client = new Layer.Core.Client({
                appId: appId,
                url: "https://huh.com"
            });

            var ident = Layer.Core.Message.load(responses.message1.id);

            // Midtest
            expect(Layer.Core.Message.prototype._load).not.toHaveBeenCalled();

            // Posttest
            client.user = new Layer.Core.Identity({
                      userId: "Frodo",
                id: "layer:///identities/" + client.userId,
                firstName: "first",
                lastName: "last",
                phoneNumber: "phone",
                emailAddress: "email",
                metadata: {},
                publicKey: "public",
                avatarUrl: "avatar",
                displayName: "display",
                syncState: Layer.Constants.SYNC_STATE.SYNCED,
                isFullIdentity: true,
                isMine: true
            });
            client._clientAuthenticated();
            client._clientReady();
            expect(Layer.Core.Message.prototype._load).toHaveBeenCalledWith();

            // Restore
            Layer.Core.Message.prototype._load = _load;
        });
      });

      describe("Announcement subclass", function() {
        it("Should return an Announcement", function() {
          expect(Layer.Core.Announcement.load(responses.announcement.id) instanceof Layer.Core.Announcement).toEqual(true);
          expect(Layer.Core.Syncable.load(responses.announcement.id) instanceof Layer.Core.Announcement).toEqual(true);
        });


        it("Should populateFromServer and trigger loaded if db has data", function() {
            getObjectResult = {parts: []};

            // Run
            var ident = Layer.Core.Announcement.load(responses.announcement.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "trigger");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).toHaveBeenCalledWith({parts: []});
            expect(ident.trigger).toHaveBeenCalledWith('loaded');
        });

        it("Should call _load", function() {

            // Run
            var ident = Layer.Core.Announcement.load(responses.announcement.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "_load");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).not.toHaveBeenCalled();
            expect(ident._load).toHaveBeenCalledWith();
        });
      });

      describe("Conversation subclass", function() {
        it("Should return a Conversation", function() {
          expect(Layer.Core.Conversation.load(responses.conversation1.id) instanceof Layer.Core.Conversation).toEqual(true);
          expect(Layer.Core.Syncable.load(responses.conversation1.id) instanceof Layer.Core.Conversation).toEqual(true);
        });

        it("Should populateFromServer and trigger loaded if db has data", function() {
            getObjectResult = {participants: []};

            // Run
            var ident = Layer.Core.Conversation.load(responses.conversation1.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "trigger");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).toHaveBeenCalledWith({participants: []});
            expect(ident.trigger).toHaveBeenCalledWith('loaded');
        });

        it("Should call _load", function() {

            // Run
            var ident = Layer.Core.Conversation.load(responses.conversation1.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "_load");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).not.toHaveBeenCalled();
            expect(ident._load).toHaveBeenCalledWith();
        });
      });

      describe("Identity subclass", function() {
        it("Should return an Identity", function() {
          expect(Layer.Core.Identity.load(responses.useridentity.id) instanceof Layer.Core.Identity).toEqual(true);
          expect(Layer.Core.Syncable.load(responses.useridentity.id) instanceof Layer.Core.Identity).toEqual(true);
        });

        it("Should populateFromServer and trigger loaded if db has data", function() {
            getObjectResult = {display_name: "hey ho"};

            // Run
            var ident = Layer.Core.Identity.load(responses.useridentity.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "trigger");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).toHaveBeenCalledWith({display_name: "hey ho"});
            expect(ident.trigger).toHaveBeenCalledWith('loaded');
        });

        it("Should call _load", function() {
            // Run
            var ident = Layer.Core.Identity.load(responses.useridentity.id);
            spyOn(ident, "_populateFromServer");
            spyOn(ident, "_load");
            jasmine.clock().tick(11);

            // Posttest
            expect(ident._populateFromServer).not.toHaveBeenCalled();
            expect(ident._load).toHaveBeenCalledWith();
        });
      });
    });



    describe("The _load() method", function() {
        it("Should set the syncState to LOADING", function() {
            conversation._load();
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.LOADING);
            expect(Layer.Constants.SYNC_STATE.LOADING).toEqual(jasmine.any(String));
        });

        it("Should call _xhr", function() {
            // Setup
            spyOn(conversation, "_xhr");

            // Run
            conversation._load();

            // Posttest
            expect(conversation._xhr).toHaveBeenCalledWith({
                method: "GET",
                sync: false
            }, jasmine.any(Function));
            expect(conversation.url.length > 0).toBe(true);
        });

        it("Should call _loadResult()", function() {
            spyOn(conversation, "_loadResult");

            // Run
            conversation._load();
            var r = requests.mostRecent();
            r.response({
                responseText: JSON.stringify({hey: "ho"}),
                status: 200
            });

            // Posttest
            expect(conversation._loadResult).toHaveBeenCalledWith(jasmine.objectContaining({
                data: {hey: "ho"}
            }));
        });

        it("Should set the isLoading property", function() {
            expect(conversation.isLoading).toBe(false);
            conversation._load();
            expect(conversation.isLoading).toBe(true);
        });
    });

    describe("The _loadResult() method", function() {
        it("Should trigger messages:loaded-error on error", function() {
            // Setup
            spyOn(message, "_triggerAsync");

            // Run
            message._loadResult({success: false, data: "Argh"});

            // Posttest
            expect(message._triggerAsync).toHaveBeenCalledWith(
                "loaded-error", {
                    error: "Argh"
                });
        });

        it("Should trigger messages:loaded-error on error for announcement", function() {
            // Setup
            spyOn(announcement, "_triggerAsync");

            // Run
            announcement._loadResult({success: false, data: "Argh"});

            // Posttest
            expect(announcement._triggerAsync).toHaveBeenCalledWith(
                "loaded-error", {
                    error: "Argh"
                });
        });

        it("Should trigger conversations:loaded-error on error", function() {
            // Setup
            spyOn(conversation, "_triggerAsync");

            // Run
            conversation._loadResult({success: false, data: "Argh"});

            // Posttest
            expect(conversation._triggerAsync).toHaveBeenCalledWith(
                "loaded-error", {
                    error: "Argh"
                });
        });

        it("Should call destroy on error", function() {
            // Setup
            spyOn(conversation, "destroy");

            // Run
            conversation._loadResult({success: false, response: "Argh"});
            expect(conversation.destroy).not.toHaveBeenCalledWith();

            // Posttest
            jasmine.clock().tick(200);
            expect(conversation.destroy).toHaveBeenCalledWith();
        });

        it("Should call _populateFromServer on success with events disabled", function() {
            // Setup
            spyOn(conversation, "_populateFromServer");
            spyOn(conversation, '_triggerAsync');

            // Run
            conversation._loadResult({success: true, data: "Argh"});

            // Posttest
            expect(conversation._populateFromServer).toHaveBeenCalledWith("Argh");
            expect(conversation._triggerAsync).not.toHaveBeenCalled();
        });

        it("Should call _addConversation if conversation success", function() {
            // Setup
            spyOn(client, "_addConversation");

            // Run
            conversation._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.conversation1))
            });

            // Posttest
            expect(client._addConversation).toHaveBeenCalledWith(conversation);
        });

        it("Should call _addMessage if message success", function() {
            // Setup
            spyOn(client, "_addMessage");
            message.conversationId = '';

            // Run
            message._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.message1))
            });

            // Posttest
            expect(client._addMessage).toHaveBeenCalledWith(message);
            expect(message.conversationId).toEqual(responses.message1.conversation.id);
        });

        it("Should call _addMessage if announcement success", function() {
            // Setup
            spyOn(client, "_addMessage");
            announcement.conversationId = '';

            // Run
            announcement._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.announcement))
            });

            // Posttest
            expect(client._addMessage).toHaveBeenCalledWith(announcement);
            expect(announcement.conversationId).toEqual('');
        });

        it("Should trigger conversations:loaded if success", function() {
            // Setup
            spyOn(conversation, "trigger");

            // Run
            conversation._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.conversation1))
            });

            // Posttest
            expect(conversation.trigger).toHaveBeenCalledWith("loaded");
        });

        it("Should trigger messages:loaded if success", function() {
            // Setup
            spyOn(message, "trigger");

            // Run
            message._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.message1))
            });

            // Posttest
            expect(message.trigger).toHaveBeenCalledWith("loaded");
        });


        it("Should clear the isLoading property on success", function() {
            conversation._load();
            conversation._loadResult({
                success: true,
                data: JSON.parse(JSON.stringify(responses.conversation1))
            });
            expect(conversation.isLoading).toBe(false);
        });

        it("Should clear the isLoading property on error", function() {
            conversation._load();
            conversation._loadResult({
                success: false,
                data: {}
            });
            expect(conversation.isLoading).toBe(false);
        });
    });

    describe("_handleWebsocketDelete", function() {
      it("Should call _deleted", function() {
         spyOn(message, "_deleted");
         message._handleWebsocketDelete();
         expect(message._deleted).toHaveBeenCalledWith();
      });

      it("Should call destroy", function() {
         message._handleWebsocketDelete();
         expect(message.isDestroyed).toBe(true);
      });
    });

    describe("The _setSyncing() method", function() {
        var conversation;
        beforeEach(function() {
            conversation = client.createConversation({
                participants: ["a"],
                distinct: false
            });
        });
        afterEach(function() {
            conversation.destroy();
        });

        it("Initial sync state is NEW / 0", function() {
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.NEW);
            expect(conversation._syncCounter).toEqual(0);
        });

        it("Sets syncState to SAVING if syncState is NEW and _syncCounter=0", function() {

            // Run
            conversation._setSyncing();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SAVING);
            expect(conversation._syncCounter).toEqual(1);
        });

        it("Sets syncState to SAVING if syncState is NEW and increments the counter", function() {
            // Setup
            conversation._syncCounter = 500;

            // Run
            conversation._setSyncing();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SAVING);
            expect(conversation._syncCounter).toEqual(501);
        });

        it("Sets syncState to SAVING if syncState is SAVING and inc _syncCounter", function() {
            // Setup
            conversation._syncCounter = 500;
            conversation.syncState = Layer.Constants.SYNC_STATE.SAVING;

            // Run
            conversation._setSyncing();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SAVING);
            expect(conversation._syncCounter).toEqual(501);
        });

        it("Sets syncState to SYNCING if syncState is SYNCED and inc _syncCounter", function() {
            // Setup
            conversation.syncState = Layer.Constants.SYNC_STATE.SYNCED;

            // Run
            conversation._setSyncing();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SYNCING);
            expect(conversation._syncCounter).toEqual(1);
        });

        it("Sets syncState to SYNCING if syncState is SYNCING and inc _syncCounter", function() {
            // Setup
            conversation.syncState = Layer.Constants.SYNC_STATE.SYNCING;
            conversation._syncCounter = 500;

            // Run
            conversation._setSyncing();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SYNCING);
            expect(conversation._syncCounter).toEqual(501);
        });
    });

    describe("The _setSynced() method", function() {

        it("Sets syncState to SYNCED if SAVING and _syncCounter=1", function() {
            // Setup
            conversation._syncCounter = 1;
            conversation.syncState = Layer.Constants.SYNC_STATE.SAVING;

            // Run
            conversation._setSynced();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SYNCED);
            expect(conversation._syncCounter).toEqual(0);
        });

        it("Sets syncState to SYNCING if SAVING and _syncCounter=2", function() {
            // Setup
            conversation._syncCounter = 2;
            conversation.syncState = Layer.Constants.SYNC_STATE.SAVING;

            // Run
            conversation._setSynced();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SYNCING);
            expect(conversation._syncCounter).toEqual(1);
        });

        it("Sets syncState to SYNCED if SYNCING and _syncCounter=1", function() {
            // Setup
            conversation._syncCounter = 1;
            conversation.syncState = Layer.Constants.SYNC_STATE.SYNCING;

            // Run
            conversation._setSynced();

            // Posttest
            expect(conversation.syncState).toEqual(Layer.Constants.SYNC_STATE.SYNCED);
            expect(conversation._syncCounter).toEqual(0);
        });
    });

    describe("The isSaved() method", function() {
      it("Should return false if NEW", function() {
        message.syncState = Layer.Constants.SYNC_STATE.NEW;
        expect(message.isSaved()).toEqual(false);
      });

      it("Should return false if SAVING", function() {
        message.syncState = Layer.Constants.SYNC_STATE.SAVING;
        expect(message.isSaved()).toEqual(false);
      });

      it("Should return true if LOADING", function() {
        message.syncState = Layer.Constants.SYNC_STATE.LOADING;
        expect(message.isSaved()).toEqual(true);
      });

      it("Should return true if SYNCED", function() {
        message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        expect(message.isSaved()).toEqual(true);
      });

      it("Should return true if SYNCING", function() {
        message.syncState = Layer.Constants.SYNC_STATE.SYNCING;
        expect(message.isSaved()).toEqual(true);
      });
    });


    describe("The toObject() method", function() {
        var obj;
        beforeEach(function() {
            obj = new Layer.Core.Syncable({
            });
        });

        afterEach(function() {
            if (!obj.isDestroyed) obj.destroy();
        });

        it("Should return cached value", function() {
            obj._toObject = "fred";
            expect(obj.toObject()).toEqual("fred");
        });

        it("Should return a isNew, isSaved, isSaving, isSynced", function() {
            expect(obj.toObject().isNew).toEqual(true);
            expect(obj.toObject().isSaved).toEqual(false);
            expect(obj.toObject().isSaving).toEqual(false);
            expect(obj.toObject().isSynced).toEqual(false);
        });
    });
});