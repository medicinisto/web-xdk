/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Typing Indicator Mixin", function() {
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

    describe("The constructor() method", function() {
        it("Should setup the TypingListenerIndicator", function() {
            expect(client._typingIndicators).toEqual(jasmine.any(Layer.Core.Root));
        });
    });

    describe("The createTypingListener() method", function() {
        it("Should return a layer.TypingListener.TypingListener", function() {
            var input = document.createElement("input");
            expect(client.createTypingListener(input)).toEqual(jasmine.any(Layer.Core.TypingIndicators.TypingListener));
        });

        it("Should get a proper input property", function() {
            var input = document.createElement("input");
            expect(client.createTypingListener(input).input).toBe(input);
        });
    });

    describe("The createTypingPublisher() method", function() {
        it("Should return a layer.TypingListener.TypingPublisher", function() {
            expect(client.createTypingPublisher()).toEqual(jasmine.any(Layer.Core.TypingIndicators.TypingPublisher));
        });
    });

    describe("The getTypingState() method", function() {
        it("Should call typingListener.getState", function() {
            spyOn(client._typingIndicators, "getState").and.callThrough();
            expect(client.getTypingState('layer:///conversations/c11')).toEqual({
                typing: [],
                paused: []
            });
            expect(client._typingIndicators.getState).toHaveBeenCalledWith('layer:///conversations/c11');
        });
    });
});
