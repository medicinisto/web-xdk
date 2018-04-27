/*eslint-disable */
describe("The ManualQuery Class", function() {
    var appId = "Fred's App";

    var conversation,
        message,
        identity,
        client,
        query;

    beforeEach(function() {
        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com"
        }).on("challenge", function() {});
        client.sessionToken = "sessionToken";
        client.userId = "Frodo";
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

        client._clientReady();
        client.onlineManager.isOnline = true;

        query = client.createQuery({
          model: Layer.Core.Query.Manual
        });
        conversation = client._createObject(responses.conversation1);
        message = conversation.createMessage("hello");
        identity = client.user;
    });

    afterEach(function() {
        client.destroy();
    });

    it("Should be a ManualQuery", function() {
      expect(query.constructor.prototype.model).toEqual(Layer.Core.Query.Manual);
    });

    describe("The addItem() method", function() {
        it("Should add Message Conversation and Identity instances at the specified index", function() {
            // Test: No index means push to end of list
            query.addItem(message);
            query.addItem(conversation);
            query.addItem(identity);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);

            // Test use of index 0
            var message2 = conversation.createMessage("hello 2");
            query.addItem(message2, 0);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);
            expect(query.data[0].id).toEqual(message2.id);

            // Test use of index in the middle
            var message3 = conversation.createMessage("hello 3");
            query.addItem(message3, 2);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);
            expect(query.data[2].id).toEqual(message3.id);
        });

        it("Should not add duplicates", function() {
            query.addItem(message);
            query.addItem(message);
            expect(query.data).toEqual([message]);
        });

        it("Should add Message Conversation and Identity objects at the specified index and register them", function() {
            // Test: No index means push to end of list
            query.addItem({
                id: "layer:///messages/foo1",
                parts: [{mimeType: "text/plain", body: "hey ho"}]
            });
            query.addItem({
                id: "layer:///conversations/foo2",
                participants: [identity.id]
            });
            query.addItem({
                id: "layer:///identities/foo3",
                displayName: "frodo-the-dodo"
            });

            // Make sure that instances are added for them
            expect(query.data).toEqual([jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);

            // Make sure the instances are registered so that a widget getting an object instead of an instance can look them up
            expect(client.getMessage("layer:///messages/foo1")).toBe(query.data[0]);
            expect(client.getConversation("layer:///conversations/foo2")).toBe(query.data[1]);
            expect(client.getIdentity("layer:///identities/foo3")).toBe(query.data[2]);

            // Make sure we can insert at other indexes
            query.addItem({
                id: "layer:///identities/foo5",
                displayName: "frodo-the-dodo"
            }, 1);
            expect(query.data[1].id).toEqual("layer:///identities/foo5");
        });

        it("Should respect ObjectDataType and InstanceDataType", function() {
            // Test: Should maintain the object if InstanceDataType, and add instances:
            var originalData = query.data;
            query.addItem(message);
            expect(query.data).toBe(originalData);
            expect(query.data[0]).toEqual(jasmine.any(Layer.Core.Message));
            query.reset();

            // Test: Should create a new object if ObjectDataType:
            query.dataType = Layer.Core.Query.ObjectDataType;
            originalData = query.data;
            query.addItem(message);
            expect(query.data).not.toBe(originalData);
            expect(query.data[0]).not.toEqual(jasmine.any(Layer.Core.Message));
            expect(query.data[0].id).toEqual(message.id);
        });

        it("Should maintain the existing array if skipNewObj is passed", function() {
            query.dataType = Layer.Core.Query.ObjectDataType;
            originalData = query.data;
            query.addItem(message, 0, true);
            expect(query.data).toBe(originalData);
        });

        it("Should trigger change events", function() {
            spyOn(query, "_triggerChange");
            query.addItem(message);
            query.addItem(conversation);

            expect(query._triggerChange).toHaveBeenCalledWith({
                type: 'insert',
                target: message,
                query: query,
                index: 0
            });
            expect(query._triggerChange).toHaveBeenCalledWith({
                type: 'insert',
                target: conversation,
                query: query,
                index: 1
            });
        });
    });

    describe("The addItems() method", function() {
        it("Should call addItem on each item", function() {
            spyOn(query, "addItem");
            query.addItems([message, conversation, identity], 2);

            expect(query.addItem).toHaveBeenCalledWith(message, 2, false);
            expect(query.addItem).toHaveBeenCalledWith(conversation, 3, true);
            expect(query.addItem).toHaveBeenCalledWith(identity, 4, true);
        });
    });

    describe("The setItems() method", function() {
        it("Should reset the query", function() {
            spyOn(query, "_reset");
            query.setItems([message, conversation, identity]);
            expect(query._reset).toHaveBeenCalledWith();
        });

        it("Should call addItems on the new items", function() {
            spyOn(query, "addItems");
            query.setItems([message, conversation, identity]);
            expect(query.addItems).toHaveBeenCalledWith([message, conversation, identity], 0);
        });
    });

    describe("The removeItem() method", function() {
        it("Should remove the specified item whether its an instance or object", function() {
            query.setItems([message, conversation, identity]);

            // Test: remove instance
            query.removeItem(conversation);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Message), jasmine.any(Layer.Core.Identity)]);

            // Test: remove object
            query.removeItem({id: message.id});
            expect(query.data).toEqual([jasmine.any(Layer.Core.Identity)]);
        });

        it("Should respect ObjectDataType and treat the array as immutable", function() {
            // Test: Should maintain the object if InstanceDataType, and add instances:
            var originalData = query.data = [message, conversation, identity];
            query.removeItem(message);
            expect(query.data).toBe(originalData);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);

            // Test: Should create a new object if ObjectDataType:
            query.dataType = Layer.Core.Query.ObjectDataType;
            var originalData = query.data = [message, conversation, identity];
            query.removeItem(message);
            expect(query.data).not.toBe(originalData);
            expect(query.data).toEqual([jasmine.any(Layer.Core.Conversation), jasmine.any(Layer.Core.Identity)]);
        });

        it("Should trigger a remove event", function() {
            spyOn(query, "_triggerChange");
            query.data = [message, conversation, identity];

            // Test 1:
            query.removeItem(conversation);
            expect(query._triggerChange).toHaveBeenCalledWith({
                type: 'remove',
                target: conversation,
                query: query,
                index: 1
            });

            // Test 2:
            query.removeItem(message);
            expect(query._triggerChange).toHaveBeenCalledWith({
                type: 'remove',
                target: message,
                query: query,
                index: 0
            });
        });

        it("Should do nothing if not found", function() {
            spyOn(query, "_triggerChange");
            query.dataType = Layer.Core.Query.ObjectDataType;
            var originalData = query.data = [message, conversation, identity];

            // Run
            query.removeItem(conversation.createMessage("Hey 2"));

            // Test
            expect(query.data).toEqual([message, conversation, identity]);
            expect(query.data).toBe(originalData);
            expect(query._triggerChange).not.toHaveBeenCalled();
        });
    });

    describe("The removeItems() method", function() {
        it("Should call removeItem on each item", function() {
            spyOn(query, "removeItem");
            query.data = [message, conversation, identity];
            query.removeItems([message, identity]);

            expect(query.removeItem).toHaveBeenCalledWith(message, false);
            expect(query.removeItem).toHaveBeenCalledWith(identity, true);
        });
    });
});
