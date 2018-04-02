/* eslint-disable */
describe("Unknown Handler", function() {

  var client, message, el;

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
    client._clientAuthenticated();
    var conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });
    message = conversation.createMessage({parts: [{mimeType: "text/hat", body: "howdy ho"}]});

    el = document.createElement('layer-message-unknown');
    el._contentTag = 'layer-message-unknown';

    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
  });

  afterEach(function() {
    if (el) el.destroy();
    if (client) client.destroy();
    jasmine.clock().uninstall();
    el.onDestroy();

  });

  it("Should select unknown", function() {
    var handler = Layer.UI.handlers.message.getHandler(message);
    expect(handler.tagName).toEqual('layer-message-unknown');
  });

  it("Should render something relevant", function() {
    el.message = message;
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
    expect(el.innerHTML).toMatch(/has no renderer/);
  });
});