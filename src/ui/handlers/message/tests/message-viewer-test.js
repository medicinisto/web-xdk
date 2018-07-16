describe("View Tests", function() {
  var el;
  var TextModel;
  var conversation;
  var testRoot;
  var client;

  beforeEach(function() {
    jasmine.clock().install();
    restoreAnimatedScrollTo = Layer.UI.UIUtils.animatedScrollTo;
    spyOn(Layer.UI.UIUtils, "animatedScrollTo").and.callFake(function(node, position, duration, callback) {
      var timeoutId = setTimeout(function() {
        node.scrollTop = position;
        if (callback) callback();
      }, duration);
      return function() {
        clearTimeout(timeoutId);
      };
    });

    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred',
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });
    client._clientAuthenticated();
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';

    TextModel = Layer.Core.Client.getMessageTypeModelClass("TextModel");

    el = document.createElement('layer-message-viewer');
    testRoot.appendChild(el);

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);
    if (el) el.onDestroy();
  });

  it("Should render its model", function() {
    var model = new TextModel({
      text: "hello"
    });
    el.model = model;
    Layer.Utils.defer.flush();

    expect(el.childNodes.length).toEqual(1);
    expect(el.nodes.ui.tagName).toEqual('LAYER-TEXT-MESSAGE-VIEW');
    expect(el.firstChild.tagName).toEqual('LAYER-STANDARD-MESSAGE-VIEW-CONTAINER');
  });

  it("Should render its large model and a title", function() {
    var FeedbackModel = Layer.Core.Client.getMessageTypeModelClass("FeedbackModel");
    var model = new FeedbackModel({});
    el.size = 'large';
    el.model = model;
    Layer.Utils.defer.flush();

    expect(el.childNodes.length).toEqual(2);
    expect(el.childNodes[0].tagName).toEqual('LAYER-TITLE-BAR');
    expect(el.childNodes[1].tagName).toEqual('LAYER-FEEDBACK-MESSAGE-LARGE-VIEW');
  });

});