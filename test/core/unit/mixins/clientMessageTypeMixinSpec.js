/*eslint-disable */
describe("The Client Message Type Model Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";
    var identityToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImN0eSI6ImxheWVyLWVpdDt2PTEiLCJraWQiOiIyOWUzN2ZhZS02MDdlLTExZTQtYTQ2OS00MTBiMDAwMDAyZjgifQ.eyJpc3MiOiI4YmY 1MTQ2MC02MDY5LTExZTQtODhkYi00MTBiMDAwMDAwZTYiLCJwcm4iOiI5M2M4M2VjNC1iNTA4LTRhNjAtODU1MC0wOTlmOWM0MmVjMWEiLCJpYXQiOjE0MTcwMjU0NTQsImV4cCI6MTQxODIzNTA1NCwibmNlIjoiRFZPVFZzcDk0ZU9lNUNzZDdmaWVlWFBvUXB3RDl5SjRpQ0EvVHJSMUVJT25BSEdTcE5Mcno0Yk9YbEN2VDVkWVdEdy9zU1EreVBkZmEydVlBekgrNmc9PSJ9.LlylqnfgK5nhn6KEsitJMsjfayvAJUfAb33wuoCaNChsiRXRtT4Ws_mYHlgwofVGIXKYrRf4be9Cw1qBKNmrxr0er5a8fxIN92kbL-DlRAAg32clfZ_MxOfblze0DHszvjWBrI7F-cqs3irRi5NbrSQxeLZIiGQdBCn8Qn5Zv9s";

    var client, conversation, TextModel;

    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
        var requests = jasmine.Ajax.requests;
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

        client.isTrustedDevice = true;

        client._clientAuthenticated();


        spyOn(client.dbManager, "_loadSyncEventRelatedData").and.callFake(function(syncEvents, callback) {callback([]);});
        spyOn(client.dbManager, "getObjects").and.callFake(function(tableName, ids, callback) {
            callback([]);
        });
        spyOn(client.dbManager, "getObject").and.callFake(function(tableName, ids, callback) {
            callback(null);
        });
        client._isReadyObj = {};
        client._clientReady();
        conversation = client.createConversation({
            participants: ["a"]
        });
        TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
    });

    afterEach(function() {
        client.destroy();
        jasmine.clock().uninstall();
        jasmine.Ajax.uninstall();
    });

    afterAll(function() {

    });

    describe("The constructor() method", function() {
        it("Should setup the _models.messageTypes", function() {
            expect(client._models.messageTypes).toEqual({});
        });
    });

    describe("The cleanup() method", function() {
        afterEach(function() {
            client._models.channels = client._models.messageTypes = client._models.conversations = client._models.queries = client._models.identities = {};
        });

        it("Should destroy all MessageTypes", function() {
            // Setup
            var message = conversation.createMessage("Hi").send();
            var model = new TextModel({message: message, part: message.getRootPart()});

            // Pretest
            expect(client._models.messageTypes[model.id]).toBe(model);

            // Run
            client._cleanup();

            // Posttest
            expect(model.isDestroyed).toBe(true);
            expect(client._models.messageTypes).toBe(null);
        });
    });

    describe("The getMessageTypeModel() method", function() {

        it("Should get by id", function() {
            var message = conversation.createMessage("hello").send();
            var model = new TextModel({message: message, part: message.getRootPart()});
            expect(client.getMessageTypeModel(model.id)).toBe(model);
        });

        it("Should fail without id", function() {
            expect(function() {
                client.getMessageTypeModel(5);
            }).toThrowError(Layer.Core.LayerError.ErrorDictionary.idParamRequired);
            expect(Layer.Core.LayerError.ErrorDictionary.idParamRequired.length > 0).toBe(true);
        });
    });

    describe("The _addMessageTypeModel() and _removeMessageTypeModel() method", function() {
        var message, model;
        beforeEach(function() {
            message = conversation.createMessage("hello").send();
            model = new TextModel({message: message, part: message.getRootPart()});
        });

        it("Should register a Message in _models.messageTypes", function() {
            // Setup
            client._models.messageTypes = {};

            // Run
            client._addMessageTypeModel(model);

            // Posttest
            expect(client.getMessageTypeModel(model.id)).toBe(model);
        });

        it("Should deregister a Model", function() {
            // Pretest
            var hash = {};
            hash[model.id] = model;
            expect(client._models.messageTypes).toEqual(hash);

            // Run
            client._removeMessageTypeModel(model);

            // Posttest
            expect(client._models.messageTypes).toEqual({});
        });
    });

    describe("The message-type-model:notification event", function() {
        it("Should customize the message notification", function() {
            spyOn(Layer.Core.Message.prototype, "send");
            client.on('message-type-model:notification', function(evt) {
                evt.notification.title = "t1";
                evt.notification.text = "t2";
            });
            new TextModel({ text: "Frodo is a Dodo" }).send({ conversation: conversation });
            expect(Layer.Core.Message.prototype.send).toHaveBeenCalledWith({
                title: "t1",
                text: "t2"
            });
        });
    });
});