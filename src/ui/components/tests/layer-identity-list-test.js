/* eslint-disable */
describe('layer-identity-list', function() {
  var el, testRoot, client, query;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      item: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-identity-list');
    testRoot.appendChild(el);
    query = client.createQuery({
      model: Layer.Core.Query.Identity
    });
    query.isFiring = false;
    query.data = [client.user];
    for (i = 0; i < 35; i++) {
      query.data.push(
        new Layer.Core.Identity({
              userId: 'user' + i,
          id: 'layer:///identities/user' + i,
          displayName: 'User ' + i,
          item: true
        })
      );
    }

    el.query = query;
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    try {
      if (client) {
        client.destroy();
        client = null;
      }
      if (el) {
        el.destroy();
        el = null;
      }
      jasmine.clock().uninstall();
      Layer.UI.settings.appId = null;
      document.body.removeChild(testRoot);
    } catch(e) {}
  });


  describe('Event Handling', function() {
    it("Should call onIdentitySelected when child triggers layer-identity-item-selected", function() {
      var spy = jasmine.createSpy('callback');
      el.onIdentitySelected = spy;
      el.firstChild.trigger('layer-identity-item-selected', {item: query.data[1]});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onIdentityDeselected when child triggers layer-identity-item-deselected", function() {
      var spy = jasmine.createSpy('callback');
      el.selectedIdentities = [query.data[1]];
      el.onIdentityDeselected = spy;
      el.firstChild.trigger('layer-identity-item-deselected', {item: query.data[1]});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });
  });

  describe("The selectedIdentities property", function() {
    it("Should mark all specified identities as selected", function() {
      el.childNodes[10].isSelected = true;
      el.childNodes[11].isSelected = true;
      el.selectedIdentities = [query.data[1], query.data[2]];

      expect(el.childNodes[10].isSelected).toBe(false);
      expect(el.childNodes[11].isSelected).toBe(false);
      expect(el.childNodes[1].isSelected).toBe(true);
      expect(el.childNodes[2].isSelected).toBe(true);
    });

    it("Should clear all selected identities", function() {
      el.childNodes[10].isSelected = true;
      el.childNodes[11].isSelected = true;
      el.selectedIdentities = null;

      expect(el.childNodes[10].isSelected).toBe(false);
      expect(el.childNodes[11].isSelected).toBe(false);
    });
  });

  describe("The filter property", function() {
    it("Should call _runFilter when set", function() {
      spyOn(el, "_runFilter");
      el.filter = "User";
      expect(el._runFilter).toHaveBeenCalledWith();
    });
  });

  describe("The created() method", function() {
    it("Should call _updateQuery if there is a queryId passed into the innerHTML", function() {
      testRoot.innerHTML = '<layer-identity-list query-id="' + query.id + '" app-id="' + client.appId + '"></layer-identity-list>';
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      var el = testRoot.firstChild;
      expect(el.query).toBe(query);
      spyOn(el, "_processQueryEvt"); // _updateQuery sets up the query listener to call _processQueryEvt
      query.trigger('change');
      expect(el._processQueryEvt).toHaveBeenCalled();
    });

    it("Should call render", function() {
      testRoot.innerHTML = '<layer-identity-list></layer-identity-list>';
      CustomElements.takeRecords();
      var el = testRoot.firstChild;
      expect(el.nodes.loadIndicator).toEqual(jasmine.any(HTMLElement));
    });

    it("Should wire up _handleIdentitySelect and _handleIdentityDeselect", function() {
      var selectSpy = jasmine.createSpy('select');
      var deselectSpy = jasmine.createSpy('deselect');
      el.addEventListener('layer-identity-selected', selectSpy);
      el.addEventListener('layer-identity-deselected', deselectSpy);

      el.firstChild.trigger('layer-identity-item-selected', {item: query.data[1]});
      expect(selectSpy).toHaveBeenCalled();
      expect(deselectSpy).not.toHaveBeenCalled();
      selectSpy.calls.reset();

      el.selectedIdentities.push(query.data[1]);
      el.firstChild.trigger('layer-identity-item-deselected', {item: query.data[1]});
      expect(selectSpy).not.toHaveBeenCalled();
      expect(deselectSpy).toHaveBeenCalled();
    });
  });

  describe("The _handleIdentitySelect() method", function() {
    it("Should add item to selectedIdentities", function() {
      expect(el.selectedIdentities).toEqual([]);
      el.firstChild.trigger('layer-identity-item-selected', {item: query.data[1]});
      expect(el.selectedIdentities).toEqual([query.data[1]]);
    });

    it("Should call evt.preventDefault if evt.preventDefault and leave selectedIdentities unchanged", function() {
      el.addEventListener('layer-identity-selected', function(evt) {
        expect(evt.preventDefault.calls).toBe(undefined); // Not the spy
        evt.preventDefault();
      });
      var preventDefaultSpy = jasmine.createSpy('preventDefault');
      el._handleIdentitySelect({
        detail: {
          item: query.data[1]
        },
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: preventDefaultSpy
      });
      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(el.selectedIdentities).toEqual([]);
    });

    it("Should do nothing if already in the list", function() {
      el.selectedIdentities = [query.data[1]];
      var spy = jasmine.createSpy('select');
      el.addEventListener('layer-identity-selected', spy);
      el._handleIdentitySelect({
        detail: {
          item: query.data[1]
        },
        stopPropagation: jasmine.createSpy('stopPropagation')
      });
      expect(spy).not.toHaveBeenCalled();
      expect(el.selectedIdentities).toEqual([query.data[1]]);
    });
  });

  describe("The _handleIdentityDeselect() method", function() {
    it("Should remove item from selectedIdentities", function() {
      el.selectedIdentities = [query.data[1]];
      el.firstChild.trigger('layer-identity-item-deselected', {item: query.data[1]});
      expect(el.selectedIdentities).toEqual([]);
    });

    it("Should call evt.preventDefault if evt.preventDefault and leave selectedIdentities unchanged", function() {
      el.selectedIdentities = [query.data[1]];
      el.addEventListener('layer-identity-deselected', function(evt) {
        expect(evt.preventDefault.calls).toBe(undefined); // Not the spy
        evt.preventDefault();
      });
      var preventDefaultSpy = jasmine.createSpy('preventDefault');
      el._handleIdentityDeselect({
        detail: {
          item: query.data[1]
        },
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: preventDefaultSpy
      });
      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(el.selectedIdentities).toEqual([query.data[1]]);
    });

    it("Should do nothing if not in the list", function() {
      el.selectedIdentities = [query.data[1]];
      var spy = jasmine.createSpy('deselect');
      el.addEventListener('layer-identity-deselected', spy);
      el._handleIdentityDeselect({
        detail: {
          item: query.data[2]
        },
        stopPropagation: jasmine.createSpy('stopPropagation')
      });
      expect(spy).not.toHaveBeenCalled();
      expect(el.selectedIdentities).toEqual([query.data[1]]);
    });
  });

  describe("The _generateItem() method", function() {
    it("Should return a layer-identity-item with an identity setup", function() {
      var result = el._generateItem(query.data[1]);
      expect(result.tagName).toEqual('LAYER-IDENTITY-ITEM');
      expect(result.item).toBe(query.data[1]);
    });

    it("Should set selected state", function() {
      el.selectedIdentities = [query.data[1]];
      var result = el._generateItem(query.data[1]);
      expect(result.isSelected).toBe(true);

      el.selectedIdentities = [query.data[2]];
      var result = el._generateItem(query.data[1]);
      expect(result.isSelected).toBe(false);
    });

    it("Should set size", function() {
      el.size = "small";
      var result = el._generateItem(query.data[1]);
      result.parentComponent = el;
      Layer.Utils.defer.flush();
      expect(result.size).toEqual("small");
    });

    it("Should run the filter", function() {
      el.filter = 'Not this again';
      var result = el._generateItem(query.data[1]);
      expect(result.classList.contains('layer-item-filtered')).toBe(true);
    });
  });

  describe("The _processQueryEvt() method", function() {
    it("Should call _processQueryEvt", function() {
      spyOn(el, "_processQueryEvt");
      var evt = {};
      el.onRerender(evt);
      expect(el._processQueryEvt).toHaveBeenCalledWith(evt);
    });

    it("Should remove any removed identities from selectedIdentities", function() {
      el.selectedIdentities = [query.data[2], query.data[1], query.data[0]];
      el.onRerender({
        type: 'remove',
        target: query.data[1]
      });
      expect(el.selectedIdentities).toEqual([query.data[2], query.data[0]]);
    });

    it("Should reset selectedIdentities when data is reset", function() {
      el.selectedIdentities = [query.data[2], query.data[1], query.data[0]];
      el.onRerender({
        type: 'reset'
      });
      expect(el.selectedIdentities).toEqual([]);
    });
  });

  describe("The _renderSelection() method", function() {
    it("Should select and deselect appropriately", function() {
      el.firstChild.selected = true;
      el.childNodes[1].isSelected = true;
      el.selectedIdentities.pop();
      el.selectedIdentities.pop();
      el.selectedIdentities.push(query.data[5]);
      el.selectedIdentities.push(query.data[6]);

      el._renderSelection();
      expect(el.childNodes[0].innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      expect(el.childNodes[1].innerNode.classList.contains('layer-identity-item-selected')).toBe(false);
      expect(el.childNodes[5].innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
      expect(el.childNodes[6].innerNode.classList.contains('layer-identity-item-selected')).toBe(true);
    });
  });

  describe("The _runFilter() method", function() {
    it("Should flag all nodes as unfiltered if there is no filter", function() {
      el.childNodes[1].classList.add('layer-item-filtered');
      el.childNodes[2].classList.add('layer-item-filtered');
      el._runFilter('');
      expect(el.querySelectorAllArray('.layer-item-filtered')).toEqual([]);
    });

    it("Should call _runFilter on all children", function() {
      el.childNodes[1].classList.add('layer-item-filtered');
      el.childNodes[2].classList.add('layer-item-filtered');
      el.filter = 'User';
      expect(el.querySelectorAllArray('.layer-item-filtered')).toEqual([el.firstChild]);
    });
  });

  describe("State management for list items", function() {
    it("Should initialize list items with current state", function() {
      el.state = {hey: "ho"};
      el.query.reset();
      expect(el.querySelectorAllArray('layer-identity-item').length).toEqual(0);
      for (i = 0; i < 10; i++) {
        query.data.push(
          new Layer.Core.Identity({
                  userId: 'user' + i,
            id: 'layer:///identities/user' + i,
            displayName: 'User ' + i,
            item: true
          })
        );
      }
      el.onRerender({type: 'data', data: query.data});
      Layer.Utils.defer.flush();
      expect(el.childNodes[5].state).toEqual({hey: "ho"});
    });

    it("Should update existing list items with new state", function() {
      el.state = {hey: "ho"};
      expect(el.childNodes[5].state).toEqual({hey: "ho"});
    });
  });
});