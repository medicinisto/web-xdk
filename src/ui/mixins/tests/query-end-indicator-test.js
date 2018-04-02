/* eslint-disable */
// TODO: Apply this to a temporary list rather than an existing widget
describe("Query End Mixin", function() {

  var el, testRoot, client, conversation, query, user1;

  beforeEach(function() {
    jasmine.clock().install();

    client = Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });
    client._clientAuthenticated();
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-message-list');
    testRoot.appendChild(el);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';
    query = client.createQuery({
      model: Layer.Core.Query.Message,
      predicate: 'conversation.id = "' + conversation.id + '"'
    });
    query.isFiring = false;
    for (i = 0; i < 35; i++) {
      query.data.push(conversation.createMessage("m " + i).send());
    }

    user1 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    el.query = query;
    el.style.height = '300px';

    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    if (el) el.destroy();
    if (client) client.destroy();
    jasmine.clock().uninstall();
  });

  describe("The isEndOfResults property", function() {
      it("Should initialize to hidden/false", function() {
        var el = document.createElement('layer-message-list');
        testRoot.appendChild(el);
        Layer.Utils.defer.flush();

        expect(el.isEndOfResults).toBe(false);
        expect(el.nodes.endOfResultsNode.classList.contains('layer-end-of-results')).toBe(false);
      });
      it("Should toggle the layer-end-of-results class", function() {
        var el = document.createElement('layer-message-list');
        testRoot.appendChild(el);
        Layer.Utils.defer.flush();


        el.isEndOfResults = true;
        expect(el.classList.contains('layer-end-of-results')).toBe(true);

        el.isEndOfResults = false;
        expect(el.classList.contains('layer-end-of-results')).toBe(false);
      });
      it("Should reapply its isEndOfResults value after onRerender", function() {
        el.isEndOfResults = true;
        query.data = [];
        el.onRerender({type: "add", messages: []});
        expect(el.classList.contains('layer-end-of-results')).toBe(true);
      });
    });

   describe("The _renderPagedDataDone() method", function() {
    it("Should set isEndOfResults based on isDestroyed", function() {
      var fragment = document.createDocumentFragment();
      el.query.isDestroyed = true;
      el._renderPagedDataDone({}, fragment, {inRender: true});
      expect(el.isEndOfResults).toBe(false);
      el.query.isDestroyed = false;
    });

    it("Should set isEndOfResults based on pagedToEnd", function() {
      var fragment = document.createDocumentFragment();
      el.query.pagedToEnd = true;
      el._renderPagedDataDone({}, fragment, {inRender: true});
      expect(el.isEndOfResults).toBe(true);

      el.query.pagedToEnd = false;
      el._renderPagedDataDone({}, fragment, {inRender: true});
      Layer.Utils.defer.flush();
      expect(el.isEndOfResults).toBe(false);
    });
   });
});