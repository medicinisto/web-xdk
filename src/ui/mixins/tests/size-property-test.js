/* eslint-disable */
describe("Size Property Mixin", function() {
  var called;
  beforeAll(function() {
    Layer.UI.registerComponent('size-property-test', {
      mixins: [Layer.UI.mixins.SizeProperty],
      properties: {
        size: {
          value: 'largish'
        },
        supportedSizes: {
          value: ['smallish', 'mediumish', 'largish'],
        },
      },
    });
  });

  var el, testRoot, client;

  beforeEach(function() {
    jasmine.clock().install();
    called = false;
    client = Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('size-property-test');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

    if (el) el.destroy();
    if (client) client.destroy();
  });

  it("Should initialize properly", function() {
    expect(el.size).toBe('largish');
    expect(el.className).toEqual('layer-size-largish');
  });

  it("Should change properly", function() {
    el.size = "mediumish";
    expect(el.className).toEqual('layer-size-mediumish');
  });

  it("Should reject invalid sizes", function() {
    el.size = "frodo";
    expect(el.size).toEqual("largish");
    expect(el.className).toEqual('layer-size-largish');
  });
});
