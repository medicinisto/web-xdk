/* eslint-disable */
describe("List Mixin", function() {

  var el, testRoot, client, query, timeoutId, restoreAnimatedScrollTo;

  function isCloseEnough(scrollTop, desiredScrollTop) {
    return Math.abs(scrollTop - desiredScrollTop) < 1;
  }

  beforeEach(function(done) {
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
      isFullIdentity: true
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
          isFullIdentity: true
        })
      );
    }

    el.query = query;
    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
    jasmine.clock().tick(500);
    Layer.Utils.defer.flush();

    jasmine.clock().uninstall();
    setTimeout(function() {
      jasmine.clock().install();
      done();
    }, 100);
  });

  afterEach(function() {
    try {
      Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
      jasmine.clock().uninstall();
      Layer.UI.settings.appId = null;
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
      if (client) client.destroy();
    } catch(e) {}
  });
  describe("Properties", function() {
    it("Should set the query given a queryId", function() {
      var el = document.createElement('layer-identity-list');
      Layer.Utils.defer.flush();
      el.queryId = query.id;
      expect(el.query).toBe(query);
    });


    it("Should call render on setting the query", function() {
      var el = document.createElement('layer-identity-list');
      spyOn(el, "onRender");
      Layer.Utils.defer.flush();
      el.query = query;
      jasmine.clock().tick(10);
      expect(el.onRender).toHaveBeenCalledWith();
    });

    // Tests call to onRerender as rerender has already been bound to an event before we can test it
    it("Should wire up rerender on setting the query", function() {
      var el = document.createElement('layer-identity-list');
      Layer.Utils.defer.flush();
      spyOn(el, "_processQueryEvt");

      el.query = query;
      expect(el._processQueryEvt).toHaveBeenCalledWith({ type: 'data', data: el.query.data, inRender: true });
      expect(el._processQueryEvt).not.toHaveBeenCalledWith(jasmine.any(Layer.Core.LayerEvent));
      query.trigger("change", {type: "data", data: []});
      expect(el._processQueryEvt).toHaveBeenCalledWith(jasmine.any(Layer.Core.LayerEvent));
    });

    it("Should create a query if there is no query and useGeneratedQuery is unset", function() {
      var el = document.createElement('layer-identity-list');
      el.client = client;
      expect(el.properties.query).toBe(null);

      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      expect(el.query).toEqual(jasmine.any(Layer.Core.Query));
      expect(el.properties.query).toEqual(jasmine.any(Layer.Core.Query));
    });

    it("Should add and remove classes on setting isDataLoading", function() {
      expect(el.isDataLoading).toBe(false);
      expect(el.classList.contains('layer-loading-data')).toBe(false);

      el.isDataLoading = true;
      expect(el.classList.contains('layer-loading-data')).toBe(true);

      el.isDataLoading = false;
      expect(el.classList.contains('layer-loading-data')).toBe(false);
    });

    it("Should set onRenderListItem as a string or function", function() {
      el.onRenderListItem = "function(item) {return item.displayName + 'hey ho';}";
      expect(el.onRenderListItem(client.user)).toEqual(client.user.displayName + 'hey ho');

      el.onRenderListItem = function(item) {return item.displayName + 'ho hum';}
      expect(el.onRenderListItem(client.user)).toEqual(client.user.displayName + 'ho hum');
    });


    it("Should destroy the existing query if hasGeneratedQuery is true", function() {
      el.client = client;
      var query2 = client.createQuery({model: Layer.Core.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = true;
      el.query = query;
      expect(query2.isDestroyed).toBe(true);
      expect(el.properties.hasGeneratedQuery).toBe(false);
    });

    it("Should not destroy the existing query if hasGeneratedQuery is false", function() {
      el.client = client;
      var query2 = client.createQuery({model: Layer.Core.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = false;
      el.query = query;
      expect(query2.isDestroyed).toBe(false);
      expect(el.properties.hasGeneratedQuery).toBe(false);
      query2.destroy();
    });
  });

  describe("The onCreate() method", function() {
    var originalTimeout;
    beforeEach(function() {
      console.log("Start Test");
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function(done) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      console.log("End Test");
      jasmine.clock().uninstall();
      setTimeout(function() {
        jasmine.clock().install();
        done();
      }, 100);
    });

    it("Should wire up the scroll event handler", function(done) {
      el.style.height = "100px";
      el.style.overflow = "auto";
      jasmine.clock().uninstall();
      setTimeout(function() {
        console.log("START RUN");
        el.properties.isSelfScrolling = false;
        spyOn(el, "_throttler").and.callFake(function() {
          console.log("FAKE CALLED");
          expect(true).toBe(true);
          done();
        });
        //debugger;
        el.scrollTop = 500;
      }, 200);
    });

    it("Should initialize listData", function() {
      var el = document.createElement('layer-identity-list');
      expect(el.properties.listData).toEqual([]);
    });

    it("Should set the loadIndicator to an element in the widget", function() {
      expect(el.nodes.loadIndicator.classList.contains('layer-load-indicator')).toBe(true);
    });
  });

  describe("The _onScroll() method", function() {
    it("Should call evt.preventDefault if selfScrolling", function() {
      var evt = {
        preventDefault: jasmine.createSpy('preventDefault')
      };

      el.properties.isSelfScrolling = false;
      el._onScroll(evt);
      expect(evt.preventDefault).not.toHaveBeenCalled();

      el.properties.isSelfScrolling = true;
      el._onScroll(evt);
      expect(evt.preventDefault).toHaveBeenCalledWith();
    });

    it("Should call _throttler with _handleScroll if not selfScrolling", function() {
      spyOn(el, "_throttler");
      spyOn(el, "_handleScroll");
      var evt = {
        preventDefault: jasmine.createSpy('preventDefault')
      };

      el.properties.isSelfScrolling = true;
      el._onScroll(evt);
      expect(el._throttler).not.toHaveBeenCalled();

      el.properties.isSelfScrolling = false;

      el._onScroll(evt);
      expect(el._throttler).toHaveBeenCalled();
      expect(el._handleScroll).not.toHaveBeenCalled();

      // Find out what function was passed
      el._throttler.calls.allArgs()[0][0]();
      expect(el._handleScroll).toHaveBeenCalled();
    });
  });

  describe("The throttle() method", function() {
    it("Should promptly act on the first call to perform an action", function() {
      var spy = jasmine.createSpy("hello");
      el._throttler(spy);
      jasmine.clock().tick(10);
      expect(spy).toHaveBeenCalled();
    });

    it("Should schedule additional calls to perform an action", function() {
      var spy = jasmine.createSpy("hello");
      el._throttler(spy);
      jasmine.clock().tick(10);
      spy.calls.reset();

      el._throttler(spy);
      el._throttler(spy);
      el._throttler(spy);
      expect(spy).not.toHaveBeenCalled();

      jasmine.clock().tick(160);
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.count()).toEqual(1);
      jasmine.clock().tick(5000);
      expect(spy.calls.count()).toEqual(1);
    });
  });
  describe("The _handleScroll() method", function() {
    it("Should page the query if near the bottom of the list", function() {
      el.pageSize = 31;
      var initialWindow = query.paginationWindow;
      el.style.height = "100px";
      el.style.overflow = "auto";
      el.scrollTop = el.scrollHeight - el.clientHeight;
      spyOn(query, "update");
      el._handleScroll();
      expect(query.update).toHaveBeenCalledWith({paginationWindow: initialWindow + 31});
    });

    it("Should set isDataLoading if the query is firing after updating pagination", function() {
      el.style.height = "100px";
      el.style.overflow = "auto";
      expect(el.isDataLoading).toBe(false);
      el.scrollTop = el.scrollHeight - el.clientHeight;
      query.isFiring = true;
      el._handleScroll();
      expect(el.isDataLoading).toBe(true);

    });

    it("Should not page the query if far from the bottom of the list", function() {
      el.pageSize = 31;
      el.style.height = "100px";
      el.style.overflow = "auto";
      el.scrollTop = 20;
      spyOn(query, "update");
      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
    });
  });

  describe("The scrollToItem() method", function() {

    beforeEach(function() {
      el.style.height = '300px';
    });

    it("Should scroll to the specified item and return true", function() {
      var identity = client.getIdentity("layer:///identities/user15");
      var identityWidget = document.getElementById(el._getItemId(identity.id));
      expect(el.scrollToItem(identity)).toEqual(true);
      expect(isCloseEnough(el.scrollTop, identityWidget.offsetTop - el.offsetTop)).toBe(true);

      expect(isCloseEnough(el.scrollTop, 0)).toBe(false)
    });

    it("Should do nothing and return false", function() {
      var identity = new Layer.Core.Identity({
        userId: 'user200',
        id: 'layer:///identities/user200',
        displayName: 'User 200',
        isFullIdentity: true
      });
      expect(el.scrollToItem(identity)).toEqual(false);
      expect(isCloseEnough(el.scrollTop, 0)).toBe(true);
    });

    it("Should return true and animate scrolling", function() {
      var identity = client.getIdentity("layer:///identities/user15");
      var identityWidget = document.getElementById(el._getItemId(identity.id));

      expect(el.scrollToItem(identity, 200)).toEqual(true);
      jasmine.clock().tick(200);

      expect(isCloseEnough(el.scrollTop, identityWidget.offsetTop - el.offsetTop)).toBe(true);
      expect(isCloseEnough(el.scrollTop, 0)).toBe(false);
    });

    it("Should call the animateScrolling callback", function() {
      var identity = client.getIdentity("layer:///identities/user15");
      var spy = jasmine.createSpy('callback');
      el.scrollToItem(identity, 200, spy);
      expect(spy).not.toHaveBeenCalled();
      jasmine.clock().tick(200);
      expect(spy).toHaveBeenCalled();
    });

    // Sadly this does more to test the spy and callFake function than actually test the code
    it("Should skip callback of prior animation and only callback on new animation", function() {
      var identity = client.getIdentity("layer:///identities/user5");
      var identity2 = client.getIdentity("layer:///identities/user15");
      var identityWidget = document.getElementById(el._getItemId(identity2.id));

      var position;
      var count = 0;
      var spy = function() {
        count++;
        position = Math.round(el.scrollTop);
      };
      el.scrollToItem(identity, 200, spy);
      jasmine.clock().tick(50);
      el.scrollToItem(identity2, 200, spy);
      jasmine.clock().tick(200);
      expect(count).toEqual(1);
      expect(isCloseEnough(position, identityWidget.offsetTop - el.offsetTop)).toBe(true);
      expect(isCloseEnough(position, el.scrollTop)).toBe(true);
    });
  });

  describe("The render() method", function() {
    it("Should call rerender if there is query data", function() {
      spyOn(el, 'onRerender');
      el.onRender();
      expect(el.onRerender).toHaveBeenCalledWith({type: 'data', data: query.data, inRender: true});
      el.onRerender.calls.reset();

      query.data = [];
      el.onRender();
      expect(el.onRerender).not.toHaveBeenCalledWith(jasmine.any(Object));
    });
  });

  describe("The _generateFragment() method", function() {
    it("Should generate a fragment if needed", function() {
      expect(el._generateFragment([client.user])).toEqual(jasmine.any(DocumentFragment));
    });

    it("Should use the provided fragment", function() {
      var fragment = document.createDocumentFragment();
      expect(el._generateFragment([client.user], fragment)).toBe(fragment);
      expect(fragment.childNodes.length > 0).toBe(true);
    });

    it("Should call _generateFragmentItem for each data result", function() {
      spyOn(el, "_generateFragmentItem");
      el._generateFragment(query.data);
      expect(el._generateFragmentItem.calls.count()).toEqual(query.data.length);
      expect(el._generateFragmentItem).toHaveBeenCalledWith(query.data[23], jasmine.any(DocumentFragment));
    });
  });

  describe("The _generateFragmentItem() method", function() {
    it("Should create a widget via _generateItem and add it to the fragment", function() {
      spyOn(el, "_generateItem").and.callThrough();
      var fragment = document.createDocumentFragment();
      el._generateFragmentItem(client.user, fragment);
      expect(el._generateItem).toHaveBeenCalledWith(client.user);
      expect(fragment.childNodes[0].tagName).toEqual('LAYER-IDENTITY-ITEM');
      expect(fragment.childNodes[0].item).toBe(client.user);
    });

    it("Should create a widget by ID via _generateItem and add it to the fragment", function() {
      spyOn(el, "_generateItem").and.callThrough();
      var fragment = document.createDocumentFragment();
      el._generateFragmentItem({id: client.user.id}, fragment);
      expect(el._generateItem).toHaveBeenCalledWith(client.user);
      expect(fragment.childNodes[0].tagName).toEqual('LAYER-IDENTITY-ITEM');
      expect(fragment.childNodes[0].item).toBe(client.user);
    });

    it("Should do nothing if item not found", function() {
      spyOn(el, "_generateItem").and.callThrough();
      var fragment = document.createDocumentFragment();
      el._generateFragmentItem({id: client.user.id + 'a'}, fragment);
      expect(el._generateItem).not.toHaveBeenCalled();
      expect(fragment.childNodes.length).toEqual(0);
    });

    it("Should setup the parentComponent of each new item", function() {
      var fragment = document.createDocumentFragment();
      el._generateFragmentItem(client.user, fragment);
      expect(fragment.childNodes[0].parentComponent).toBe(el);
    });
  });

  describe("The _gatherAndProcessAffectedItems() method", function() {

    it("Should find all matching items and call processAffectedWidgets on them", function() {
      spyOn(el, "_processAffectedWidgets");
      el._gatherAndProcessAffectedItems([query.data[5], query.data[10]], false);
      expect(el._processAffectedWidgets).toHaveBeenCalledWith([el.childNodes[5], el.childNodes[10]], false);
    });
  });

  describe("The _processAffectedWidgets() method", function() {

    it("Should call _processAffectedWidgetsCustom with the correct firstIndex", function() {
      spyOn(el, "_processAffectedWidgetsCustom");
      el._processAffectedWidgets([el.childNodes[5], el.childNodes[10]], false);
      expect(el._processAffectedWidgetsCustom).toHaveBeenCalledWith([el.childNodes[5], el.childNodes[10]], 5, false);
    });

    it("Should call onRenderListItem on each item", function() {
      el.onRenderListItem = jasmine.createSpy('renderItem');
      el._processAffectedWidgets([el.childNodes[5], el.childNodes[10]], false);
      expect(el.onRenderListItem.calls.count()).toBe(2);
      expect(el.onRenderListItem).toHaveBeenCalledWith(el.childNodes[5], el.properties.listData, 5, false);
      expect(el.onRenderListItem).toHaveBeenCalledWith(el.childNodes[10], el.properties.listData, 6, false);
    });
  });

  describe("The _processQueryEvt() method", function() {
    beforeEach(function() {
      spyOn(el, "_renderPagedData");
      spyOn(el, "_renderInsertedData");
      spyOn(el, "_renderWithoutRemovedData");
      spyOn(el, "_renderResetData");
      spyOn(el, "_renderMovedData");
    });
    it("Should only call _renderPagedData for data event", function() {
      var evt = {type: 'data'};
      el._processQueryEvt(evt);
      expect(el._renderPagedData).toHaveBeenCalledWith(evt);
      expect(el._renderInsertedData).not.toHaveBeenCalled();
      expect(el._renderWithoutRemovedData).not.toHaveBeenCalled();
      expect(el._renderResetData).not.toHaveBeenCalled();
      expect(el._renderMovedData).not.toHaveBeenCalled();
    });

    it("Should only call _renderInsertedData for insert event", function() {
      var evt = {type: 'insert'};
      el._processQueryEvt(evt);
      expect(el._renderInsertedData).toHaveBeenCalledWith(evt);
      expect(el._renderPagedData).not.toHaveBeenCalled();
      expect(el._renderWithoutRemovedData).not.toHaveBeenCalled();
      expect(el._renderResetData).not.toHaveBeenCalled();
      expect(el._renderMovedData).not.toHaveBeenCalled();
    });

    it("Should only call _renderWithoutRemovedData for remove event", function() {
      var evt = {type: 'remove'};
      el._processQueryEvt(evt);
      expect(el._renderWithoutRemovedData).toHaveBeenCalledWith(evt);
      expect(el._renderPagedData).not.toHaveBeenCalled();
      expect(el._renderInsertedData).not.toHaveBeenCalled();
      expect(el._renderResetData).not.toHaveBeenCalled();
      expect(el._renderMovedData).not.toHaveBeenCalled();
    });

    it("Should only call _renderResetData for reset event", function() {
      var evt = {type: 'reset'};
      el._processQueryEvt(evt);
      expect(el._renderResetData).toHaveBeenCalledWith(evt);
      expect(el._renderPagedData).not.toHaveBeenCalled();
      expect(el._renderInsertedData).not.toHaveBeenCalled();
      expect(el._renderWithoutRemovedData).not.toHaveBeenCalled();
      expect(el._renderMovedData).not.toHaveBeenCalled();
    });

    it("Should only call _renderMovedData for move event", function() {
      var evt = {type: 'move'};
      el._processQueryEvt(evt);
      expect(el._renderResetData).not.toHaveBeenCalledWith();
      expect(el._renderPagedData).not.toHaveBeenCalled();
      expect(el._renderInsertedData).not.toHaveBeenCalled();
      expect(el._renderWithoutRemovedData).not.toHaveBeenCalled();
      expect(el._renderMovedData).toHaveBeenCalledWith(evt);
    });
  });

  describe("The _renderResetData() method", function() {
    it("Should reset listData", function() {
      spyOn(el, "_renderResetData").and.callThrough();
      el.properties.listData = query.data;

      // Run
      query.reset();

      // Posttest
      expect(el._renderResetData).toHaveBeenCalled();
      expect(el.properties.listData.length).toEqual(0);
      expect(query.data).not.toBe(el.properties.listData);
    });

    it("Should reset the scroll position", function() {
      el.style.height = "100px";
      el.style.overflow = "auto";
      el.scrollTop = 100;
      expect(el.scrollTop > 1).toBe(true);
      query.reset();
      expect(el.scrollTop > 1).toBe(false);
    });

    it("Should empty the list of items, but still contain the listMeta node", function() {
      expect(el.childNodes.length > 1).toBe(true);
      query.reset();
      expect(el.childNodes.length).toEqual(1);
      expect(el.firstChild).toBe(el.nodes.listMeta);
    });
  });


  describe("The _renderWithoutRemovedData() method", function() {
    it("Should update listData", function() {
      el.onRender();
      var initialLength = query.data.length;
      expect(initialLength).toEqual(el.properties.listData.length);
      expect(el.properties.listData).toEqual(query.data);
      expect(el.properties.listData).not.toBe(query.data);
      spyOn(el, '_renderWithoutRemovedData').and.callThrough();

      // Run
      query.data[5].destroy();
      jasmine.clock().tick(10);
      expect(el._renderWithoutRemovedData).toHaveBeenCalled();

      // Posttest
      expect(el.properties.listData).toEqual(query.data);
      expect(el.properties.listData).not.toBe(query.data);
      expect(initialLength).toEqual(el.properties.listData.length + 1);
    });

    it("Should call _gatherAndProcessAffectedItems with 3 items before and 3 after the removed item", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");

      // Run
      query.data[5].destroy();
      jasmine.clock().tick(10);

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        query.data[2],
        query.data[3],
        query.data[4],
        query.data[5],
        query.data[6],
        query.data[7]], false);
    });

    it("Should remove the item from the list", function() {
      var displayName = ">" + query.data[5].displayName + "<";
      expect(el.innerHTML.indexOf(displayName)).not.toEqual(-1);

      // Run
      query.data[5].destroy();
      jasmine.clock().tick(10);

      // Posttest
      expect(el.innerHTML.indexOf(displayName)).toEqual(-1);
    });
  });

  describe("The _renderInsertedData() method", function() {
    it("Should update listData", function() {
      query._handleAddEvent('identities', {
        identities: [
          new Layer.Core.Identity({
            userId: 'user' + 10000,
            id: 'layer:///identities/user' + 10000,
            displayName: 'User ' + 10000,
            isFullIdentity: true
          })
        ]
      });

      // Posttest
      expect(el.properties.listData[el.properties.listData.length - 1]).toBe(client.getIdentity('layer:///identities/user' + 10000));
    });

    it("Should insert a list item at the proper index", function() {
      var identity = new Layer.Core.Identity({
        userId: 'user' + 10000,
        id: 'layer:///identities/user' + 10000,
        displayName: 'User ' + 10000,
        isFullIdentity: true
      });
      query.data.splice(25, 0, identity);
      query._triggerChange({
        type: 'insert',
        index: 25,
        target: identity,
        query: query
      });

      // Posttest
      var newElement = el.querySelector('#' + el._getItemId(identity.id));
      expect(newElement.item.userId).toEqual("user10000");
      expect(newElement).toBe(el.childNodes[25]);
    });

    it("Should call _gatherAndProcessAffectedItems on 3 items before and 3 items after the inserted item", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var identity = new Layer.Core.Identity({
        userId: 'user' + 10000,
        id: 'layer:///identities/user' + 10000,
        displayName: 'User ' + 10000,
        isFullIdentity: true
      });

      // Run
      query.data.splice(25, 0, identity);
      query._triggerChange({
        type: 'insert',
        index: 25,
        target: identity,
        query: query
      });

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        query.data[25-3],
        query.data[25-2],
        query.data[25-1],
        query.data[25],
        query.data[25+1],
        query.data[25+2],
        query.data[25+3]
      ], false);
    });

    it("Should call _gatherAndProcessAffectedItems with isTopNewItem as false if index > 0", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var identity = new Layer.Core.Identity({
        userId: 'user' + 10000,
        id: 'layer:///identities/user' + 10000,
        displayName: 'User ' + 10000,
        isFullIdentity: true
      });

      // Run
      query.data.splice(25, 0, identity);
      query._triggerChange({
        type: 'insert',
        index: 25,
        target: identity,
        query: query
      });

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        query.data[25-3],
        query.data[25-2],
        query.data[25-1],
        query.data[25],
        query.data[25+1],
        query.data[25+2],
        query.data[25+3]
      ], false);
    });

    it("Should call _gatherAndProcessAffectedItems with isTopNewItem as true if index === 0", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var identity = new Layer.Core.Identity({
        userId: 'user' + 10000,
        id: 'layer:///identities/user' + 10000,
        displayName: 'User ' + 10000,
        isFullIdentity: true
      });

      // Run
      query.data.splice(0, 0, identity);
      query._triggerChange({
        type: 'insert',
        index: 0,
        target: identity,
        query: query
      });

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        query.data[0],
        query.data[1],
        query.data[2],
        query.data[3]
      ], true);
    });
  });

  describe("The _renderPagedData() method", function() {
    it("Should update listData", function() {
      spyOn(el, "_renderPagedData").and.callThrough();
      var identities = [
        new Layer.Core.Identity({
          userId: 'user' + 10000,
          id: 'layer:///identities/user' + 10000,
          displayName: 'User ' + 10000,
          isFullIdentity: true
        }),
        new Layer.Core.Identity({
          userId: 'user' + 10001,
          id: 'layer:///identities/user' + 10001,
          displayName: 'User ' + 10001,
          isFullIdentity: true
        })
      ];

      // Run
      query.data.push(identities[0]);
      query.data.push(identities[1]);
      query._triggerChange({
        type: 'data',
        index: 0,
        data: identities,
        query: query
      });

      // Posttest
      expect(el._renderPagedData).toHaveBeenCalled();
      expect(el.properties.listData[el.properties.listData.length - 2].displayName).toEqual("User 10000");
      expect(el.properties.listData[el.properties.listData.length - 1].displayName).toEqual("User 10001");
    });

    it("Should append all new items just before the listMeta", function() {
      var identities = [
        new Layer.Core.Identity({
          userId: 'user' + 10000,
          id: 'layer:///identities/user' + 10000,
          displayName: 'User ' + 10000,
          isFullIdentity: true
        }),
        new Layer.Core.Identity({
          userId: 'user' + 10001,
          id: 'layer:///identities/user' + 10001,
          displayName: 'User ' + 10001,
          isFullIdentity: true
        })
      ];

      // Run
      query.data.push(identities[0]);
      query.data.push(identities[1]);
      query._triggerChange({
        type: 'data',
        index: 0,
        data: identities,
        query: query
      });

      // Posttest
      expect(el.childNodes[el.childNodes.length - 1]).toBe(el.nodes.listMeta);
      expect(el.childNodes[el.childNodes.length - 2].item.displayName).toEqual("User 10001");
    });

    it("Should call _gatherAndProcessAffectedItems on all of the newly added items, plus the prior last 3 items", function() {
      var last3Items = query.data.slice(query.data.length-3, query.data.length);
      expect(last3Items.length).toEqual(3);
      var identities = [
        new Layer.Core.Identity({
          userId: 'user' + 10000,
          id: 'layer:///identities/user' + 10000,
          displayName: 'User ' + 10000,
          isFullIdentity: true
        }),
        new Layer.Core.Identity({
          userId: 'user' + 10001,
          id: 'layer:///identities/user' + 10001,
          displayName: 'User ' + 10001,
          isFullIdentity: true
        })
      ];
      spyOn(el, "_gatherAndProcessAffectedItems");

      // Run
      query.data.push(identities[0]);
      query.data.push(identities[1]);
      query._triggerChange({
        type: 'data',
        index: 0,
        data: identities,
        query: query
      });

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith(last3Items.concat(identities), false);

    });

    it("Should update isDataLoading to match the query firing state, triggering all side effects", function() {
      var last3Items = query.data.slice(query.data.length-3, query.data.length);
      expect(last3Items.length).toEqual(3);
      var identities = [
        new Layer.Core.Identity({
          userId: 'user' + 10000,
          id: 'layer:///identities/user' + 10000,
          displayName: 'User ' + 10000,
          isFullIdentity: true
        }),
        new Layer.Core.Identity({
          userId: 'user' + 10001,
          id: 'layer:///identities/user' + 10001,
          displayName: 'User ' + 10001,
          isFullIdentity: true
        })
      ];
      spyOn(el, "_gatherAndProcessAffectedItems");

      // Run 1
      query.data.push(identities[0]);
      query.data.push(identities[1]);
      query.isFiring = true;
      query._triggerChange({
        type: 'data',
        index: 0,
        data: identities,
        query: query
      });

      // Posttest
      expect(el.isDataLoading).toBe(true);

      // Run 2
      query.isFiring = false;
      query._triggerChange({
        type: 'data',
        index: 0,
        data: identities,
        query: query
      });

      // Posttest 2
      expect(el.isDataLoading).toBe(false);
    });
  });

  describe("The _renderMovedData() method", function() {
    it("Should move the element to the start of the list", function() {
      expect(el.childNodes[3].item).toBe(query.data[3]);

      el._renderMovedData({
        target: query.data[3],
        fromIndex: 3,
        toIndex: 0
      });
      expect(el.childNodes[0].item).toBe(query.data[3]);
      expect(el.childNodes[3].item).toBe(query.data[2]);
      expect(el.childNodes[4].item).toBe(query.data[4]);
    });

    it("Should move the element to the end of the list", function() {
      el._renderMovedData({
        target: query.data[3],
        fromIndex: 3,
        toIndex: query.data.length - 1
      });
      expect(el.childNodes[query.data.length - 1].item).toBe(query.data[3]);
      expect(el.childNodes[3].item).toBe(query.data[4]);
      expect(el.childNodes[4].item).toBe(query.data[5]);
    });

    it("Should move the element to the middle of the list", function() {
      el._renderMovedData({
        target: query.data[3],
        fromIndex: 3,
        toIndex: 25
      });
      expect(el.childNodes[25].item).toBe(query.data[3]);
      expect(el.childNodes[3].item).toBe(query.data[4]);
      expect(el.childNodes[4].item).toBe(query.data[5]);
    });
  })
});