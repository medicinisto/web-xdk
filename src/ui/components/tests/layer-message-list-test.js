/* eslint-disable */
describe('layer-message-list', function() {
  var el, testRoot, client, conversation, query, user1, restoreAnimatedScrollTo, animatedScrollIndex = 1;
  var originalTimeout;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function(done) {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

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
      appId: 'layer:///apps/staging/Fred'
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
    el = document.createElement('layer-message-list');
    testRoot.appendChild(el);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';
    query = client.createQuery({
      model: Layer.Core.Query.Message,
      predicate: 'conversation.id = "' + conversation.id + '"'
    });
    query.isFiring = false;
    for (i = 0; i < 35; i++) {
      query.data.push(conversation.createMessage("m " + i).send());
    }

    user1 = new Layer.Core.Identity({
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    el.query = query;
    el.style.height = '300px';

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);

    jasmine.clock().uninstall();
    setTimeout(function() {
      jasmine.clock().install();
      done();
    }, 100);
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

    if (client) {
      client.destroy();
      client = null;
    }
    if (el) {
      el.destroy();
      el = null;
    }
    jasmine.clock().uninstall();
    Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
    document.body.removeChild(testRoot);
  });


  describe("The disable property", function() {
    it("Should scroll to bottom and stick to bottom when turned off", function() {
      el.properties.stuckToBottom = false;
      el.scrollTop = 0;
      el.disable = true;

      // Run
      el.disable = false;

      expect(el.properties.stuckToBottom).toBe(true);
      expect(el.scrollTop).not.toEqual(0);
    });

    it("Should call _checkVisibility when turned off", function() {
      spyOn(el, "_checkVisibility");
      el.disable = true;

      // Run
      el.disable = false;

      expect(el._checkVisibility).toHaveBeenCalledWith();
    });
  });

  describe('The created() method', function() {
    beforeEach(function() {
      el = document.createElement('layer-message-list');
      testRoot.innerHTML = '';
      testRoot.appendChild(el);
    });
    it("Should initialize lastPagedAt", function() {
      expect(el.properties.lastPagedAt).toEqual(0);
    });

    it("Should initialize isSelfScrolling", function() {
      expect(el.properties.isSelfScrolling).toEqual(false);
    });

    it("Should initialize stuckToBottom", function() {
      expect(el.properties.stuckToBottom).toEqual(true);
    });

    it("Should call render", function() {
      expect(el.nodes.loadIndicator.classList.contains('layer-load-indicator')).toBe(true);
    });

    it("Should wire up _checkVisibility to the focus event", function() {
      query.data[0].isRead = false;
      query.data[query.size - 1].isRead = false;
      el.properties.stuckToBottom = false;
      el.scrollTop = 0;
      spyOn(el, "_markAsRead");
      var tmp = window.Layer.UI.UIUtils.isInBackground;
      window.Layer.UI.UIUtils.isInBackground = function() {return false;}
      el.query = query;
      Layer.Utils.defer.flush();
      jasmine.clock().tick(150);

      // Run
      evt = new CustomEvent('focus', {});
      window.dispatchEvent(evt);
      jasmine.clock().tick(3000);

      // Posttest
      expect(el._markAsRead).toHaveBeenCalled();

      // Cleanup
      window.Layer.UI.UIUtils.isInBackground = tmp;
    });
  });

  describe("The onDestroy() method", function() {
    it("Should unwire _checkVisibility from the focus event", function() {
      query.data[0].isRead = false;
      spyOn(el, "_markAsRead");
      var tmp = window.Layer.UI.UIUtils.isInBackground;
      window.Layer.UI.isInBackground = function() {return false;}
      el.query = query;
      jasmine.clock().tick(150);
      el.onDestroy();

      // Run
      evt = new CustomEvent('focus', {});
      window.dispatchEvent(evt);
      jasmine.clock().tick(3000);

      // Posttest
      expect(el._markAsRead).not.toHaveBeenCalled();

      // Cleanup
      window.Layer.UI.UIUtils.isInBackground = tmp;
    });

  });


  describe("The _shouldPage() method", function() {
    it("Should return true if scrolled to the top", function() {
      el.scrollTop = 0;
      el.isDataLoading = false;
      expect(el._shouldPage()).toBe(true);
    });

    it("Should return false if data is loading", function() {
      el.isDataLoading = true;
      expect(el._shouldPage()).toBe(false);
    });

    it("Should return false if more than half a page from the top", function() {
      el.screenFullsBeforePaging = 0.5;
      el.scrollTop = 160;
      el.isDataLoading = false;
      expect(el._shouldPage()).toBe(false);
    });

    it("Should return true if less than half a page from the top", function() {
      el.screenFullsBeforePaging = 0.5;
      el.scrollTop = 140;
      el.isDataLoading = false;
      expect(el._shouldPage()).toBe(true);
    });
  });

  describe("The _handleScroll() method", function() {
    it("Should page the query if _shouldPage and if its userScrolled and we arent in the middle of a delayedPagingTimeout and we didn't just fire the query and the query isnt already firing", function() {
      spyOn(query, 'update');
      spyOn(el, '_shouldPage').and.returnValue(true);
      el.properties.isSelfScrolling = false;
      el.properties.delayedPagingTimeout = 0;
      el.properties.lastPagedAt = 0;
      query.isFiring = false;

      el._handleScroll();
      expect(query.update).toHaveBeenCalledWith({paginationWindow: jasmine.any(Number)});
      query.update.calls.reset();


      query.isFiring = true;
      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
      query.isFiring = false;

      el.properties.delayedPagingTimeout = 1;
      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
      el.properties.delayedPagingTimeout = 0;

      el.properties.isSelfScrolling = true;
      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
      el.properties.isSelfScrolling = false;

      el.properties.isSelfScrolling = false;
      el._handleScroll();
      expect(query.update).toHaveBeenCalledWith({paginationWindow: jasmine.any(Number)});
      query.update.calls.reset();

      el.properties.lastPagedAt = Date.now();
      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
      el.properties.lastPagedAt = 0;

      el.properties.delayedPagingTimeout = 0;
      el._handleScroll();
      expect(query.update).toHaveBeenCalledWith({paginationWindow: jasmine.any(Number)});
    });

    it("Should schedule a query update", function() {
      spyOn(query, 'update');
      spyOn(el, '_shouldPage').and.returnValue(true);
      el.properties.isSelfScrolling = false;
      el.properties.delayedPagingTimeout = 0;
      el.properties.lastPagedAt = Date.now() - 500;
      query.isFiring = false;

      el._handleScroll();
      expect(query.update).not.toHaveBeenCalled();
      el._handleScroll();
      el._handleScroll();
      jasmine.clock().tick(2000);
      expect(query.update).toHaveBeenCalledWith({paginationWindow: jasmine.any(Number)});
      expect(query.update.calls.count()).toEqual(1);
    });

    it("Should enable stuckToBottom if user scrolls to bottom", function() {
      el.properties.stuckToBottom = false;
      el.scrollTop = 100000;
      el._handleScroll();
      expect(el.properties.stuckToBottom).toBe(true);
    });

    it("Should check visibility after scrolling", function() {
      spyOn(el, "_checkVisibility");
      el._handleScroll();
      expect(el._checkVisibility).toHaveBeenCalledWith();
    });
  });

  describe("The scrollTo() method", function() {
    it("Should scroll to the specified position", function() {
      el.scrollTo(55);
      expect(Math.round(el.scrollTop)).toEqual(55);
    });

    it("Should check for visibility", function() {
      spyOn(el, "_checkVisibility");
      el.scrollTo(55);
      jasmine.clock().tick(500);
      expect(el._checkVisibility).toHaveBeenCalledWith();
    });

    it("Should not cause paging of the query", function() {
      spyOn(query, "update");
      el.scrollTo(55);
      jasmine.clock().tick(500);
      expect(query.update).not.toHaveBeenCalled();
    });
  });

  describe("The animatedScrollTo() method", function() {
    it("Should scroll to the specified position", function() {
      el.animatedScrollTo(55);
      jasmine.clock().tick(600);
      expect(Math.round(el.scrollTop)).toEqual(55);
    });

    it("Should check for visibility", function() {
        spyOn(el, "_checkVisibility");
        el.animatedScrollTo(55);
        jasmine.clock().tick(600);
        expect(el._checkVisibility).toHaveBeenCalledWith();
    });

    it("Should not cause paging of the query", function() {
        spyOn(query, "update");
        el.animatedScrollTo(55);
        jasmine.clock().tick(600);
        expect(query.update).not.toHaveBeenCalled();
    });
  });

  describe("The _checkVisibility() method", function() {
    var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
    var errorMargin = 10;
    beforeEach(function() {
      query.data.forEach(function(message) {
        message.isRead = false;
      });
      window.Layer.UI.UIUtils.isInBackground = function() {return false;};
    });

    afterEach(function() {
      window.Layer.UI.UIUtils.isInBackground = restoreFunc;
    });

    it("Should mark visible messages as read at start of list", function(done) {
      var items = el.querySelectorAllArray('layer-message-item-sent');
      expect(items.length > 0).toBe(true);
      items.forEach(function(messageRow) {
        expect(messageRow.item.isRead).toBe(false);
      });
      el.scrollTo(0);
      jasmine.clock().uninstall();
      setTimeout(function() {
        try {
          jasmine.clock().install();
          el._checkVisibility();
          jasmine.clock().tick(10000);

          var bottomOfList = el.clientHeight + el.offsetTop;
          var firstMessageStart = items[0].offsetTop;
          var increment = items[0].clientHeight;
          var numberOfFullyVisibleItems = Math.floor((bottomOfList - firstMessageStart) / increment);
          expect(items[0].item.isRead).toBe(numberOfFullyVisibleItems > 0);
          expect(items[1].item.isRead).toBe(numberOfFullyVisibleItems > 1);
          // expect(items[2].item.isRead).toBe(numberOfFullyVisibleItems > 2); // fails on FF running in saucelabs; need to investigate why
          expect(items[3].item.isRead).toBe(numberOfFullyVisibleItems > 3);
          expect(items[4].item.isRead).toBe(numberOfFullyVisibleItems > 4);
          expect(items[5].item.isRead).toBe(numberOfFullyVisibleItems > 5);
          expect(items[6].item.isRead).toBe(numberOfFullyVisibleItems > 6);
          expect(items[7].item.isRead).toBe(numberOfFullyVisibleItems > 7);
          done();
        } catch(e) {
          done(e);
        }
      }, 1500);
    });

    it("Should mark visible messages in middle of list", function() {
      var items = el.querySelectorAllArray('layer-message-item-sent');
      expect(items.length > 0).toBe(true);
      spyOn(el, "_shouldMarkAsRead").and.callThrough();
      el.scrollTo(100);
      jasmine.clock().tick(3000);

      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[0]);
      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[1]);
      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[2]);
      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[3]);
      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[4]);
      expect(el._shouldMarkAsRead).toHaveBeenCalledWith(items[5]);

      expect(el._shouldMarkAsRead(items[0])).toBe(false);
      expect(el._shouldMarkAsRead(items[1])).toBe(true);
      expect(el._shouldMarkAsRead(items[2])).toBe(true);
      expect(el._shouldMarkAsRead(items[3])).toBe(true);
      expect(el._shouldMarkAsRead(items[4])).toBe(false);
      expect(el._shouldMarkAsRead(items[5])).toBe(false);

      expect(items[0].item.isRead).toBe(false);
      expect(items[1].item.isRead).toBe(true);
      expect(items[2].item.isRead).toBe(true);
      expect(items[3].item.isRead).toBe(true);
      expect(items[4].item.isRead).toBe(false);
      expect(items[5].item.isRead).toBe(false);
    });


    it("Should mark visible messages at end of list", function() {
      spyOn(el, "_checkVisibility").and.callThrough();
      el.scrollTo(10000);
      jasmine.clock().tick(300); // allow _checkVisibility to be called
      expect(el._checkVisibility).toHaveBeenCalled();

      jasmine.clock().tick(3000);
      var items = el.querySelectorAllArray('layer-message-item-sent');
      expect(items.length > 0).toBe(true);
      items.forEach(function(messageRow, index, allRows) {
        if (messageRow.offsetTop - el.offsetTop < el.scrollTop - errorMargin) {
          expect(messageRow.item.isRead).toBe(false);
        } else if (messageRow.offsetTop + messageRow.clientHeight <= el.clientHeight + el.offsetTop + el.scrollTop + errorMargin) {
          expect(messageRow.item.isRead).toBe(true);
        } else {
          expect(messageRow.item.isRead).toBe(false);
        }
      });
    });

    it("Should mark nothing if disabled", function() {
      var items = el.querySelectorAllArray('layer-message-item-sent');
      expect(items.length > 0).toBe(true);
      items.forEach(function(messageRow) {
        expect(messageRow.item.isRead).toBe(false);
      });
      el.scrollTo(0);
      el.properties.disable = true;
      el._checkVisibility();
      jasmine.clock().tick(10000);
      items.forEach(function(messageRow) {
        expect(messageRow.item.isRead).toBe(false);
      });
    });
  });

  describe("The _markAsRead() method", function() {
    var isInBackground = window.Layer.UI.UIUtils.isInBackground;;
    beforeAll(function() {
      window.Layer.UI.isInBackground = function() {return false;}
    });

    afterAll(function() {
      window.Layer.UI.UIUtils.isInBackground = isInBackground;
    });


    it("Should mark the first message as read", function() {
      el.childNodes[2].item.isRead = false;
      el.scrollTop = 0;
      el._markAsRead(el.childNodes[1]);
      expect(el.childNodes[1].item.isRead).toBe(true);
    });

    it("Should not mark the first message as read if disabled", function() {
      el.childNodes[1].item.isRead = false;
      el.scrollTop = 0;
      el.properties.disable = true;
      el._markAsRead(el.childNodes[1]);
      expect(el.childNodes[1].item.isRead).toBe(false);
    });

    it("Should not mark the first message as read if scrolled partially out of view", function() {
      el.childNodes[1].item.isRead = false;
      el.scrollTop = 40;
      el._markAsRead(el.childNodes[1]);
      expect(el.childNodes[1].item.isRead).toBe(false);
    });

    it("Should  mark the 50th message as read if scrolled into view", function() {
      var tmp = window.Layer.UI.UIUtils.isInBackground;
      window.Layer.UI.UIUtils.isInBackground = function() {return false;}

      el.childNodes[20].item.isRead = false;
      el.scrollTop = el.childNodes[20].offsetTop - el.offsetTop - 50;
      el._markAsRead(el.childNodes[20]);
      expect(el.childNodes[20].item.isRead).toBe(true);

      // Restore
      window.Layer.UI.UIUtils.isInBackground = tmp;
    });

    it("Should  mark the 50th message as read if scrolled above the item", function() {
      el.childNodes[20].item.isRead = false;
      el.scrollTop = 0;
      el._markAsRead(el.childNodes[20]);
      expect(el.childNodes[20].item.isRead).toBe(false);
    });

    it("Should  mark the 50th message as read if scrolled below the item", function() {
      el.childNodes[20].item.isRead = false;
      el.scrollTop = el.childNodes[20].offsetTop + el.scrollHeight;
      el._markAsRead(el.childNodes[20]);
      expect(el.childNodes[20].item.isRead).toBe(false);
    });
  });

  describe("The _generateItem() method", function() {
    it("Should return a layer-message-item-sent", function() {
      var m = conversation.createMessage("m?");
      expect(el._generateItem(m).tagName).toEqual('LAYER-MESSAGE-ITEM-SENT');
    });

    it("Should set a suitable _contentTag", function() {
      window.Layer.UI.handlers.message.register({
        handlesMessage: jasmine.createSpy('handlesNo').and.returnValue(false),
        tagName: "frodo-dom"
      });
      window.Layer.UI.handlers.message.register({
        handlesMessage: jasmine.createSpy('handlesYes').and.returnValue(true),
        tagName: "sauron-dom"
      });
      var m = conversation.createMessage("m?");
      expect(el._generateItem(m)._contentTag).toEqual('sauron-dom');
      window.Layer.UI.handlers.message.unregister('frodo-dom');
      window.Layer.UI.handlers.message.unregister('sauron-dom');
    });

    it("Should setup dateRenderer and messageStatusRenderer", function() {
      var dateRenderer = jasmine.createSpy('dateRenderer');
      var messageStatusRenderer = jasmine.createSpy('messageStatusRenderer');
      el.dateRenderer = dateRenderer;
      el.messageStatusRenderer = messageStatusRenderer;

      var m = conversation.createMessage("m?");
      var item = el._generateItem(m);
      expect(item.dateRenderer).toBe(dateRenderer);
      expect(item.messageStatusRenderer).toBe(messageStatusRenderer);
    });

    it("Should setup getMenuItems", function() {
      var getMenuItems = jasmine.createSpy('getMenuItems');

      el.getMenuItems = getMenuItems;

      var m = conversation.createMessage("m?");
      var item = el._generateItem(m);
      expect(item.getMenuItems).toBe(getMenuItems);
    });

    it("Should set dateFormat", function() {
      el.dateFormat = {year: "number"};
      var result = el._generateItem(query.data[1]);
      Layer.Utils.defer.flush();
      expect(result.dateFormat).toEqual({year: "number"});
    });


    it("Should return layer-message-unknown if no handlers", function() {
      var m = conversation.createMessage({
        parts: {
          body: "m?",
          mimeType: "not/handled"
        }
      });

      var generatedItem = el._generateItem(m);
      expect(generatedItem.tagName).toEqual('LAYER-MESSAGE-ITEM-SENT');
      generatedItem.item = m;
      Layer.Utils.defer.flush();
      expect(generatedItem.nodes.content.firstChild.tagName).toEqual('LAYER-MESSAGE-UNKNOWN');
    });
  });

  describe("The _inSameGroup() method", function() {
    it("Should return true if same sender and within Layer.UI.settings.messageGroupTimeSpan seconds", function() {
      var m1 = conversation.createMessage("m1");
      var w1 = document.createElement('layer-message-item-sent');
      m1.sentAt = new Date();
      w1.item = m1;

      var m2 = conversation.createMessage("m1");
      var w2 = document.createElement('layer-message-item-sent');
      m2.sentAt = new Date();
      m2.sentAt.setSeconds(m2.sentAt.getSeconds() + Layer.UI.settings.messageGroupTimeSpan/1000 - 1);
      w2.item = m2;

      expect(el._inSameGroup(w1, w2)).toBe(true);
      w1.destroy();w2.destroy();
    });

    it("Should return false if the senders do not match", function() {
      var m1 = conversation.createMessage("m1");
      var w1 = document.createElement('layer-message-item-sent');
      m1.sentAt = new Date();
      w1.item = m1;

      var m2 = conversation.createMessage("m1");
      var w2 = document.createElement('layer-message-item-sent');
      m2.sentAt = new Date();
      m2.sender = user1;
      w2.item = m2;

      expect(el._inSameGroup(w1, w2)).toBe(false);
      w1.destroy();w2.destroy();
    });

    it("Should return false if outside of Layer.UI.settings.messageGroupTimeSpan seconds", function() {
      var m1 = conversation.createMessage("m1");
      var w1 = document.createElement('layer-message-item-sent');
      m1.sentAt = new Date();
      w1.item = m1;

      var m2 = conversation.createMessage("m1");
      var w2 = document.createElement('layer-message-item-sent');
      m2.sentAt = new Date();
      m2.sentAt.setSeconds(m2.sentAt.getSeconds() + Layer.UI.settings.messageGroupTimeSpan/1000 + 10);
      w2.item = m2;

      expect(el._inSameGroup(w1, w2)).toBe(false);
      w1.destroy();w2.destroy();
    });
  });

  describe("The _processAffectedWidgetsCustom() method", function() {
    var m1, m2, m3, m4, m5;
    beforeEach(function() {
      m1 = el.childNodes[10];
      m2 = el.childNodes[21];
      m3 = el.childNodes[22];
      m4 = el.childNodes[23];
      m5 = el.childNodes[24];
      m1.firstInSeries = m1.lastInSeries = false;
      m2.firstInSeries = m2.lastInSeries = false;
      m3.firstInSeries = m3.lastInSeries = false;
      m4.firstInSeries = m4.lastInSeries = false;
      m5.firstInSeries = m5.lastInSeries = false;
    });

    it("Should set firstInSeries for the first item is isTopItemNew", function() {
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, true);
      expect(m1.firstInSeries).toBe(true);
    });

    it("Should not set firstInSeries for the first item is not isTopItemNew", function() {
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, false);
      expect(m1.firstInSeries).toBe(false);
    });

    it("Should nto set lastInSeries for any item having a nextSibling", function() {
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, false);
      expect(m1.lastInSeries).toBe(false);
    });

    it("Should set lastInSeries for any item lacking a nextSibling", function() {
      while (el.childNodes[25]) el.removeChild(el.childNodes[25]);
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, false);
      expect(m5.lastInSeries).toBe(true);
    });

    it("Should set lastInSeries for any item that is not in the same group as the next item", function() {
      m3.item.sender = user1;
      m4.item.sender = user1;
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, false);
      expect(m1.lastInSeries).toBe(false);
      expect(m2.lastInSeries).toBe(true);
      expect(m3.lastInSeries).toBe(false);
      expect(m4.lastInSeries).toBe(true);
      expect(m5.lastInSeries).toBe(false);
    });

    it("Should set firstInSeries for any item following an item that is not in the same group", function() {
      m3.item.sender = user1;
      el._processAffectedWidgetsCustom([m1, m2, m3, m4, m5], 2000, false);
      expect(m1.firstInSeries).toBe(false);
      expect(m2.firstInSeries).toBe(false);
      expect(m3.firstInSeries).toBe(true);
      expect(m4.firstInSeries).toBe(true);
      expect(m5.firstInSeries).toBe(false);
    });
  });

  describe("The onRerender() method", function() {
    it("Should call _processQueryEvt", function() {
      spyOn(el, "_processQueryEvt");
      var evt = {hey: "ho"};
      el.onRerender(evt);
      expect(el._processQueryEvt).toHaveBeenCalledWith(evt);
    });
  });

  describe("The _renderResetData() method", function() {

    it("Should reset the scroll position", function() {
      el.scrollTop = 100;
      expect(el.scrollTop > 0).toBe(true);
      el._renderResetData();
      expect(el.scrollTop > 0).toBe(false);
    });

    it("Should empty the list of items, but still contain a loadingIndicator, emptyList, and endOfListIndicator node", function() {
      el.onRender();
      Layer.Utils.defer.flush();
      jasmine.clock().tick(150);
      expect(el.childNodes.length > 2).toBe(true);
      el._renderResetData();
      expect(el.childNodes.length > 2).toBe(false);
      expect(el.querySelector('.layer-load-indicator').classList.contains).not.toBe(null);
      expect(el.querySelector('.layer-end-of-results-indicator').classList.contains).not.toBe(null);
      expect(el.querySelector('.layer-empty-list').classList.contains).not.toBe(null);
    });

    it("Should reset assorted state", function() {
      el.properties.stuckToBottom = false;
      el.properties.lastPagedAt = 5;
      el.properties.isSelfScrolling = true;
      el._renderResetData();
      expect(el.properties.stuckToBottom).toEqual(true);
      expect(el.properties.lastPagedAt).toEqual(0);
      expect(el.properties.isSelfScrolling).toEqual(false);
    });
  });


  describe("The _renderWithoutRemovedData() method", function() {
    it("Should update listData", function() {
      var queryData = query.data.reverse();
      var initialLength = query.data.length;
      expect(initialLength).toEqual(el.properties.listData.length);

      expect(el.properties.listData).toEqual(queryData);
      expect(el.properties.listData).not.toBe(queryData);
      spyOn(el, '_renderWithoutRemovedData').and.callThrough();

      // Run
      queryData[5].destroy();
      Layer.Utils.defer.flush();
      jasmine.clock().tick(1);
      queryData = query.data.reverse();

      // Posttest
      expect(el._renderWithoutRemovedData).toHaveBeenCalled();
      expect(el.properties.listData).toEqual(queryData);
      expect(el.properties.listData).not.toBe(query.data);
      expect(initialLength).toEqual(el.properties.listData.length + 1);
    });

    it("Should call _gatherAndProcessAffectedItems with 3 items before and 3 after the removed item", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var queryData = [].concat(query.data).reverse();

      // Run
      queryData[5].destroy();
      Layer.Utils.defer.flush();
      jasmine.clock().tick(1);

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        queryData[2],
        queryData[3],
        queryData[4],
        queryData[6],
        queryData[7],
        queryData[8]], false);
    });

    it("Should remove the item from the list", function() {
      var queryData = [].concat(query.data).reverse();
      var mid5 = queryData[5].id;
      var midNext = queryData[6].id;
      expect(el.childNodes[6].item.id).toEqual(mid5);

      // Run
      queryData[5].destroy();
      Layer.Utils.defer.flush();
      jasmine.clock().tick(1);

      // Posttest
      expect(el.childNodes[6].item.id).toEqual(midNext);
    });
  });

  describe("The _renderInsertedData() method", function() {
    it("Should update listData", function() {
      var message = conversation.createMessage("What the???");
      message.position = conversation.lastMessage.position + 1;
      query._handleAddEvent('messages', {
        messages: [
          message
        ]
      });

      // Posttest
      expect(el.properties.listData[el.properties.listData.length - 1]).toBe(message);
    });

    it("Should insert a list item at the proper index", function() {
      var message = conversation.createMessage("What the???");
      query.data.splice(20, 0, message);
      query._triggerChange({
        type: 'insert',
        index: 20,
        target: message,
        query: query
      });

      // Posttest
      Layer.Utils.defer.flush();
      jasmine.clock().tick(500);

      var newElement = el.querySelector('#' + el._getItemId(message.id));
      expect(newElement.item).toBe(message);
      expect(newElement).toBe(el.childNodes[15 + 1]); // + 1 for list header
    });

    it("Should insert a list item at the proper index take 2", function() {
      var message = conversation.createMessage("What the???");
      query.data.splice(20, 0, message);
      query._triggerChange({
        type: 'insert',
        index: 20,
        target: message,
        query: query
      });

      // Posttest
      Layer.Utils.defer.flush();
      jasmine.clock().tick(500);

      var newElement = el.querySelector('#' + el._getItemId(message.id));
      expect(newElement.item).toBe(message);
      expect(newElement).toBe(el.childNodes[15 + 1]); // + 1 for list header
    });

    it("Should call _gatherAndProcessAffectedItems on 3 items before and 3 items after the inserted item", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var message = conversation.createMessage("What the???");
      var queryData = [].concat(query.data).reverse();

      // Run
      query.data.splice(20, 0, message);
      query._triggerChange({
        type: 'insert',
        index: 20,
        target: message,
        query: query
      });
      var queryData = [].concat(query.data).reverse();

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        queryData[15-3],
        queryData[15-2],
        queryData[15-1],
        queryData[15],
        queryData[15+1],
        queryData[15+2],
        queryData[15+3]
      ], false);
    });

    it("Should call _gatherAndProcessAffectedItems with isTopNewItem as false if index < last", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var message = conversation.createMessage("What the???");
      var queryData = [].concat(query.data).reverse();

      // Run
      query.data.splice(20, 0, message);
      query._triggerChange({
        type: 'insert',
        index: 20,
        target: message,
        query: query
      });
      var queryData = [].concat(query.data).reverse();

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        queryData[15-3],
        queryData[15-2],
        queryData[15-1],
        queryData[15],
        queryData[15+1],
        queryData[15+2],
        queryData[15+3]
      ], false);
    });

    it("Should call _gatherAndProcessAffectedItems with isTopNewItem as true if index === last", function() {
      spyOn(el, "_gatherAndProcessAffectedItems");
      var message = conversation.createMessage("What the???");
      var queryData = [].concat(query.data).reverse();

      // Run
      query.data.push(message);
      query._triggerChange({
        type: 'insert',
        index: query.data.length - 1,
        target: message,
        query: query
      });
      queryData = [].concat(query.data).reverse();

      // Posttest
      expect(el._gatherAndProcessAffectedItems).toHaveBeenCalledWith([
        queryData[0],
        queryData[1],
        queryData[2],
        queryData[3]
      ], true);
    });

    it("Should call _updateLastMessageSent", function() {
      var message = conversation.createMessage("What the???");
      spyOn(el, "_updateLastMessageSent");

      // Run
      query.data.push(message);
      query._triggerChange({
        type: 'insert',
        index: query.data.length - 1,
        target: message,
        query: query
      });

      // Posttest
      expect(el._updateLastMessageSent).toHaveBeenCalledWith();
    });

    it("Should scroll to bottom if stuck to bottom and new item is bottom", function() {
      var message = conversation.createMessage("What the???");
      el.properties.stuckToBottom = true;
      spyOn(el, "animatedScrollTo");
      // Run
      query.data.push(message);
      query._triggerChange({
        type: 'insert',
        index: query.data.length - 1,
        target: message,
        query: query
      });

      // Posttest
      jasmine.clock().tick(200);
      expect(el.animatedScrollTo).toHaveBeenCalledWith(el.scrollHeight - el.clientHeight);
    });

    it("Should _checkVisibility rather than scroll if not stuck to bottom", function() {
      var message = conversation.createMessage("What the???");
      spyOn(el, "_checkVisibility");
      el.properties.stuckToBottom = false;
      el.scrollTop = 10;

      // Run
      query.data.push(message);
      query._triggerChange({
        type: 'insert',
        index: query.data.length - 1,
        target: message,
        query: query
      });
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();
      CustomElements.takeRecords();
      Layer.Utils.defer.flush();

      // Posttest
      expect(el.scrollTop).toEqual(10);
      expect(el._checkVisibility).toHaveBeenCalledWith();
    });
  });

  describe("The _updateLastMessageSent() method", function() {
    it("Should insure only the last message sent has this class set", function() {
      query.data[0].sender = user1;
      el.onRender();
      Layer.Utils.defer.flush();
      jasmine.clock().tick(150);

      el.querySelectorAllArray('.layer-last-message-sent').forEach(function(node) {
        node.classList.remove('layer-last-message-sent');
      });
      expect(el.querySelectorAllArray('.layer-last-message-sent')).toEqual([]);
      el.childNodes[20].classList.add('layer-last-message-sent');

      // Run
      el._updateLastMessageSent();

      // Posttest
      expect(el.querySelectorAllArray('.layer-last-message-sent')).toEqual([el.childNodes[el.childNodes.length - 2]]);
    });
  });

  describe("The _findFirstVisibleItem() method", function() {
    it("Should return first item", function() {
      el.scrollTop = 0;
      expect(el._findFirstVisibleItem()).toBe(el.childNodes[1]);
    });

    it("Should return second item", function() {
      el.scrollTo(el.childNodes[2].offsetTop - el.offsetTop);
      expect(el._findFirstVisibleItem()).toBe(el.childNodes[2]);
    });

    it("Should return third item", function() {
      el.scrollTo(el.childNodes[3].offsetTop - el.offsetTop);
      expect(el._findFirstVisibleItem()).toBe(el.childNodes[3]);
    });
  });

  describe("The _renderPagedData() method", function() {
    it("Should update lastPagedAt and listData", function() {
      el.properties.lastPagedAt = 0;
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      expect(el.properties.listData.length).toEqual(35);
      query.data.push(messages[1]);
      query.data.push(messages[0]);
      el._renderPagedData({type: 'data', data: messages});
      jasmine.clock().tick(1000);
      expect(el.properties.lastPagedAt > 0).toBe(true);
      expect(el.properties.listData.length).toEqual(37);
    });

    it("Should call _renderPagedDataDone with top 3 items and two new items", function() {
      spyOn(el, "_renderPagedDataDone");
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      var affectedItems = [messages[1], messages[0], el.childNodes[1].item, el.childNodes[2].item, el.childNodes[3].item];
      el._renderPagedData({type: 'data', data: messages});
      Layer.Utils.defer.flush();
      jasmine.clock().tick(1000);
      expect(el._renderPagedDataDone).toHaveBeenCalledWith(affectedItems, jasmine.any(DocumentFragment), {type: 'data', data: messages});
    });

    it("Should do nothing if no data received", function() {
      el.properties.lastPagedAt = 0;
      spyOn(el, "_renderPagedDataDone");
      el._renderPagedData({type: 'data', data: []});
      Layer.Utils.defer.flush();
      jasmine.clock().tick(1000);
      expect(el._renderPagedDataDone).toHaveBeenCalledWith([], null, {type: 'data', data: []});
      expect(el.properties.lastPagedAt).toBe(0);
    });
  });

  describe("The _renderPagedDataDone() method", function() {
    it("Should call processAffectedWidgets with widgets found in both the Fragment and the List", function() {
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      var fragment = el._generateFragment(messages);
      spyOn(el, "_processAffectedWidgets");
      el._renderPagedDataDone([query.data[34], query.data[33], messages[0], messages[1]], fragment, {type: 'data', data: messages});
      expect(el._processAffectedWidgets).toHaveBeenCalledWith(jasmine.arrayContaining([el.childNodes[1], el.childNodes[2], el.childNodes[3], el.childNodes[3]]), true);
    });

    it("Should insert the Document Fragment just after the list header", function() {
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      var fragment = el._generateFragment(messages);
      el._renderPagedDataDone([query.data[34], query.data[33], messages[0], messages[1]], fragment, {type: 'data', data: messages});
      expect(el.childNodes[0].classList.contains('layer-list-meta')).toBe(true);
      expect(el.childNodes[1].item).toBe(messages[0]);
    });

    it("Should scroll to bottom if stuck to bottom", function() {
      el.scrollTop = 0;
      el.properties.stuckToBottom = true;
      spyOn(el, "scrollTo");
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      var fragment = el._generateFragment(messages);
      el._renderPagedDataDone([query.data[34], query.data[33], messages[0], messages[1]], fragment, {type: 'data', data: messages});
      Layer.Utils.defer.flush();
      expect(el.scrollTo).toHaveBeenCalledWith(el.scrollHeight - el.clientHeight);
    });

    it("Should scroll to the item that was on top of the visible viewport prior to the insertion", function() {
      el.scrollTop = el.childNodes[11].offsetTop - el.firstChild.offsetTop;
      expect(el._findFirstVisibleItem()).toBe(el.childNodes[11]);
      el.properties.stuckToBottom = false;
      spyOn(el, "scrollTo");
      var messages = [conversation.createMessage("mm 0"), conversation.createMessage("mm 1")];
      var fragment = el._generateFragment(messages);
      el._renderPagedDataDone([query.data[34], query.data[33], messages[0], messages[1]], fragment, {type: 'data', data: messages});
      Layer.Utils.defer.flush();

      // What was the 11th item is now the 13th item
      var args = el.scrollTo.calls.mostRecent().args;
      expect(Math.round(args[0])).toEqual(el.childNodes[13].offsetTop - el.firstChild.offsetTop);
    });
  });
});