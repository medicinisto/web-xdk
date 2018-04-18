/* eslint-disable */
describe("The Announcement class", function() {
    var appId = "Fred's App";

    var client,
        announcement,
        requests;

    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        client = new Layer.Core.Client({
            appId: appId,
            reset: true,
            url: "https://doh.com"
        });
        client.userId = "999";

        client.user = new Layer.Core.Identity({
          userId: client.userId,
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
        getObjectsResult = [];

        spyOn(client.dbManager, "_loadSyncEventRelatedData").and.callFake(function(syncEvents, callback) {callback([]);});
        spyOn(client.dbManager, "getObjects").and.callFake(function(tableName, ids, callback) {
            setTimeout(function() {
                callback(getObjectsResult);
            }, 10);
        });
        client._clientReady();
        client.onlineManager.isOnline = true;

        announcement = client._createObject(responses.announcement);

        requests.reset();
        jasmine.clock().tick(1);
        client._clientReady();
    });
    afterEach(function() {
        if (client) client.destroy();
        jasmine.Ajax.uninstall();
        jasmine.clock().uninstall();
    });

    afterAll(function() {

    });

    describe("The send() method", function() {
      it("Should do nothing", function() {
        spyOn(announcement, "_setSyncing");
        announcement.send();
        expect(announcement._setSyncing).not.toHaveBeenCalled();
      });
    });

    describe("The getConversation() method", function() {
      it("Should return undefined", function() {
        announcement.conversationId = "fred";
        expect(announcement.getConversation()).toBe(undefined);
      });
    });

    describe("The delete() method", function() {
        it("Should fail if already deleting", function() {
            // Setup
            announcement.delete(Layer.Constants.DELETION_MODE.ALL);

            // Run
            expect(function() {
                announcement.delete();
            }).toThrowError(Layer.Core.LayerError.ErrorDictionary.isDestroyed);
        });

        it("Should call _xhr", function() {
            // Setup
            spyOn(announcement, "_xhr");

            // Run
            announcement.delete();

            // Posttest
            expect(announcement._xhr).toHaveBeenCalledWith({
                url: '',
                method: 'DELETE'
            }, jasmine.any(Function));
        });

        it("Should load a new copy if deletion fails from something other than not_found", function() {
          var tmp = Layer.Core.Syncable.load;
          spyOn(Layer.Core.Syncable, "load");
          spyOn(announcement, "_xhr").and.callFake(function(args, callback) {
            callback({success: false});
          });


          // Run
          announcement.delete(Layer.Constants.DELETION_MODE.ALL);

          // Posttest
          expect(announcement.isDestroyed).toBe(true);
          expect(Layer.Core.Syncable.load).toHaveBeenCalledWith(announcement.id);

          // Cleanup
          Layer.Core.Syncable.load = tmp;
        })

        it("Should NOT load a new copy if deletion fails from not_found", function() {
          var tmp = Layer.Core.Announcement.load;
          spyOn(Layer.Core.Announcement, "load");
          spyOn(announcement, "_xhr").and.callFake(function(args, callback) {
            callback({success: false, data: {id: 'not_found'}});
          });


          // Run
          announcement.delete(Layer.Constants.DELETION_MODE.ALL);

          // Posttest
          expect(announcement.isDestroyed).toBe(true);
          expect(Layer.Core.Announcement.load).not.toHaveBeenCalled();

          // Cleanup
          Layer.Core.Announcement.load = tmp;
        })
    });
});
