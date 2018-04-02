/* eslint-disable */
describe("Focus On Keydown Mixin", function() {
  var called;
  beforeAll(function() {
    Layer.UI.registerComponent('focus-on-keydown-test', {
      mixins: [Layer.UI.mixins.FocusOnKeydown],
      methods: {
        onKeyDown: function() {

        }
      }
    });
  });

  var el, testRoot, client, query;

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
    el = document.createElement('focus-on-keydown-test');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (el) el.destroy();
    if (client) client.destroy();
    client = null;
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);

  });

  beforeEach(function() {
    spyOn(el, "onKeyDown");
  });


  it("Should not call onKeyDown if a character is hit while focusing on an input", function() {
    var input = document.createElement("input");
    testRoot.appendChild(input);
    input.focus();
    el._onKeyDown({
      keyCode: 70,
      metaKey: false,
      ctrlKey: false
    });
    expect(el.onKeyDown).not.toHaveBeenCalled();
  });

  it("Should not call onKeyDown if a charater is hit while holding a metaKey or ctrlKey", function() {
    el._onKeyDown({
      keyCode: 70,
      metaKey: false,
      ctrlKey: true
    });
    expect(el.onKeyDown).not.toHaveBeenCalled();
  });

  it("Should not call onKeyDown if a non-character key is hit", function() {
    el._onKeyDown({
      keyCode: 4,
      metaKey: false,
      ctrlKey: false
    });
    expect(el.onKeyDown).not.toHaveBeenCalled();
  });

  it("Should call onKeyDown", function() {
    el._onKeyDown({
      keyCode: 70,
      metaKey: false,
      ctrlKey: false
    });
    expect(el.onKeyDown).toHaveBeenCalled();
  });
});
