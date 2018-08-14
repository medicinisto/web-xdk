/* eslint-disable */
describe('layer-dialog', function() {
  var el, client, testRoot;


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

  beforeAll(function() {
    var style = document.createElement('style');
    style.innerText = ".layer-dialog-title-bar {min-height: 24px;}";
    document.body.appendChild(style);
  });

  beforeEach(function() {
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      id: 'layer:///identities/frodo-the-dodo'
    });
    client.isReady = client.isAuthenticated = true;
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
    document.body.removeChild(testRoot);
  });

  describe("Working with Dialog Content", function() {
    it("Should render its string content", function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      el.isAnimationEnabled = false;
      el.replaceableContent = {
        content: "<div>hello world</div>"
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();

      expect(el.content.tagName).toEqual('DIV');
      expect(el.content.innerHTML).toEqual('hello world');
      expect(el.contains(el.content)).toBe(true);
    });

    it("Should render its node content", function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      var div = document.createElement('div');
      div.innerHTML = 'hello world';
      el.replaceableContent = {
        content: div
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();

      expect(el.content.tagName).toEqual('DIV');
      expect(el.content.innerHTML).toEqual('hello world');
      expect(el.contains(el.content)).toBe(true);
    });

    it("Should not require its content to have getTitle or getIconClass", function() {
      expect(function() {
        el = document.createElement('layer-dialog');
        el.isAnimationEnabled = false;

        var div = document.createElement('div');
        div.innerHTML = 'hello world';
        el.replaceableContent = {
          content: div
        };
        CustomElements.upgradeAll(el);
        testRoot.appendChild(el);
        Layer.Utils.defer.flush();
      }).not.toThrow();

      expect(el.nodes.titleBar.nodes.title.innerHTML).toEqual('');
      expect(el.nodes.titleBar.nodes.icon.className).toEqual('layer-title-bar-icon');
    });

    it("Should use its contents getTitle and getIconClass", function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      var div = document.createElement('div');
      div.getTitle = function() {return "Hello Title"}
      div.getIconClass = function() {return 'i-got-no-class'}
      div.innerHTML = 'hello world';
      el.replaceableContent = {
        content: div
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();

      expect(el.nodes.titleBar.nodes.title.innerHTML).toEqual('Hello Title');
      expect(el.nodes.titleBar.nodes.icon.classList.contains('i-got-no-class')).toBe(true);
      expect(el.nodes.titleBar.clientHeight).not.toEqual(0);
    });

    it("Should hide the icon if no icon provided", function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      var div = document.createElement('div');
      div.innerHTML = 'hello world';
      el.replaceableContent = {
        content: div
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();

      expect(el.nodes.titleBar.nodes.icon.clientHeight).toEqual(0);
      expect(el.nodes.titleBar.nodes.icon.clientWidth).toEqual(0);
    });

    it("Should hide the titlebar if no title provided", function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      var div = document.createElement('div');
      div.innerHTML = 'hello world';
      el.replaceableContent = {
        content: div
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();
      el.nodes.titleBar.nodes.icon.style.height = '24px';

      expect(el.nodes.titleBar.clientHeight).toEqual(0);

      el.icon = "hey";

      expect(el.nodes.titleBar.clientHeight).not.toEqual(0);
      el.icon = "";
      expect(el.nodes.titleBar.clientHeight).toEqual(0);

      el.isCloseButtonShowing = true;
      expect(el.nodes.titleBar.clientHeight).not.toEqual(0);
      el.isCloseButtonShowing = false;
      expect(el.nodes.titleBar.clientHeight).toEqual(0);
    });
  });


  describe("Showing and dismissing dialogs", function() {
    beforeEach(function() {
      el = document.createElement('layer-dialog');
      el.isAnimationEnabled = false;

      var div = document.createElement('div');
      div.innerHTML = 'hello world';
      el.replaceableContent = {
        content: div
      };
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();
    });

    it("Should show the closeButton iff isCloseButtonShowing is true", function() {
      el.title = "hey ho";

      expect(el.nodes.titleBar.nodes.close.clientHeight).toEqual(0);
      el.isCloseButtonShowing = true;
      expect(el.nodes.titleBar.nodes.close.clientHeight).not.toEqual(0);
      el.isCloseButtonShowing = false;
      expect(el.nodes.titleBar.nodes.close.clientHeight).toEqual(0);
    });

    it("Should dismiss the dialog if clicking on the dialog background but not on the dialog foreground", function() {
      expect(el.parentNode).toBe(testRoot);
      click(el.nodes.inner);
      expect(el.parentNode).toBe(testRoot);

      click(el);
      expect(el.parentNode).not.toBe(testRoot);
    });

    it("Should close on receiving a layer-container-done event", function() {
      expect(el.parentNode).toBe(testRoot);

      // Run
      var evt = new CustomEvent('layer-container-done', {
        detail: {},
        bubbles: true,
        cancelable: true,
      });
      el.nodes.inner.dispatchEvent(evt);

      // Posttest
      expect(el.parentNode).not.toBe(testRoot);
    });

    it("Should close on clicking the close button", function() {
      expect(el.parentNode).toBe(testRoot);
      click(el.nodes.titleBar.nodes.close);
      expect(el.parentNode).not.toBe(testRoot);
    });

    it("Should push state into history on creation", function() {
      expect(window.history.state.dialog).toEqual(el.id);
    });

    it("Should dismiss the dialog on pop-state", function(done) {
      expect(el.parentNode).toBe(testRoot);
      history.back();
      setTimeout(function() {
        expect(el.parentNode).not.toBe(testRoot);
        done();
      }, 1000);
    });

    it("Should dismiss the dialog if the ConversationView's conversation changes", function() {
      el.destroy(); // lets start over

      el = document.createElement('layer-conversation-view');
      var dialog = document.createElement('layer-dialog');
      dialog.isAnimationEnabled = false;
      dialog.replaceableContent = { content: "hello" };
      el.appendChild(dialog);
      dialog.parentComponent = el;
      CustomElements.upgradeAll(el);
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();

      expect(dialog.parentNode).toBe(el);
      el.conversation = client.createConversation({});
      expect(dialog.parentNode).not.toBe(el);
    });
  });
});