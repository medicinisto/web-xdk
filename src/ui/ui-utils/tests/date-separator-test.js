/* eslint-disable */
describe("Date Separator Utility", function() {

  var el, testRoot, client, conversation, query, user1;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

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

    if (Layer.UI.components['layer-conversation-view'] && !Layer.UI.components['layer-conversation-view'].classDef) Layer.UI.init({});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-message-list');
    el.onRenderListItem = Layer.UI.UIUtils.dateSeparator;

    testRoot.appendChild(el);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';
    query = client.createQuery({
      model: Layer.Core.Query.Message,
      predicate: 'conversation.id = "' + conversation.id + '"'
    });
    query.isFiring = false;
    for (i = 0; i < 40; i++) {
      query.data.push(conversation.createMessage("m " + i).send());
    }

    user1 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    el.style.height = '300px';

    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    if (el) el.onDestroy();
    jasmine.clock().uninstall();
    client.destroy();
  });

  it("Should put a separator on top", function() {
    el.query = query;
    jasmine.clock().tick(1000);
    el.querySelectorAllArray('layer-message-item-sent').forEach(function(item, index) {
      if (index === 0) {
        expect(item.customNodeAbove).not.toBe(null);
        expect(item.customNodeBelow).toBe(null);
      } else {
        expect(item.customNodeAbove).toBe(null);
        expect(item.customNodeBelow).toBe(null);
      }
    });
  });

  it("Should put a separator between each date change", function() {
    // Every 10 messages decrement the date by 1
    var startDate = new Date('2010-10-10');
    query.data.forEach(function(item, index) {
      var offset = Math.floor(index / 10);
      var d = new Date(startDate);
      d.setDate(d.getDate() - offset);
      item.sentAt = d;
    });

    el.query = query;
    jasmine.clock().tick(1000);

    // Expect a separator every 10 messages
    el.querySelectorAllArray('layer-message-item-sent').forEach(function(item, index) {
      if (index % 10 === 0) {
        expect(item.customNodeAbove).not.toBe(null);
        expect(item.customNodeBelow).toBe(null);
      } else {
        expect(item.customNodeAbove).toBe(null);
        expect(item.customNodeBelow).toBe(null);
      }
    });
  });

  it("Should have a suitable looking date separator", function() {
    el.query = query;
    jasmine.clock().tick(1000);

    var separator = el.querySelector('layer-message-item-sent').customNodeAbove;
    var div = separator.querySelector('.layer-list-item-separator-date');
    expect(div).toEqual(jasmine.any(HTMLElement));
  });
});