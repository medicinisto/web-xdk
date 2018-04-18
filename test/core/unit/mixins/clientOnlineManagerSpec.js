/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Online Manager Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var client, userIdentity2;

    beforeEach(function() {
        requests = jasmine.Ajax.requests;
        jasmine.addCustomEqualityTester(mostRecentEqualityTest);
        jasmine.addCustomEqualityTester(responseTest);

        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        }).on("challenge", function() {});
        client.sessionToken = "sessionToken";
    });

    afterEach(function() {
        client.destroy();
    });

    it("Should initialize the onlineManager", function() {
        expect(client.onlineManager).toEqual(jasmine.any(Layer.Core.OnlineStateManager));
    });

    it("Should setup events for the onlineManager", function() {
        spyOn(client, "trigger"); // Detect that _handleOnlineChange has been called by its calling trigger('online', obj)
        client.connect();
        client.onlineManager.trigger('connected');

        expect(client.trigger).toHaveBeenCalledWith('online', {isOnline: true, reset: false});
        client.onlineManager.trigger('disconnected');
        expect(client.trigger).toHaveBeenCalledWith('online', {isOnline: false});
    });


    describe("The _handleOnlineChange() method", function () {
        beforeAll(function() {debugger;});
        it("Should trigger online: false if disconnected", function () {
            debugger;
            client.isAuthenticated = true;
            client._wantsToBeAuthenticated = true;
            spyOn(client, "trigger");
            client._handleOnlineChange({
                eventName: 'disconnected'
            });

            expect(client.trigger).toHaveBeenCalledWith('online', { isOnline: false });
        });

        it("Should trigger online: true if connected", function () {
            client.isAuthenticated = true;
            client._wantsToBeAuthenticated = true;
            spyOn(client, "trigger");
            client._handleOnlineChange({
                eventName: 'connected',
                offlineDuration: 500
            });

            expect(client.trigger).toHaveBeenCalledWith('online', { isOnline: true, reset: false });
        });

        it("Should trigger reset: true if connected after 30 hours offline", function () {
            client.isAuthenticated = true;
            client._wantsToBeAuthenticated = true;
            spyOn(client, "trigger");
            client._handleOnlineChange({
                eventName: 'connected',
                offlineDuration: 1000 * 60 * 60 * 31
            });

            expect(client.trigger).toHaveBeenCalledWith('online', { isOnline: true, reset: true });
        });


        it("Should call _connect() if not authenticated but wants to authenticate", function() {
            client.isAuthenticated = false;
            client._wantsToBeAuthenticated = true;
            spyOn(client, "_connect");

            // Test 1
            client._handleOnlineChange({
                eventName: 'connected',
                offlineDuration: 500
            });
            expect(client._connect).toHaveBeenCalled();
            client._connect.calls.reset();

            // Test 2
            client._wantsToBeAuthenticated = false;
            client._handleOnlineChange({
                eventName: 'connected',
                offlineDuration: 500
            });
            expect(client._connect).not.toHaveBeenCalled();
            client._connect.calls.reset();

            // Test 3
            client._wantsToBeAuthenticated = true;
            client.isAuthenticated = true;
            client._handleOnlineChange({
                eventName: 'connected',
                offlineDuration: 500
            });
            expect(client._connect).not.toHaveBeenCalled();
            client._connect.calls.reset();
        });
    });

    describe("The _connectionRestored() method", function() {
        var q1, q2, conversation;
        beforeEach(function() {
            client.connect(userId);
            client._clientAuthenticated();
            client._clientReady();
            conversation = client.createConversation({ participants: ["a"] });
            q1 = client.createQuery({model: "Conversation"});
            q2 = client.createQuery({model: "Message", predicate: 'conversation.id = \'' + conversation.id + '\''});
        });

        it("Should delete all database data if duration was large", function() {
            spyOn(client.dbManager, "deleteTables");

            // Run
            client.trigger('online', {
                isOnline: true,
                reset: true
            });

            // Posttest
            expect(client.dbManager.deleteTables).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it("Should call reset on all queries if duration was large", function() {
            spyOn(client.dbManager, "deleteTables").and.callFake(function(callback) {callback();});
            spyOn(q1, "reset");
            spyOn(q2, "reset");

            // Run
            client.trigger('online', {
                isOnline: true,
                reset: true
            });

            // Posttest
            expect(q1.reset).toHaveBeenCalledWith();
            expect(q2.reset).toHaveBeenCalledWith();
        });

        it("Should not call reset on all queries if duration was small", function() {
            spyOn(q1, "reset");
            spyOn(q2, "reset");

            // Run
            client.trigger('online', {
            isOnline: true,
            reset: false
            });

            // Posttest
            expect(q1.reset).not.toHaveBeenCalled();
            expect(q2.reset).not.toHaveBeenCalled();

        });

    });

    describe("The _resetSession() method", function() {
        it("Should call onlineManager.stop()", function () {
            spyOn(client.onlineManager, "stop");
            client._resetSession();
            expect(client.onlineManager.stop).toHaveBeenCalledWith();
        });
    });

    describe("The connect() method", function () {

        it("Should call onlineManager.start()", function () {
            spyOn(client.onlineManager, "start");
            client.connect('Frodo');
            expect(client.onlineManager.start).toHaveBeenCalledWith();
        });
    });

    describe("The connectWithSession() method", function () {
        it("Should call onlineManager.start()", function () {
            spyOn(client.onlineManager, "start");
            client.connectWithSession('Frodo', 'FrodoSession');
            expect(client.onlineManager.start).toHaveBeenCalledWith();
        });
    });
});
