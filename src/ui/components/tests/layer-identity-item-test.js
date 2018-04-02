/* eslint-disable */
describe('layer-identity-item', function() {
  var el, testRoot, client;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'Fred'
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
    el = document.createElement('layer-identity-item');
    testRoot.appendChild(el);
    el.item = client.user;

    el.replaceableContent = Layer.UI.components['layer-identity-list'].properties
      .filter(function(prop) {
        return prop.propertyName === 'replaceableContent';
      })[0].value;

    Layer.Utils.defer.flush();
    jasmine.clock().tick(1000);
    Layer.Utils.defer.flush();
    jasmine.clock().tick(10);
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) {
      el.destroy();
      el = null;
    }
    jasmine.clock().uninstall();
    document.body.removeChild(testRoot);
  });

  function click(el) {
    if (Layer.Utils.isIOS) {
      var evt = new Event('touchstart', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.dispatchEvent(evt);

      var evt = new Event('touchend', { bubbles: true });
      evt.touches = [{screenX: 400, screenY: 400}];
      el.click();
      el.dispatchEvent(evt);
    } else {
      el.click();
    }
  }

  describe("The selected property", function() {
    it("Should update checkbox state", function() {
      expect(el.nodes.checkbox.checked).toBe(false);
      el.isSelected = true;
      expect(el.nodes.checkbox.checked).toBe(true);
      el.isSelected = false;
      expect(el.nodes.checkbox.checked).toBe(false);
    });

    it("Should update layer-identity-item-selected class", function() {
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      el.isSelected = true;
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
      el.isSelected = false;
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
    });

    it("Should get the checkbox state", function() {
      el.nodes.checkbox.checked = false;
      expect(el.isSelected).toBe(false);
      el.nodes.checkbox.checked = true;
      expect(el.isSelected).toBe(true);
    });

    it("Should get the selected state if no checkbox", function() {
      el.nodes.checkbox = null;
      el.properties.isSelected = false;
      expect(el.isSelected).toBe(false);
      el.properties.isSelected = true;
      expect(el.isSelected).toBe(true);
    });
  });

  describe("The size property", function() {
    it("Should pass size to the avatar", function() {
      el.size = 'small';
      expect(el.nodes.avatar.size).toEqual('small');

      el.size = 'medium';
      expect(el.nodes.avatar.size).toEqual('medium');

      el.size = 'large';
      expect(el.nodes.avatar.size).toEqual('large');
    });

    it("Should hide or show presence and avatar", function() {
      expect(window.getComputedStyle(el.nodes.avatar).display).toEqual("block");
      expect(window.getComputedStyle(el.nodes.presence).display).toEqual("none");

      el.size = 'tiny';

      expect(window.getComputedStyle(el.nodes.avatar).display).toEqual("none");
      expect(window.getComputedStyle(el.nodes.presence).display).toEqual("block");
    });
  });

  describe("The create() method", function() {
    it("Should initialize selected to true from innerHTML", function() {
      testRoot.innerHTML = '<layer-identity-item is-selected="true"></layer-identity-item>';
      testRoot.firstChild.replaceableContent = Layer.UI.components['layer-identity-list'].properties.filter(function(prop) {return prop.propertyName === 'replaceableContent';})[0].value;

      CustomElements.takeRecords();
      expect(testRoot.firstChild.isSelected).toBe(true);
      Layer.Utils.defer.flush();
      expect(testRoot.firstChild.nodes.checkbox.checked).toBe(true);
    });

    it("Should initialize selected to false from innerHTML", function() {
      testRoot.innerHTML = '<layer-identity-item is-selected="false"></layer-identity-item>';
      testRoot.firstChild.replaceableContent = Layer.UI.components['layer-identity-list'].properties.filter(function(prop) {return prop.propertyName === 'replaceableContent';})[0].value;
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      expect(testRoot.firstChild.isSelected).toBe(false);
      expect(testRoot.firstChild.nodes.checkbox.checked).toBe(false);
    });

    it("Should initialize selected with default of false from innerHTML", function() {
      testRoot.innerHTML = '<layer-identity-item></layer-identity-item>';
      testRoot.firstChild.replaceableContent = Layer.UI.components['layer-identity-list'].properties.filter(function(prop) {return prop.propertyName === 'replaceableContent';})[0].value;
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      expect(testRoot.firstChild.isSelected).toBe(false);
      expect(testRoot.firstChild.nodes.checkbox.checked).toBe(false);
    });

    it("Should wire up the _onChange event handler", function() {
      var called = false;
      el.addEventListener('layer-identity-item-selected', function(evt) {
        called = true;
      });

      // Run
      click(el.nodes.checkbox);

      // Posttest
      expect(called).toBe(true);
    });
  });

  describe("The _onChange() method", function() {
    it("Should trigger layer-identity-item-selected", function() {
      var selectedCalled = false,
        deselectedCalled = false;
      el.addEventListener('layer-identity-item-selected', function(evt) {
        selectedCalled = true;
      });
      el.addEventListener('layer-identity-item-deselected', function(evt) {
        deselectedCalled = true;
      });

      // Run
      click(el.nodes.checkbox);

      // Posttest
      expect(deselectedCalled).toBe(false);
      expect(selectedCalled).toBe(true);
    });

    it("Should trigger layer-identity-item-deselected", function() {
      el.isSelected = true;

      var selectedCalled = false,
        deselectedCalled = false;
      el.addEventListener('layer-identity-item-selected', function(evt) {
        selectedCalled = true;
      });
      el.addEventListener('layer-identity-item-deselected', function(evt) {
        deselectedCalled = true;
      });

      // Run
      click(el.nodes.checkbox);

      // Posttest
      expect(deselectedCalled).toBe(true);
      expect(selectedCalled).toBe(false);
    });

    it("Should update the layer-identity-item-selected if evt.preventDefault not called", function() {
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      click(el.nodes.checkbox);
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
      click(el.nodes.checkbox);
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
    });

    it("Should undo the change if evt.preventDefault was called", function() {
      el.addEventListener('layer-identity-item-selected', function(evt) {
        evt.preventDefault();
      });
      el.addEventListener('layer-identity-item-deselected', function(evt) {
        evt.preventDefault();
      });

      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      expect(el.nodes.checkbox.checked).toBe(false);
      click(el.nodes.checkbox);
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      expect(el.nodes.checkbox.checked).toBe(false);

      el.isSelected = true;
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
      expect(el.nodes.checkbox.checked).toBe(true);
      click(el.nodes.checkbox);
      expect(el.innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
      expect(el.nodes.checkbox.checked).toBe(true);
    });
  });

  describe("The onRender() method", function() {
    it("Should setup the layer-avatar users", function() {
      el.nodes.avatar.users = [];
      el.onRender();
      expect(el.nodes.avatar.users).toEqual([client.user]);
      expect(el.querySelector('layer-presence').tagName).toEqual('LAYER-PRESENCE');
    });

    it("Should _render the displayName", function() {
      el.nodes.title.innerHTML = '';
      el.onRender();
      expect(el.nodes.title.innerHTML).toEqual(client.user.displayName);
    });

    it("Should update the displayName when it changes", function() {
      client.user.displayName = 'Quick change it back!';
      client.user.trigger('identities:change', {property: 'displayName', oldValue: 'Frodo', newValue: client.user.displayName});
      expect(el.nodes.title.innerHTML).toEqual(client.user.displayName);
    });
  });

  describe("The _runFilter() method", function() {
    it("Should add layer-item-filtered if not a match", function() {
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('Samwise');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);
    });

    it("Should remove layer-item-filtered if it is a match", function() {
      el.classList.add('layer-item-filtered');
      el._runFilter('Frodo');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on substring against displayName, firstName, lastName and emailAddress", function() {
      var user = client.user;
      el._runFilter('froDo');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('MoJo');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.firstName = 'Mojo';
      el._runFilter('MoJo');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('POJO');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.lastName = 'pojO';
      el._runFilter('POJO');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter('pojo@layer');
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.emailAddress = 'pojo@layer.com';
      el._runFilter('pojo@layer');
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on RegEx against displayName, firstName, lastName and emailAddress", function() {
      var user = client.user;
      el._runFilter(/froDo/);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);
      el._runFilter(/froDo/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/moJo/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.firstName = 'Mojo';
      el._runFilter(/moJo/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/POJO/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.lastName = 'pojO';
      el._runFilter(/POJO/i);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
      el._runFilter(/pojo@layer/);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      user.emailAddress = 'pojo@layer.com';
      el._runFilter(/pojo@layer/);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match on Callback against displayName, firstName, lastName and emailAddress", function() {
      function test(user) {
        return user.firstName == 'Frodo';
      }
      el._runFilter(test);
      expect(el.classList.contains('layer-item-filtered')).toBe(true);

      client.user.firstName = 'Frodo';
      el._runFilter(test);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });

    it("Should match if no filter", function() {
      el._runFilter(null);
      expect(el.classList.contains('layer-item-filtered')).toBe(false);
    });
  });
});