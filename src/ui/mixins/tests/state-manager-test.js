/* eslint-disable */
describe("State property", function() {
  var testRoot, client;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    jasmine.clock().install();
    client = Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
  });

  afterEach(function() {
    try {
      jasmine.clock().uninstall();
      document.body.removeChild(testRoot);

      client.destroy();
    } catch(e) {}
  });

  it("Should trigger onRenderState", function() {
    Layer.UI.registerComponent('state-test1', {
      methods: {
        onRenderState: jasmine.createSpy('spy')
      }
    });
    var el = document.createElement('state-test1');
    Layer.Utils.defer.flush();
    expect(el.onRenderState).not.toHaveBeenCalled();

    el.state = {hey: "ho"};
    expect(el.onRenderState).toHaveBeenCalledWith();

    // Cleanup
    el.destroy();
  });

  it("Should not call onRenderState if no state is set", function() {
    Layer.UI.registerComponent('state-test3', {
      methods: {
        onRenderState: jasmine.createSpy('spy')
      }
    });
    var elParent = document.createElement('layer-avatar');
    var el = document.createElement('state-test3');
    elParent.appendChild(el);
    testRoot.appendChild(elParent);
    Layer.Utils.defer.flush();
    expect(el.state).toEqual(null);
    expect(el.onRenderState).not.toHaveBeenCalled();

    // Cleanup
    el.destroy();
  });
});
