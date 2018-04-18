/*eslint-disable */
describe("SyncManager Integration Tests", function() {
    var socket, client, syncManager, request;
    var appId = "Fred's App";

    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com",
            isTrustedDevice: false
        }).on("challenge", function() {});
        client.sessionToken = "sessionToken";
        client.user = new Layer.Core.Identity({
            userId: "Frodo",
            id: "layer:///identities/" + "Frodo",
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
        conversation = client._createObject(responses.conversation1).conversation;
        requests.reset();
        client.syncManager.queue = [];
        jasmine.clock().tick(1);
        syncManager = new Layer.Core.SyncManager({
            onlineManager: client.onlineManager,
            socketManager: client.socketManager,
            requestManager: client.socketRequestManager
        });
        client.onlineManager.isOnline = true;
       client.socketManager._socket = {
            send: function() {},
            addEventListener: function() {},
            removeEventListener: function() {},
            close: function() {},
            readyState: WebSocket.OPEN
        };
        request = new Layer.Core.XHRSyncEvent({
            method: "POST",
            data: {hey: "ho"},
            target: "fred",
            callback: function() {}
        });
        syncManager.queue = [request];

    });

    afterEach(function() {
        if (client) client.destroy();
        jasmine.clock().uninstall();
        jasmine.Ajax.uninstall();
    });

    it("Should schedule a retry after a service unavailable error", function() {
        var tmp = Layer.Utils.getExponentialBackoffSeconds;
        spyOn(layer.Utils, "getExponentialBackoffSeconds").and.returnValue(5);
        spyOn(syncManager, "_processNextRequest");
        syncManager._xhrError({
            success: false,
            status: 503,
            request: request,
            data: {}
        });

        jasmine.clock().tick(4999);
        expect(syncManager._processNextRequest).not.toHaveBeenCalled();

        jasmine.clock().tick(2);
        expect(syncManager._processNextRequest).toHaveBeenCalled();

        expect(request.retryCount).toEqual(1);
        expect(syncManager.queue).toEqual([request]);

        while(request.retryCount < Layer.Core.SyncManager.MAX_RETRIES) {
            syncManager._xhrError({
                success: false,
                status: 503,
                request: request,
                data: {}
            });
            jasmine.clock().tick(5002);
            client.onlineManager.isOnline = true;
        }

        syncManager._xhrError({
            success: false,
            status: 503,
            request: request,
            data: {}
        });

        expect(syncManager.queue).toEqual([]);

        // Restore
        Layer.Utils.getExponentialBackoffSeconds = tmp;
    });


});