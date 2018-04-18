/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Push Tokens Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var client, requests, userIdentity2;

    beforeEach(function() {
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        jasmine.addCustomEqualityTester(mostRecentEqualityTest);
        jasmine.addCustomEqualityTester(responseTest);

        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        });
        client.sessionToken = "sessionToken";

        client.connect("Frodo");
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
        client._clientReady();

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
        jasmine.Ajax.uninstall();
        client.destroy();
    });
    describe("The Push Token Methods", function() {
        beforeEach(function() {
          spyOn(client.syncManager, "isOnline").and.returnValue(true);
        });

        it("Should have a working registerIOSPushToken() method", function() {
          var callback = jasmine.createSpy('callback');
          client.registerIOSPushToken({
            token: "a",
            deviceId: "b",
            iosVersion: "c",
            bundleId: "d"
          }, callback);

          expect(requests.mostRecent()).toEqual(jasmine.objectContaining({
            url: client.url + "/push_tokens",
            method: "POST",
            params: JSON.stringify({
             token: "a",
             type: "apns",
             device_id: "b",
             ios_version: "c",
             apns_bundle_id: "d"
            })
          }));

          var response = {
              status: 200,
              responseText: JSON.stringify({doh: "a deer"})
          };
          requests.mostRecent().response(response);
          expect(callback).toHaveBeenCalledWith({doh: "a deer"});
        });

        it("Should have a working registerAndroidPushToken() method", function() {
          var callback = jasmine.createSpy('callback');
          client.registerAndroidPushToken({
            token: "a",
            deviceId: "b",
            senderId: "c"
          }, callback);

          expect(requests.mostRecent()).toEqual(jasmine.objectContaining({
            url: client.url + "/push_tokens",
            method: "POST",
            params: JSON.stringify({
             token: "a",
             type: "gcm",
             device_id: "b",
             gcm_sender_id: "c"
            })
          }));

          var response = {
              status: 200,
              responseText: JSON.stringify({doh: "a deer"})
          };
          requests.mostRecent().response(response);
          expect(callback).toHaveBeenCalledWith({doh: "a deer"});

        });

        it("Should have a working unregisterPushToken() method", function() {
          var callback = jasmine.createSpy('callback');
          client.unregisterPushToken("a", callback);

          expect(requests.mostRecent()).toEqual(jasmine.objectContaining({
            url: client.url + "/push_tokens/a",
            method: "DELETE"
          }));

          var response = {
              status: 200,
              responseText: JSON.stringify({doh: "a deer"})
          };
          requests.mostRecent().response(response);
          expect(callback).toHaveBeenCalledWith({doh: "a deer"});

        });

      });
});
