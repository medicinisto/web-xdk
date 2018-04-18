/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Cache Cleaner Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var client, requests, userIdentity2;

    beforeEach(function() {
        requests = jasmine.Ajax.requests;
        jasmine.addCustomEqualityTester(mostRecentEqualityTest);
        jasmine.addCustomEqualityTester(responseTest);

        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        });
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
    });

    describe("The constructor method", function() {
        var clientLocal;
        afterEach(function() {
            if (clientLocal) {
                clientLocal.destroy();
                clientLocal = null;
            }
        });


         it("Should allow customization of the websocketUrl", function() {
            clientLocal = new Layer.Core.Client({
                appId: appId,
                url: "https://duh.com",
                websocketUrl: "https://frodo-the-dodo.dodocom"
            });
            expect(clientLocal.websocketUrl).toEqual("https://frodo-the-dodo.dodocom");
        });
        it("Should initialize the socketManager", function() {
            expect(client.socketManager).not.toBe(null);
        });



        it("Should initialize the syncManager", function() {
            expect(client.syncManager).not.toBe(null);
        });

        it("Should link onlineManager to socketManager", function() {
            client.isAuthenticated = true;
            client._wantsToBeAuthenticated = true;
            spyOn(client.socketManager, "connect");
            client.onlineManager.trigger("connected");
            expect(client.socketManager.connect).toHaveBeenCalled();
        });
    });
});
