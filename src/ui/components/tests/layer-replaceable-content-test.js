/* eslint-disable */
describe('layer-replaceable-content', function() {
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
    el = document.createElement('layer-conversation-view');
    testRoot.appendChild(el);
  });
  afterEach(function() {
    document.body.removeChild(testRoot);
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
  });

  it('Should accept a replaceableContent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.nodes.composerButtonPanelRight.replaceableContent = {
      composerButtonPanelRight: button
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).toBe(button);
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a replaceableContent DOM generator', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.nodes.composerButtonPanelRight.replaceableContent = {
      composerButtonPanelRight: function() {
        return button;
      }
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).toBe(button);
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a replaceableContent String', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.nodes.composerButtonPanelRight.replaceableContent = {
      composerButtonPanelRight: '<layer-avatar></layer-avatar>',
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild.tagName).toEqual('LAYER-AVATAR');
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a replaceableContent String generator', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.nodes.composerButtonPanelRight.replaceableContent = {
      composerButtonPanelRight: function() {
        return '<layer-avatar></layer-avatar>';
      }
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild.tagName).toEqual('LAYER-AVATAR');
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should ignore a replaceableContent DOM node with wrong name', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.nodes.composerButtonPanelRight.replaceableContent = {
      composerButtonPanelRight2: button
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).not.toBe(button);
  });

  it('Should accept a replaceableContent DOM Node provided to the root parent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.replaceableContent = {
      composerButtonPanelRight: button
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).toBe(button);
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a replaceableContent DOM generator provided to the root parent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.replaceableContent = {
      composerButtonPanelRight: function() {
        return button;
      }
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).toBe(button);
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a replaceableContent null provided to the root parent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.composer.replaceableContent = {
      composerButtonPanelRight: button
    };
    el.replaceableContent = {
      composerButtonPanelRight: null
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).toBe(null);
  });

  it('Should ignore a replaceableContent DOM with wrong name provided to the root parent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.replaceableContent = {
      composerButtonPanelRight2: function() {
        return button;
      }
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.composer.nodes.composerButtonPanelRight.firstChild.firstChild).not.toBe(button);
  });

  it('Should accept a replaceableContent provided to a mid-level parent DOM node', function() {
    // Setup
    var button = document.createElement("button");
    el.nodes.list.replaceableContent = {
      emptyNode: button
    };
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(el.nodes.list.nodes.emptyNode.firstChild.firstChild).toBe(button);
    expect(el.nodes.list.nodes.emptyNode.firstChild.tagName).toEqual("DIV");
    expect(el.nodes.list.nodes.emptyNode.firstChild.classList.contains('layer-replaceable-inner')).toBe(true);
  });

  it('Should accept a layer-replaceable-name provided to the root parent DOM nodes child nodes', function() {
    // Setup
    testRoot.innerHTML = '<layer-conversation-view><layer-send-button layer-replaceable-name="emptyNode"></layer-send-button></layer-conversation-view>';
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();

    // Test
    expect(testRoot.firstChild.nodes.list.nodes.emptyNode.firstChild.firstChild.tagName).toEqual("LAYER-SEND-BUTTON");
  });

  it('Should maintain children but with a stanard wrapper div should nothing be replaced', function() {
    // Setup
    testRoot.innerHTML = "<layer-replaceable-content name='frodo'><layer-send-button></layer-send-button></layer-replaceable-content>";
    content = testRoot.firstChild;
    content.parentComponent = el;
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();


    // Test
    expect(content.firstChild.firstChild.tagName).toEqual("LAYER-SEND-BUTTON");
  });
});