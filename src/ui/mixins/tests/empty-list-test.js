/* eslint-disable */
// TODO: Apply this to a temporary list rather than an existing widget
describe("Empty List Mixin", function() {

  var el, testRoot, client, conversation, query, user1;

  beforeEach(function() {
    jasmine.clock().install();

    client = new Layer.init({
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

  describe("The isEmptyList property", function() {
      it("Should initialize to hidden/false", function() {
        expect(el.isEmptyList).toBe(false);
        expect(el.nodes.emptyNode.style.display).toEqual("none");
      });
      it("Should update the display state for emptyNode", function() {
        el.isEmptyList = true;
        expect(el.nodes.emptyNode.style.display).toEqual('');

        el.isEmptyList = false;
        expect(el.nodes.emptyNode.style.display).toEqual('none');
      });
      it("Should reapply its isEmptyList value after onRerender", function() {
        el.isEmptyList = true;
        query.data = [];
        el.onRerender({type: "add", messages: []});
        expect(el.nodes.emptyNode.style.display).toEqual('');
      });
    });



    describe("The onRerender() method", function() {
      it("Should update isEmptyList", function() {
        el.isEmptyList = true;
        el.onRerender({});
        expect(el.isEmptyList).toBe(false);

        el.query.data = [];
        el.onRerender({});
        expect(el.isEmptyList).toBe(true);

        el.isEmptyList = false;
        el.query.data = [];
        el.onRerender({type: "reset"});
        expect(el.isEmptyList).toBe(false);
      });
    });

});