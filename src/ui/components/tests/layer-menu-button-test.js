/* eslint-disable */
describe('layer-menu-button', function() {
  var el, testRoot, client;
  beforeEach(function() {
    client = new Layer.init({
      appId: 'Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-menu-button');
    testRoot.appendChild(el);
    el.enabled = true;
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();

    document.body.removeChild(testRoot);
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

  it("Should wire up the button to call onButtonClick", function() {
    var menus = document.querySelectorAll('layer-menu');
    for (var i = 0; i < menus.length; i++) menus[i].parentNode.removeChild(menus[i]);
    expect(document.querySelectorAll('layer-menu').length).toEqual(0);
    click(el);
    Layer.Utils.defer.flush();
    expect(document.querySelectorAll('layer-menu').length).toEqual(1);
  });

  it("Should apply menuWidth", function() {
    el.menuWidth = 345;
    click(el);
    Layer.Utils.defer.flush();
    expect(document.querySelector('layer-menu').style.minWidth).toEqual('345px');
  });

  it("Should apply the item property", function() {
    el.item = "Frodo";
    var calledWith;
    el.getMenuItems = function(item) {
      calledWith = item;
    };
    click(el);
    Layer.Utils.defer.flush();
    expect(calledWith).toEqual("Frodo");
  });

  it("Should apply menu options to the menu", function() {
    var options = [];
    el.getMenuItems = function() {return options;};
    click(el);
    Layer.Utils.defer.flush();
    expect(document.querySelector('layer-menu').items).toBe(options);
  });
});