/* eslint-disable */
describe('layer-presence', function() {
  var el, testRoot, client;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    client = new Layer.init({
      appId: 'Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client.user._presence.status = 'available';
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-presence');
    testRoot.appendChild(el);
    el.item = client.user;
    Layer.Utils.defer.flush();
  });
  afterEach(function() {
    document.body.removeChild(testRoot);
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
  });

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  describe("The item property", function() {
    it("Should accept an identity and bind its changes to onRerender", function() {
      spyOn(el, "onRerender");
      el.item = null;
      el.item = client.user;
      client.user.trigger("identities:change");
      expect(el.onRerender).toHaveBeenCalled();
    });

    it("Should accept an identity-like object and bind its changes to onRerender", function() {
      spyOn(el, "onRerender");
      el.item = client.user.toObject();
      client.user.trigger("identities:change");
      expect(el.onRerender).toHaveBeenCalled();
    });

    it("Should ignore an unknown object", function() {
      el.item = "Gah!";
      expect(el.item).toBe(null);
    });
  });

  it('Should start with available class', function() {
    expect(el.classList.contains('layer-presence-available')).toBe(true);
  });

  it('Should update its class', function() {
    client.user._presence.status = 'away';
    client.user.trigger('identities:change');
    expect(el.classList.contains('layer-presence-available')).toBe(false);
    expect(el.classList.contains('layer-presence-away')).toBe(true);
  });

  it("Should render unknown if there is no item", function() {
    el.item = null;
    el.onRerender();
    expect(el.classList.contains('layer-presence-unknown')).toBe(true);
  });

  it("Should trigger layer-presence-click on click", function() {
    var spy = jasmine.createSpy("eventListener");
    el.addEventListener("layer-presence-click", spy);
    click(el);
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: {
        item: el.item
      }
    }));
  });
});