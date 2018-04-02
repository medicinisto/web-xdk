/* eslint-disable */
describe('layer-conversation-view', function() {
  var el, testRoot, client, conversation, user1, query;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });


  beforeEach(function() {
    jasmine.clock().install();

    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });

    user1 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-view');
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    query = client.createQuery({
      model: Layer.Core.Query.Message
    });
    query.isFiring = false;
    for (i = 0; i < 35; i++) {
      query.data.push(conversation.createMessage("M " + i).send());
    }

    el.query = query;
    jasmine.clock().tick(1);
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

    if (el) {
      el.destroy();
      el = null;
    }
    if (client) {
      client.destroy();
      client = null;
    }
  });

  describe('Event Handling', function() {
    it("Should call onSendMessage when child triggers layer-send-message", function() {
      var spy = jasmine.createSpy('callback');
      el.onSendMessage = spy;
      el.firstChild.trigger('layer-send-message', {message: conversation.createMessage("hey")});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onTypingIndicatorChange when child triggers layer-typing-indicator-change", function() {
      var spy = jasmine.createSpy('callback');
      el.onTypingIndicatorChange = spy;
      el.firstChild.trigger('layer-typing-indicator-change', {});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onComposBarChangeValue when child triggers layer-compose-bar-change-value", function() {
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      var spy = jasmine.createSpy('callback');
      el.onComposeBarChangeValue = spy;
      el.firstChild.trigger('layer-compose-bar-change-value', {});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });
  });

  describe("The query properties", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-view use-generated-query="false"></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should reject a value that isnt in query id format", function() {
      el.queryId = "fred";
      expect(el.queryId).toEqual("");
      expect(el.query).toBe(null);
    });

    it("Should set the query from queryId", function() {
      el.queryId = query.id;
      expect(el.queryId).toEqual(query.id);
      expect(el.query).toBe(query);
    });

    it("Should set the list query when query is set", function() {
      el.query = null;
      expect(el.nodes.list.query).toBe(null);
      el.query = query;
      expect(el.nodes.list.query).toBe(query);
    });

    it("Should destroy the existing query if hasGeneratedQuery is true", function() {
      el.client = client;
      var query2 = client.createQuery({model: Layer.Core.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = true;
      el.query = query;
      expect(query2.isDestroyed).toBe(true);
      expect(el.properties.hasGeneratedQuery).toBe(false);
    });

    it("Should not destroy the existing query if hasGeneratedQuery is false", function() {
      el.client = client;
      var query2 = client.createQuery({model: Layer.Core.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = false;
      el.query = query;
      expect(query2.isDestroyed).toBe(false);
      expect(el.properties.hasGeneratedQuery).toBe(false);
    });

    it("Should call _setupGeneratedQuery", function() {
        testRoot.innerHTML = '<layer-conversation-view></layer-conversation-view>';
        var el = testRoot.firstChild;
        CustomElements.takeRecords();
        spyOn(el, "_setupGeneratedQuery");
        Layer.Utils.defer.flush();
        expect(el._setupGeneratedQuery).toHaveBeenCalledWith();
      });

      it("Should not call _setupGeneratedQuery if useGeneratedQuery is false", function() {
        testRoot.innerHTML = '<layer-conversation-view use-generated-query="false"></layer-conversation-view>';
        var el = testRoot.firstChild;
        CustomElements.takeRecords();
        spyOn(el, "_setupGeneratedQuery");
        Layer.Utils.defer.flush();

        expect(el.useGeneratedQuery).toBe(false);
        expect(el._setupGeneratedQuery).not.toHaveBeenCalledWith();
      });
  });

  describe("The hasGeneratedQuery property", function() {
    it("Should call _setupConversation if set to true", function() {
      el.conversationId = conversation.id;
      spyOn(el, "_setupQuery");
      el.hasGeneratedQuery = true;
      expect(el._setupQuery).toHaveBeenCalled();
    });

    it("Should not call _setupQuery if set to false", function() {
      el.conversationId = conversation.id;
      el.client = client;
      spyOn(el, "_setupQuery");
      el.hasGeneratedQuery = false;
      expect(el._setupQuery).not.toHaveBeenCalled();
    });

    it("Should not call _setupQuery if set to true but no conversationId", function() {
      el.conversationId = '';
      el.client = client;
      spyOn(el, "_setupQuery");
      el.hasGeneratedQuery = true;
      expect(el._setupQuery).not.toHaveBeenCalled();
    });
  });

  describe("The conversationId property", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-view></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should ignore if not a properly formatted id", function() {
      el.conversationId = 'Frodo';
      expect(el.conversationId).toEqual('');
    });

    it("Should call _setupConversation if there is a client", function() {
      spyOn(el, "_setupConversation");
      el.client = client;
      el.conversationId = conversation.id;
      expect(el._setupConversation).toHaveBeenCalledWith();
    });

    it("Should wait until client.isReady", function() {
      client.isReady = false;
      el.client = client;
      spyOn(el, "_setupConversation");

      // Run
      el.conversationId = conversation.id;
      expect(el._setupConversation).not.toHaveBeenCalled();

      // Second run
      client._clientReady();
      expect(el._setupConversation).toHaveBeenCalled();
    });

    it("Should load the conversation if not cached", function() {
      el.client = client;
      expect(el.conversation).toBe(null);

      // Run
      el.conversationId = conversation.id.replace(/.$/, 'z');

      // Posttest
      expect(el.conversation).toEqual(jasmine.any(Layer.Core.Conversation));
      expect(el.conversation.isLoading).toBe(true);
    });

    it("Should clear the conversation if set to empty string", function() {
      el.client = client;
      el.conversation = conversation;
      expect(el.nodes.typingIndicators.conversation).toBe(conversation);

      el.conversationId = "";
      expect(el.conversation).toBe(null);
      expect(el.nodes.typingIndicators.conversation).toBe(null);
    });
  });

  describe("The conversation property", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-view></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should ignore invalid values", function() {
      el.conversation = {hey: "ho"};
      expect(el.conversation).toBe(null);
    });

    it("Should call _setupConversation if there is a value or not", function() {
      spyOn(el, "_setupConversation");
      el.client = client;
      el.conversation = conversation;
      expect(el._setupConversation).toHaveBeenCalled();
      el._setupConversation.calls.reset();

      el.conversation = null;
      expect(el._setupConversation).toHaveBeenCalled();
    });
  });

  describe("The autoFocusConversation property", function() {
    it("Should default to desktop-only", function() {
      testRoot.innerHTML = '<layer-conversation-view></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toEqual(Layer.UI.Constants.FOCUS.DESKTOP_ONLY);
      expect(Layer.UI.Constants.FOCUS.DESKTOP_ONLY).not.toBe(undefined);
    });

    it("Should be initializable to never", function() {
      testRoot.innerHTML = '<layer-conversation-view auto-focus-conversation="never"></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toBe('never');
    });

    it("Should be initializable to always", function() {
      testRoot.innerHTML = '<layer-conversation-view auto-focus-conversation="always"></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toBe('always');
    });
  });

  describe("The client property", function() {
    it("Should setup the conversation if there is a conversationId", function() {
      testRoot.innerHTML = '<layer-conversation-view conversation-id="' + conversation.id + '"></layer-conversation-view>';
      CustomElements.takeRecords();
      el = testRoot.firstChild;
      spyOn(el, "_setupConversation");
      Layer.Utils.defer.flush();

      expect(el._setupConversation).toHaveBeenCalledWith();

      // Inverse Test
      testRoot.innerHTML = '<layer-conversation-view></layer-conversation-view>';
      CustomElements.takeRecords();
      el = testRoot.firstChild;
      spyOn(el, "_setupConversation");
      Layer.Utils.defer.flush();

      expect(el._setupConversation).not.toHaveBeenCalled();
    });

    it("Should setup the query if there is a queryId", function() {
      testRoot.innerHTML = '<layer-conversation-view use-generated-query="false" query-id="' + query.id + '"></layer-conversation-view>';
      CustomElements.takeRecords();
      el = testRoot.firstChild;
      expect(el.query).toBe(null);
      Layer.Utils.defer.flush();

      expect(el.query).toBe(query);

      // Inverse test
      testRoot.innerHTML = '<layer-conversation-view use-generated-query="false"></layer-conversation-view>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      el = testRoot.firstChild;
      expect(el.query).toBe(null);
      el.client = client;
      expect(el.query).toBe(null);
    });
  });

  describe("The onRenderListItem property", function() {
    it("Should set the list onRenderListItem property", function() {
      var f = function() {};
      el.onRenderListItem = f;
      Layer.Utils.defer.flush();
      expect(el.nodes.list.onRenderListItem).toBe(f);
    });
  });

  describe("The getMenuItems property", function() {
    it("Should set the list getMenuItems property", function() {
      var f = function() {};
      el.getMenuItems = f;
      Layer.Utils.defer.flush();
      expect(el.nodes.list.getMenuItems).toBe(f);
    });
  });

  describe("The composeText property", function() {
    it("Should set the list composeText property", function() {
      el.composeText = "Frodo Must Cry";
      Layer.Utils.defer.flush();
      expect(el.nodes.composer.value).toEqual("Frodo Must Cry");
    });
  });

  describe("The composePlaceholder property", function() {
    it("Should set the list composePlaceholder property", function() {
      el.composePlaceholder = "Frodo Must Cry";
      Layer.Utils.defer.flush();
      expect(el.nodes.composer.placeholder).toEqual("Frodo Must Cry");
    });
  });

  describe("The dateRenderer property", function() {
    it("Should pass the property to the list", function() {
      var f = function() {}
      el.dateRenderer = f;
      Layer.Utils.defer.flush();
      expect(el.nodes.list.dateRenderer).toBe(f);
    });
  });

  describe("The messageStatusRenderer property", function() {
    it("Should pass the property to the list", function() {
      var f = function() {}
      el.messageStatusRenderer = f;
      Layer.Utils.defer.flush();
      expect(el.nodes.list.messageStatusRenderer).toBe(f);
    });
  });

  describe("The disable property", function() {
    it("Should pass the property to the list", function() {
      Layer.Utils.defer.flush();
      el.disable = true;
      expect(el.nodes.list.disable).toBe(true);
      el.disable = false;
      expect(el.nodes.list.disable).toBe(false);
    });
  });

  describe("The created() method", function() {
    it("Should setup basic properties", function() {
      expect(el.nodes.list.tagName).toEqual('LAYER-MESSAGE-LIST');
      expect(el.nodes.composer.tagName).toEqual('LAYER-COMPOSE-BAR');
      expect(el.nodes.typingIndicators.tagName).toEqual('LAYER-TYPING-INDICATOR');
    });

    it("Should set a tabIndex of -1 if its unset", function() {
      expect(el.tabIndex).toEqual(-1);

      // Inverse
      testRoot.innerHTML = '<layer-conversation-view tabindex="5"></layer-conversation-view>';
      CustomElements.takeRecords();
      el = testRoot.firstChild;
      expect(el.tabIndex).toEqual(5);
    });
  });

  describe("The onKeyDown() method", function() {
    it("Should call focusText onKeyDown is called", function() {
        spyOn(el, "focusText");
        el.onKeyDown();
        expect(el.focusText).toHaveBeenCalledWith();
    });
  });

  describe("The focusText() method", function() {
    it("Should call the composers focus method", function() {
      spyOn(el.nodes.composer, "focus");
      el.focusText();
      expect(el.nodes.composer.focus).toHaveBeenCalledWith();
    });
  });

  describe("The send() method", function() {
    it("Should call the composers focus method", function() {
      spyOn(el.nodes.composer, "send");
      el.send();
      expect(el.nodes.composer.send).toHaveBeenCalledWith();
    });
  });

  describe("The _setupConversation() method", function() {
    beforeEach(function() {
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      el.client = client;
    });
    it("Should setup the composers Conversation", function() {
      expect(el.nodes.composer.conversation).toBe(null);
      el.conversationId = conversation.id;
      expect(el.nodes.composer.conversation).toBe(conversation);
    });

    it("Should setup the typing-indicators Conversation", function() {
      expect(el.nodes.typingIndicators.conversation).toBe(null);
      el.conversationId = conversation.id;
      expect(el.nodes.typingIndicators.conversation).toBe(conversation);

    });

    it("Should call focusText if showAutoFocusConversation returns true", function() {
      el.autoFocusConversation = Layer.UI.Constants.FOCUS.ALWAYS;
      spyOn(el, "focusText");
      el.conversationId = conversation.id;
      expect(el.focusText).toHaveBeenCalledWith();

      // Inverse
      el.focusText.calls.reset();
      el.autoFocusConversation = Layer.UI.Constants.FOCUS.NEVER;
      el.conversationId = conversation.id;
      expect(el.focusText).not.toHaveBeenCalled();
    });

    it("Should delay if client is not ready", function() {
      spyOn(el.query, "update");
      client.isReady = false;
      el.hasGeneratedQuery = true;
      el.conversation = conversation;

      expect(el.query.update).not.toHaveBeenCalled();
      client._clientReady();
      expect(el.query.update).toHaveBeenCalled();
    });

    it("Should clear the conversation", function() {
      spyOn(el, "_setupConversation").and.callThrough();
      el.conversation = conversation;
      expect(el.nodes.composer.conversation).toBe(conversation);

      el.conversation = null;

      expect(el._setupConversation).toHaveBeenCalled();
      expect(el.nodes.composer.conversation).toBe(null);
    });

    it("Should retry when client isReady", function() {
      spyOn(el, "_setupConversation").and.callThrough();
      client.isReady = false;
      el.conversationId = conversation.id.replace(/.$/, 'z');
      el.hasGeneratedQuery = true;
      el._setupConversation();

      el._setupConversation.calls.reset();

      client._clientReady();
      expect(el._setupConversation).toHaveBeenCalled();
    });

    it("Should not update the predicate if its not a generated query", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = false;
      el.conversation = conversation;
      expect(query.update).not.toHaveBeenCalled();
    });

    it("Should update conversation query predicate", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = true;
      el.conversation = conversation;
      expect(query.update).toHaveBeenCalledWith({
        predicate: 'conversation.id = "' + conversation.id + '"'
      });
    });

    it("Should update channel query predicate", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = true;
      var channel = client.createChannel({
        name: "test"
      });
      el.conversation = channel;
      expect(query.update).toHaveBeenCalledWith({
        predicate: 'channel.id = "' + channel.id +'"'
      });
    });
  });

  describe("The shouldAutoFocusConversation() method", function() {
    beforeEach(function() {
      el.autoFocusConversation = Layer.UI.Constants.FOCUS.DESKTOP_ONLY;
    });

    it("Should return true if always", function() {
      el.autoFocusConversation = Layer.UI.Constants.FOCUS.ALWAYS;
      expect(el.shouldAutoFocusConversation('')).toBe(true);
    });

    it("Should return false if never", function() {
      el.autoFocusConversation = Layer.UI.Constants.FOCUS.NEVER;
      expect(el.shouldAutoFocusConversation('')).toBe(false);
    });

    it("Should return false for a mobile device", function() {
      Layer.Utils.isMobile = true;
      expect(el.shouldAutoFocusConversation({})).toBe(false);
      Layer.Utils.isMobile = false;
    });

    it("Should return false for mobile Edge", function() {
      Layer.Utils.isMobile = false;
      expect(el.shouldAutoFocusConversation({maxTouchPoints: 3})).toBe(false);
    });

    it("Should return true for desktop browsers", function() {
      Layer.Utils.isMobile = false;
      expect(el.shouldAutoFocusConversation({})).toBe(true);
    });
  });
});