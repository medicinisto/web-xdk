/* eslint-disable */
describe('layer-action-button', function() {
  var el, testRoot, client;

  beforeEach(function() {
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    el = document.createElement('layer-action-button');
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    testRoot.appendChild(el);
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
    var evt = new Event('touchstart', { bubbles: true });
    evt.touches = [{screenX: 400, screenY: 400}];
    el.dispatchEvent(evt);

    var evt = new Event('touchend', { bubbles: true });
    evt.touches = [{screenX: 400, screenY: 400}];
    el.dispatchEvent(evt);
  }

  it("Should set the button text", function() {
    el.text = "hey ho";
    expect(el.nodes.button.innerHTML).toEqual("hey ho");
  });

  it("Should set the tooltip", function() {
    el.tooltip = "hey ho";
    expect(el.nodes.button.title).toEqual("hey ho");
  });

  it("Should set and use the event", function() {
    el.event = "kill-frodo-the-dodo";
    var spy = jasmine.createSpy('callback');
    el.addEventListener("kill-frodo-the-dodo", spy);
    if (Layer.Utils.isIOS) {
      click(el);
    } else {
      el.click();
    }
    expect(spy).toHaveBeenCalledWith(jasmine.any(Event));
  });

  it("Should set and use the data", function() {
    el.event = "kill-frodo-the-dodo";
    el.data = {howdy: "ho"}
    var eventData;
    el.addEventListener("kill-frodo-the-dodo", function(evt) {
      eventData = evt.detail;
    });
    if (Layer.Utils.isIOS) {
      click(el);
    } else {
      el.click();
    }
    expect(eventData).toEqual({howdy: "ho"});
  });

  it("Should get and set disabled state", function() {
    el.disabled = true;
    expect(el.nodes.button.disabled).toBe(true);
    el.disabled = false;
    expect(el.nodes.button.disabled).toBe(false);
  });
});
