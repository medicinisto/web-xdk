/* eslint-disable */
describe('layer-membership-item', function() {
  var el, testRoot, client;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'Fred',
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
    el = document.createElement('layer-membership-item');
    testRoot.appendChild(el);
    el.item = client._createObject({
        "id": "layer:///channels/f3cc7b32-3c92-11e4-baad-164230d1df68/members/FrodoTheDodo",
        "url": "https://huh.com/channels/f3cc7b32-3c92-11e4-baad-164230d1df68/members/FrodoTheDodo",
        "channel": {
            "id": "layer:///channels/f3cc7b32-3c92-11e4-baad-164230d1df68",
            "url": "https://api.layer.com/channels/f3cc7b32-3c92-11e4-baad-164230d1df68",
            "name": "Channel Name"
        },
        "identity": {
            "id": "layer:///identities/FrodoTheDodo",
            "user_id": "FrodoTheDodo",
            "url": "https://api.layer.com/identities/FrodoTheDodo",
            "display_name": "Frodo is a Dodo",
            "first_name": "Frodo",
            "last_name": "Dodo"
        },
        "role": "user",
        "joined_at": "2014-09-15T04:44:47+00:00"
    });
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


  describe("The onRerender() method", function() {

    it("Should render the membership displayName", function() {
      el.nodes.title.innerHTML = '';
      el.onRender();
      expect(el.nodes.title.innerHTML).toEqual(el.item.identity.displayName);
    });

    it("Should update the displayName when it changes", function() {
      el.item.identity.displayName = 'Quick change it back!';
      el.item.identity.trigger('identities:change', {property: 'displayName', oldValue: 'Frodo', newValue: client.user.displayName});
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