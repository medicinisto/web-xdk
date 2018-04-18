/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client DbManager Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var dbIsEnabled = true;

    var client, requests, userIdentity2;

    beforeAll(function(done) {
        // Disables tests for IE/Edge
        testDbEnabled(function(result) {
            dbIsEnabled = result;
            done();
        });
    });

    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        jasmine.addCustomEqualityTester(mostRecentEqualityTest);
        jasmine.addCustomEqualityTester(responseTest);

        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        });

        client.connect(userId);
    });

    afterEach(function() {
        jasmine.clock().uninstall();
        jasmine.Ajax.uninstall();
        if (!client.isDestroyed) client.destroy();
    });

    describe("The constructor should instantiate the DbManager", function() {
        it("Should instantiate a DbManager", function() {
            expect(client.dbManager).toBe(null);
            client._clientAuthenticated();
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
        });
    });

    describe("The _clearStoredData() method", function () {
        it("Should call deleteTables", function () {
            // Setup
            client._clientAuthenticated();
            spyOn(client.dbManager, "deleteTables");
            var spy = jasmine.createSpy('callback');

            // Run
            client._clearStoredData(spy);

            // Posttest
            expect(client.dbManager.deleteTables).toHaveBeenCalledWith(spy);
        });
    });

    describe("The destroy() method", function () {

        it("Should destroy dbManager", function () {
            client._clientAuthenticated();

            var dbManager = client.dbManager;
            client.destroy();
            expect(dbManager.isDestroyed).toBe(true);
        });
    });

    describe("The _clientAuthenticated() method", function() {
        it("Should call _clientReady after DB open if isTrustedDevice and isPersitenceEnabled", function () {
            // Setup
            var onOpen = Layer.Core.DbManager.prototype.onOpen;
            spyOn(Layer.Core.DbManager.prototype, "onOpen").and.callFake(function (callback) {
                setTimeout(function () {
                    callback();
                }, 10);
            });
            spyOn(client, "_clientReady");
            client.isTrustedDevice = true;
            client.isPersistenceEnabled = true;
            client.user.isFullIdentity = true;


            // Run
            client._clientAuthenticated();
            expect(client._clientReady).not.toHaveBeenCalled();
            jasmine.clock().tick(11);

            // Posttest
            expect(client._clientReady).toHaveBeenCalled();

            // Cleanup
            Layer.Core.DbManager.prototype.onOpen = onOpen;

        });

        it("Should initialize the dbManager to all disabled if not isTrustedDevice and isPersitenceEnabled", function () {
            if (!dbIsEnabled) return expect(true).toBe(true);
            // Setup
            client.isTrustedDevice = false;
            client.isPersistenceEnabled = true;

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(false);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_syncQueue).toBe(false);
        });


        it("Should initialize the dbManager to all disabled if not isTrustedDevice and persistenceFeatures provided", function () {
            if (!dbIsEnabled) return expect(true).toBe(true);

            // Setup
            client.isTrustedDevice = false;
            client.persistenceFeatures = {
                conversations: true,
                messages: true,
                identities: true,
                syncQueue: true,
                sessionToken: true
            };

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(false);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_identities).toBe(false);
            expect(client.dbManager._permission_syncQueue).toBe(false);
        });

        it("Should initialize the dbManager to false if isTrustedDevice but isPersistenceEnabled is false and no persistenceFeatures specified", function () {
            if (!dbIsEnabled) return expect(true).toBe(true);

            // Setup
            client.isTrustedDevice = true;
            client.isPersistenceEnabled = false;

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(false);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_syncQueue).toBe(false);
        });


        it("Should initialize the dbManager to custom values if isTrustedDevice and persistenceFeatures provided", function () {
            if (!dbIsEnabled) return expect(true).toBe(true);

            // Setup
            client.isTrustedDevice = true;
            client.isPersistenceEnabled = true;
            client.persistenceFeatures = {
                conversations: true,
                messages: false,
                identities: true,
                syncQueue: false,
                sessionToken: true
            };

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(true);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_identities).toBe(true);
            expect(client.dbManager._permission_syncQueue).toBe(false);
        });

        it("Should initialize the dbManager to custom values if isTrustedDevice and persistenceFeatures provided but not persistenceEnabled", function () {
            if (!dbIsEnabled) return expect(true).toBe(true);

            // Setup
            client.isTrustedDevice = true;
            client.isPersistenceEnabled = false;
            client.persistenceFeatures = {
                conversations: true,
                messages: false,
                syncQueue: false,
                sessionToken: true
            };

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(false);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_syncQueue).toBe(false);
        });

        it("Should initialize the dbManager to false if isTrustedDevice but isPersistenceEanbled is false and no persistenceFeatures; sessionToken should still be true", function () {
            // Setup
            client.isTrustedDevice = true;
            client.isPersistenceEnabled = false;

            // Run
            client._clientAuthenticated();

            // Posttest
            expect(client.dbManager).toEqual(jasmine.any(Layer.Core.DbManager));
            expect(client.dbManager._permission_conversations).toBe(false);
            expect(client.dbManager._permission_messages).toBe(false);
            expect(client.dbManager._permission_syncQueue).toBe(false);
            expect(client.persistenceFeatures).toEqual({
                conversations: false,
                channels: false,
                messages: false,
                identities: false,
                syncQueue: false,
                sessionToken: true
            });
        });
    });
});
