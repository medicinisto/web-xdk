/* eslint-disable */
describe("List Item Selection Mixin", function() {

    var el, testRoot, client;
  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      id: 'layer:///identities/FrodoTheDodo',
      displayName: 'Frodo is a Dodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-item');
    testRoot.appendChild(el);
    Layer.Utils.defer.flush();
    jasmine.clock().tick(1000);
    Layer.Utils.defer.flush();
    jasmine.clock().tick(10);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

    if (el) el.destroy();
    if (client) client.destroy();
  });


  it("Should add and remove the layer-selected-item class", function() {
    expect(el.classList.contains('layer-selected-item')).toBe(false);
    el.isSelected = true;
    expect(el.classList.contains('layer-selected-item')).toBe(true);
    el.isSelected = false;
    expect(el.classList.contains('layer-selected-item')).toBe(false);
  });

  it("Should call onSelection", function() {
    spyOn(el, "onSelection");
    el.isSelected = true;
    expect(el.onSelection).toHaveBeenCalledWith(true);
    el.isSelected = false;
    expect(el.onSelection).toHaveBeenCalledWith(false);
  });
});
