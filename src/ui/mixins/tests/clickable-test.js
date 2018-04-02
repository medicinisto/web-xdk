/* eslint-disable */
describe("The Clickable Mixin", function() {
  beforeAll(function() {
    Layer.UI.registerComponent('clickable-mixin-test', {
      mixins: [Layer.UI.mixins.Clickable],
      methods: {
        onCreate: function() {
          this.addClickHandler('random', this, this.onClick.bind(this));
        },
        onClick: function() {
          this.trigger('test-click');
        }
      }
    });
  });

  var el, testRoot, client, called;

  beforeEach(function() {
    jasmine.clock().install();
    called = false;
    client = new Layer.init({
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
    el = document.createElement('clickable-mixin-test');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (el) el.destroy();
    if (client) client.destroy();
    client = null;
    jasmine.clock().uninstall();
  });

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.click();
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  it("Should respond to click events", function() {
    el.addEventListener('test-click', function() { called = true });

    // Run
    click(el);

    // Posttest
    expect(called).toBe(true);
  });

  it("Should respond to tap events", function() {
    el.addEventListener('test-click', function() { called = true });

    // Run
    var e = new Event('touchstart');
    e.touches = [{screenX: 400, screenY: 400}];
    el.dispatchEvent(e);
    e = new Event('touchend');
    el.dispatchEvent(e);

    // Posttest
    expect(called).toBe(true);
  });

  it("Should remove click events", function() {
    el.removeClickHandler('random', el);
    el.addEventListener('test-click', function() { called = true });

    // Run
    click(el);

    // Posttest
    expect(called).toBe(false);
  });

  it("Should remove tap events", function() {
    el.removeClickHandler('random', el);
    el.addEventListener('test-click', function() { called = true });

    // Run
    var e = new Event('touchstart');
    el.dispatchEvent(e);
    e = new Event('touchend');
    el.dispatchEvent(e);

    // Posttest
    expect(called).toBe(false);
  });
});