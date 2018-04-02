/* eslint-disable */
describe('layer-menu', function() {
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
    el = document.createElement('layer-menu');
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

  it("Should generate menus with suitable text", function() {
    el.items = [
      {text: "a", method: function() {}},
      {text: "b", method: function() {}}
    ];

    expect(el.firstChild.childNodes.length).toEqual(2);
    expect(el.firstChild.childNodes[0].innerHTML).toEqual("a");
    expect(el.firstChild.childNodes[1].innerHTML).toEqual("b");
  });

  it("Should call methods when text is clicked", function() {
    el.items = [
      {text: "a", method: jasmine.createSpy("a")},
      {text: "b", method: jasmine.createSpy("b")}
    ];

    click(el.firstChild.childNodes[0]);
    expect(el.items[0].method).toHaveBeenCalledWith();
    expect(el.items[1].method).not.toHaveBeenCalledWith();

    click(el.firstChild.childNodes[1]);
    expect(el.items[0].method).toHaveBeenCalledWith();
    expect(el.items[1].method).toHaveBeenCalledWith();
  });

  it("Should show and hide the menu", function() {
    el.near = document.body;
    expect(window.getComputedStyle(el).display).toEqual("none");
    el.isShowing = true;
    expect(window.getComputedStyle(el).display).toEqual("block");
    el.isShowing = false;
    expect(window.getComputedStyle(el).display).toEqual("none");
  });


  it("Should position the menu near the specified node", function() {
    var nearNode = document.createElement('div');
    nearNode.style.position = 'absolute';
    nearNode.style.top = '200px';
    nearNode.style.left = '200px';
    nearNode.style.height = '50px';
    nearNode.style.width = '50px';
    el.near = nearNode;
    el.items = [
      {text: "a", method: function() {}},
      {text: "b", method: function() {}}
    ];
    document.body.appendChild(nearNode);

    // Run
    el.isShowing = true;
    expect(parseInt(el.style.top) == (200 - el.clientHeight) || parseInt(el.style.top) == 250).toBe(true);
    expect(parseInt(el.offsetLeft) == (200 - el.clientWidth) || parseInt(el.offsetLeft) == 250).toBe(true);

    document.body.removeChild(nearNode);
  });
});
