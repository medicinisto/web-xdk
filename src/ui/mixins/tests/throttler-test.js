/* eslint-disable */
describe("The Throttler Mixin", function() {
  beforeAll(function() {
    Layer.UI.registerComponent('throttler-test', {
      mixins: [Layer.UI.mixins.Throttler],
    });
  });

  var el, testRoot, client;

  beforeEach(function() {
    jasmine.clock().install();
    called = false;
    client = Layer.init({
      appId: 'layer:///apps/staging/Fred',
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
    el = document.createElement('throttler-test');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

    if (el) el.destroy();
    if (client) client.destroy();
    client = null;
  });
  it("Should call once to start and once more after the timeout", function() {
    el._throttlerTimeout = 1000;
    var spy = jasmine.createSpy('callme');

    // Run
    el._throttler(spy);
    jasmine.clock().tick(100);
    expect(spy.calls.count()).toEqual(1);

    el._throttler(spy);
    jasmine.clock().tick(100);
    expect(spy.calls.count()).toEqual(1);

    el._throttler(spy);
    jasmine.clock().tick(100);
    expect(spy.calls.count()).toEqual(1);

    el._throttler(spy);
    jasmine.clock().tick(100);
    expect(spy.calls.count()).toEqual(1);

    el._throttler(spy);
    jasmine.clock().tick(1000);
    expect(spy.calls.count()).toEqual(2);
  });

  it("Should call once per timeout plus once at the start", function() {
    el._throttlerTimeout = 1000;
    var spy = jasmine.createSpy('callme');

    // Run
    el._throttler(spy);
    jasmine.clock().tick(1000);
    el._throttler(spy);
    jasmine.clock().tick(1000);
    el._throttler(spy);
    jasmine.clock().tick(1000);
    el._throttler(spy);
    jasmine.clock().tick(1000);
    el._throttler(spy);
    jasmine.clock().tick(1);
    el._throttler(spy);
    jasmine.clock().tick(1);
    el._throttler(spy);
    jasmine.clock().tick(1);
    el._throttler(spy);
    jasmine.clock().tick(1);
    el._throttler(spy);
    jasmine.clock().tick(1);
    expect(spy.calls.count()).toEqual(5);
  });
});