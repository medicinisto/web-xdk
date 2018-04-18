/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Cache Cleaner Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var client, requests, userIdentity2;

    beforeEach(function() {
        jasmine.clock().install();

        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        }).on("challenge", function() {});
        client.sessionToken = "sessionToken";

        client.user = userIdentity = new Layer.Core.Identity({
            id: "layer:///identities/Frodo",
            displayName: "Frodo",
            userId: "Frodo"
        });

        userIdentity2 = new Layer.Core.Identity({
            id: "layer:///identities/1",
            displayName: "UserIdentity",
            userId: '1'
        });

        client.isTrustedDevice = true;

        client._clientAuthenticated();

        spyOn(client.dbManager, "_loadSyncEventRelatedData").and.callFake(function(syncEvents, callback) {callback([]);});
        spyOn(client.dbManager, "getObjects").and.callFake(function(tableName, ids, callback) {
            callback([]);
        });
        spyOn(client.dbManager, "getObject").and.callFake(function(tableName, ids, callback) {
            callback(null);
        });
        client._clientReady();
    });

    afterEach(function() {
        client.destroy();
        jasmine.clock().uninstall();
    });

    // TODO: May want to break these up, but they form a fairly simple self contained test
    describe("The _checkAndPurgeCache(), _isCachedObject and _removeObject methods", function() {
        beforeEach(function() {
        client._clientReady();
        });

        it("Should destroy Conversations if there are no Queries", function() {
            var c1 = client.createConversation({ participants: ["a"] });
            var c2 = client.createConversation({ participants: ["b"] });
            var c3 = client.createConversation({ participants: ["c"] });

            // Run
            client._checkAndPurgeCache([c1, c2, c3]);

            // Posttest
            expect(Object.keys(client._models.conversations)).toEqual([]);
            expect(c1.isDestroyed).toBe(true);
            expect(c2.isDestroyed).toBe(true);
            expect(c3.isDestroyed).toBe(true);
        });

        it("Should ignore destroyed objects", function() {
            var c1 = client.createConversation({ participants: ["a"] });
            var c2 = client.createConversation({ participants: ["b"] });
            var c3 = client.createConversation({ participants: ["c"] });
            c2.isDestroyed = true;

            // Run
            client._checkAndPurgeCache([c1, c2, c3]);

            // Posttest
            expect(Object.keys(client._models.conversations)).toEqual([c2.id]);
            expect(c1.isDestroyed).toBe(true);
            expect(c2.isDestroyed).toBe(true);
            expect(c3.isDestroyed).toBe(true);
        });

        it("Should keep Conversations if they are in a Query and remove and destroy all others", function() {
            // Setup
            var query = client.createQuery({model: Layer.Core.Query.Conversation});
            var c1 = client.createConversation({ participants: ["a"] });
            var c2 = client.createConversation({ participants: ["b"] });
            var c3 = client.createConversation({ participants: ["c"] });
            query.data = [c1, c3];

            // Pretest
            expect(Object.keys(client._models.conversations))
                .toEqual(jasmine.arrayContaining([c1.id, c2.id, c3.id]));

            // Run
            client._checkAndPurgeCache([c1, c2, c3]);

            // Posttest
            expect(Object.keys(client._models.conversations)).toEqual(jasmine.arrayContaining([c1.id, c3.id]));
            expect(c1.isDestroyed).toBe(false);
            expect(c2.isDestroyed).toBe(true);
            expect(c3.isDestroyed).toBe(false);
        });


        it("Should handle immutable objects; keeping Conversations if they are in a Query and remove and destroy all others", function() {
            // Setup
            var query = client.createQuery({model: Layer.Core.Query.Conversation});
            var c1 = client.createConversation({ participants: ["a"] });
            var c2 = client.createConversation({ participants: ["b"] });
            var c3 = client.createConversation({ participants: ["c"] });
            query.data = [c1, c3];

            // Pretest
            expect(Object.keys(client._models.conversations))
                .toEqual(jasmine.arrayContaining([c1.id, c2.id, c3.id]));

            // Run
            client._checkAndPurgeCache([c1.toObject(), c2.toObject(), c3.toObject()]);

            // Posttest
            expect(Object.keys(client._models.conversations)).toEqual(jasmine.arrayContaining([c1.id, c3.id]));
            expect(c1.isDestroyed).toBe(false);
            expect(c2.isDestroyed).toBe(true);
            expect(c3.isDestroyed).toBe(false);
        });

        it("Should keep Messages if they are in a Query and remove and destroy all others", function() {
            // Setup
            var c = client.createConversation({ participants: ["a"] });
            var query = client.createQuery({
                model: Layer.Core.Query.Message,
                predicate: "conversation.id = '" + c.id + "'"
            });
            var m1 = c.createMessage("a").send();
            var m2 = c.createMessage("b").send();
            var m3 = c.createMessage("c").send();
            jasmine.clock().tick(1);
            Layer.Utils.defer.flush();

            // Pretest
            expect(query.data).toEqual([m3, m2, m1]);

            query.data = [m1, m3];

            // Pretest
            expect(Object.keys(client._models.messages)).toEqual(jasmine.arrayContaining([m1.id, m2.id, m3.id]));

            // Run
            client._checkAndPurgeCache([m1, m2, m3]);

            // Posttest
            expect(Object.keys(client._models.messages)).toEqual(jasmine.arrayContaining([m1.id, m3.id]));
            expect(m1.isDestroyed).toBe(false);
            expect(m2.isDestroyed).toBe(true);
            expect(m3.isDestroyed).toBe(false);
        });
    });

    describe("The _scheduleCheckAndPurgeCache() method", function() {
        var conversation;
        beforeEach(function() {
            conversation = client.createConversation({
                participants: ["a","z"],
                distinct: false
            });
            conversation.syncState = Layer.Constants.SYNC_STATE.SYNCED;
        });

        afterEach(function() {
            conversation.destroy();
        });

        it("Should schedule call to _runScheduledCheckAndPurgeCache if unscheduled", function() {
            client._scheduleCheckAndPurgeCacheAt = 0;
            spyOn(client, "_runScheduledCheckAndPurgeCache");

            // Run
            client._scheduleCheckAndPurgeCache(conversation);
            jasmine.clock().tick(client.cachePurgeInterval + 1);

            // Posttest
            expect(client._runScheduledCheckAndPurgeCache).toHaveBeenCalledWith();
        });

        it("Should schedule call to _runScheduledCheckAndPurgeCache if late", function() {
            client._scheduleCheckAndPurgeCacheAt = Date.now() - 10;
            spyOn(client, "_runScheduledCheckAndPurgeCache");

            // Run
            client._scheduleCheckAndPurgeCache(conversation);
            jasmine.clock().tick(client.cachePurgeInterval + 1);

            // Posttest
            expect(client._runScheduledCheckAndPurgeCache).toHaveBeenCalledWith();
        });

        it("Should not schedule call to _runScheduledCheckAndPurgeCache if already scheduled", function() {
            spyOn(client, "_runScheduledCheckAndPurgeCache");
            var d = new Date();
            jasmine.clock().mockDate(d);
            client._scheduleCheckAndPurgeCache(conversation);

            // Run
            client._scheduleCheckAndPurgeCache(conversation);
            d.setMilliseconds(d.getMilliseconds() + 1);
            jasmine.clock().mockDate(d);
            jasmine.clock().tick(1);

            client._scheduleCheckAndPurgeCache(conversation);
            d.setMilliseconds(d.getMilliseconds() + 1);
            jasmine.clock().mockDate(d);
            jasmine.clock().tick(1);

            client._scheduleCheckAndPurgeCache(conversation);
            d.setMilliseconds(d.getMilliseconds() + 1);
            jasmine.clock().mockDate(d);
            jasmine.clock().tick(1);

            // Posttest 1
            expect(client._runScheduledCheckAndPurgeCache.calls.count()).toEqual(0);

            // Run 2
            d.setMilliseconds(d.getMilliseconds() + client.cachePurgeInterval + 1);
            jasmine.clock().tick(client.cachePurgeInterval + 1);

            // Posttest 2
            expect(client._runScheduledCheckAndPurgeCache.calls.count()).toEqual(1);

        });

        it("Should add object to _scheduleCheckAndPurgeCacheItems if new schedule", function() {
            client._scheduleCheckAndPurgeCacheItems = [];
            client._scheduleCheckAndPurgeCacheAt = 0;
            client._scheduleCheckAndPurgeCache(conversation);
            expect(client._scheduleCheckAndPurgeCacheItems).toEqual([conversation]);
        });

        it("Should add object to _scheduleCheckAndPurgeCacheItems if no new schedule", function() {
            client._scheduleCheckAndPurgeCacheItems = [];
            client._scheduleCheckAndPurgeCacheAt = Date.now() + 10;
            client._scheduleCheckAndPurgeCache(conversation);
            expect(client._scheduleCheckAndPurgeCacheItems).toEqual([conversation]);
        });

        it("Should ignore unsaved objects", function() {
            client._scheduleCheckAndPurgeCacheItems = [];
            conversation.syncState = Layer.Constants.SYNC_STATE.SAVING;
            client._scheduleCheckAndPurgeCacheAt = Date.now() + 10;
            client._scheduleCheckAndPurgeCache(conversation);
            expect(client._scheduleCheckAndPurgeCacheItems).toEqual([]);
        });
    });

    describe("The _runScheduledCheckAndPurgeCache() method", function() {
        var c1, c2, c3;
        beforeEach(function() {
            c1 = client.createConversation({ participants: ["a"] });
            c2 = client.createConversation({ participants: ["b"] });
            c3 = client.createConversation({ participants: ["c"] });
            client._scheduleCheckAndPurgeCacheItems = [c1, c2, c3];
            client._scheduleCheckAndPurgeCacheAt = Date.now() + 10;
        });
        it("Should call _checkAndPurgeCache", function() {
            spyOn(client, "_checkAndPurgeCache");
            client._runScheduledCheckAndPurgeCache();
            expect(client._checkAndPurgeCache).toHaveBeenCalledWith([c1, c2, c3]);
        });

        it("Should clear the list", function() {
            client._runScheduledCheckAndPurgeCache();
            expect(client._scheduleCheckAndPurgeCacheItems).toEqual([]);
        });

        it("Should clear the scheduled time", function() {
            client._runScheduledCheckAndPurgeCache();
            expect(client._scheduleCheckAndPurgeCacheAt).toEqual(0);
        });
    });
});
