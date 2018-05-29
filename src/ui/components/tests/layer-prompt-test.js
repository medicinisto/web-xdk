/* eslint-disable */
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

  describe('layer-prompt', function() {
    var el, testRoot, client, conversation, message, notification;

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
      client._clientAuthenticated();

      testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
      el = document.createElement('layer-prompt');
      el.client = client;
      testRoot.appendChild(el);
      Layer.Utils.defer.flush();
    });
    afterEach(function() {
      if (client) {
        client.destroy();
        client = null;
      }
      if (el) el.destroy();

      Layer.Utils.defer.reset();
      document.body.removeChild(testRoot);
    });

    it("Should open and show the specified values", function() {
      el.show({
        text: "a",
        title: "b",
        button1: "c",
        button2: "d"
      });

      // Posttest
      expect(el.nodes.text.innerHTML).toEqual("a");
      expect(el.nodes.title.innerHTML).toEqual("b");
      expect(el.nodes.actionButton1.text).toEqual("c");
      expect(el.nodes.actionButton2.text).toEqual("d");
    });

    it("Should close if button1 is clicked", function() {
      expect(el.nodes.actionButton1.classList.contains('layer-prompt-hidden')).toBe(false);
      el.show({});
      click(el.nodes.actionButton1);
      expect(el.nodes.actionButton1.classList.contains('layer-prompt-hidden')).toBe(true);
    });

    it("Should close if button2 is clicked", function() {
      expect(el.nodes.actionButton1.classList.contains('layer-prompt-hidden')).toBe(false);
      el.show({});
      click(el.nodes.actionButton2);
      expect(el.nodes.actionButton1.classList.contains('layer-prompt-hidden')).toBe(true);
    });

});
