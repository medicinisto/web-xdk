/* eslint-disable */
if (window.Notification) {
  describe('layer-notifier', function() {
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
      el = document.createElement('layer-notifier');
      el.client = client;
      testRoot.appendChild(el);
      conversation = client.createConversation({
        participants: ['layer:///identities/FrodoTheDodo']
      });
      message = conversation.createMessage("Hello");
      message._notify = notification = {title: "Hey", text: "Ho"};
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

    describe('Event Handling', function() {
      it("Should call onMessageNotification when it triggers layer-message-notification", function() {
        var spy = jasmine.createSpy('callback');
        el.onMessageNotification = spy;
        el.trigger('layer-message-notification', {message: message});
        expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
      });

      it("Should call onNotificationClick when it triggerse layer-notification-click", function() {
        var spy = jasmine.createSpy('callback');
        el.onNotificationClick = spy;
        el.trigger('layer-notification-click', {message: message});
        expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
      });
    });

    describe("The flagTitlebar property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should show the badge", function() {
        document.title = "hello";
        el.flagTitlebar = true;
        expect(document.title).toEqual("⬤ hello");
        el.flagTitlebar = false;
        el.flagTitlebar = true;
        expect(document.title).toEqual("⬤ hello");
      });

      it("Should hide the badge", function() {
        document.title = "⬤ hello";
        el.properties.flagTitlebar = true;
        el.flagTitlebar = false; // trigger the setter
        expect(document.title).toEqual("hello");
        el.flagTitlebar = true;
        el.flagTitlebar = false;
        expect(document.title).toEqual("hello");
      });
    });

    describe("The notifyCharacterForTitlebar property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should set how bading is rendered", function() {
        el.notifyCharacterForTitlebar = "frodo says";
        document.title = "hello";
        el.flagTitlebar = true;
        expect(document.title).toEqual("frodo says hello");
      });
    });

    describe("The flagTitlebarForMessage property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should flag the titlebar if message is unread, but not if message is read", function() {
        message.isRead = true;
        el.flagTitlebar = false;

        el.flagTitlebarForMessage = message;
        expect(el.flagTitlebar).toBe(false);
        el.flagTitlebarForMessage = null;

        message.isRead = false;

        el.flagTitlebarForMessage = message;
        expect(el.flagTitlebar).toBe(true);
      });

      it("Should wire up _handleTitlebarMessageChange for the message if unread", function() {
        spyOn(el, "_handleTitlebarMessageChange");
        message.isRead = true;

        el.flagTitlebarForMessage = message;
        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
        el.flagTitlebarForMessage = null;

        message.isRead = false;
        el.flagTitlebarForMessage = message;
        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).toHaveBeenCalled();
      });

      it("Should unwire up _handleTitlebarMessageChange for prior message", function() {
        spyOn(el, "_handleTitlebarMessageChange");
        message.isRead = false;
        el.flagTitlebarForMessage = message;

        el.flagTitlebarForMessage = conversation.createMessage("hey");

        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
      });
    });

    describe("The created() method", function() {
      it("Should setup the avatar, title and container", function() {
        expect(el.nodes.avatar.tagName).toEqual('LAYER-AVATAR');
        expect(el.nodes.title.parentNode.classList.contains('layer-notifier-title')).toBe(true);
        expect(el.nodes.container.classList.contains('layer-message-item-main')).toBe(true);
      });

      it("Should wire up client messages-notify event", function() {
        var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
        window.Layer.UI.UIUtils.isInBackground = jasmine.createSpy('spy');
        client.trigger('messages:notify');
        expect(window.Layer.UI.UIUtils.isInBackground).toHaveBeenCalled();
        window.Layer.UI.UIUtils.isInBackground = restoreFunc;
      });

      it("Should wire up the click handler to onClickToast", function() {
        spyOn(el, 'onNotificationClick');
        el.properties.toastMessage = message;
        el.click();
        expect(el.onNotificationClick).toHaveBeenCalled();
      });
    });

    describe("The _onPermissionGranted() method", function() {
      it("Should flag desktop notifications are enabled", function() {
        testRoot.innerHTML = '<layer-notifier notify-in-background="false"></layer-notifier>';
        CustomElements.takeRecords();
        el = testRoot.firstChild;
        expect(el.properties.userEnabledDesktopNotifications).toBe(false);
        el._onPermissionGranted();
        expect(el.properties.userEnabledDesktopNotifications).toBe(true);
      });
    });

    describe("Run with permissions granted", function() {
      beforeEach(function() {
        el.properties.userEnabledDesktopNotifications = true;
      });
      describe("The notify() method", function() {

        it("Should set flagTitlebarForMessage if isInBackground and notifyInTitlebar is true", function() {
          el.flagTitlebarForMessage = null;
          message.isRead = false;
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(true);

          el._notify({message: message, notification: notification});
          expect(el.flagTitlebarForMessage).toBe(message);


          // Run 2: notifyInTitlebar is false
          el.flagTitlebarForMessage = null;
          el.notifyInTitlebar = false;
          el._notify({message: message, notification: notification});
          expect(el.flagTitlebarForMessage).toBe(null);

          // Run 3: isInBackground is false
          el.flagTitlebarForMessage = null;
          el.notifyInTitlebar = true;
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(false);
          el._notify({message: message, notification: notification});
          expect(el.flagTitlebarForMessage).toBe(null);

          // Restore
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
        });

        it("Should use background notification setting if isInBackground returns true", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(true);

          // Part 1
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'toast';
          el._notify({message: message, notification: notification});
          expect(el.desktopNotify).toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(notification, message);
          el.desktopNotify.calls.reset();

          // Part 2
          el.notifyInBackground = 'toast';
          el.notifyInForeground = 'desktop';
          el._notify({message: message, notification: notification});
          expect(el.desktopNotify).not.toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).toHaveBeenCalledWith(notification, message);

          // Cleanup
          window.Layer.UI.UIUtils.isInBackground.utils = restoreFunc;
        });

        it("Should use foreground notification setting if isInBackground returns false", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(false);

          // Part 1
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'toast';
          el._notify({message: message, notification: notification});
          expect(el.desktopNotify).not.toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).toHaveBeenCalledWith(notification, message);
          el.toastNotify.calls.reset();

          // Part 2
          el.notifyInBackground = 'toast';
          el.notifyInForeground = 'desktop';
          el._notify({message: message, notification: notification});
          expect(el.desktopNotify).toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(notification, message);

          // Cleanup
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
        });

        it("Should trigger the layer-message-notification event", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          el.notifyInBackground = 'toast';
          var spy = jasmine.createSpy('onNotify');
          document.body.addEventListener('layer-message-notification', spy);
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(true);

          // Run
          el._notify({message: message, notification: notification});

          // Posttest
          var args = spy.calls.allArgs()[0];
          expect(args.length).toEqual(1);
          expect(args[0].detail).toEqual({
            type: 'toast',
            isBackground: true,
            item: message,
            model: message.createModel()
          });

          // Cleanup
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
          document.body.removeEventListener('layer-message-notification', spy);
        });

        it("Should prevent handling if evt.preventDefault is called", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var fn = function(evt) {
            evt.preventDefault();
          };
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(true);
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'desktop';
          document.body.addEventListener('layer-message-notification', fn);

          // Run
          el._notify({message: message, notification: notification});

          // Posttest
          expect(el.desktopNotify).not.toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(notification, message);

          // Cleanup
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
          document.body.removeEventListener('layer-message-notification', fn);
        });

        it("Should do nothing if desktop notification is configured and permissions not granted", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.Layer.UI.UIUtils.isInBackground;
          spyOn(window.Layer.UI.UIUtils, 'isInBackground').and.returnValue(true);
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'desktop';
          el.properties.userEnabledDesktopNotifications = false;

          // Run
          el._notify({message: message, notification: notification});

          // Posttest
          expect(el.desktopNotify).not.toHaveBeenCalledWith(notification, message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(notification, message);

          // Cleanup
          window.Layer.UI.UIUtils.isInBackground = restoreFunc;
        });
      });

      describe("The _handleTitlebarMessageChange() method", function() {
        it("Should clear the badge if the message is read", function() {
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.__isRead = true;

          el._handleTitlebarMessageChange();
          expect(el.flagTitlebar).toBe(false);
        });

        it("Should clear the event handler if the message is read", function() {
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.__isRead = true;

          el._handleTitlebarMessageChange();
          expect(el.flagTitlebar).toBe(false);

          // Run
          spyOn(el, "_handleTitlebarMessageChange");
          message.trigger("messages:change");

          expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
        });


        it("Should clear the badge if the message is destroyed", function() {
          spyOn(el, "_handleTitlebarMessageChange").and.callThrough();
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.destroy();

          expect(el._handleTitlebarMessageChange).toHaveBeenCalled();
          expect(el.flagTitlebar).toBe(false);
        });
      });

      describe("The desktopNotify() method", function() {
        it("Should calls closeDesktopNotify if needed", function() {
          spyOn(el, "closeDesktopNotify");
          expect(Boolean(el.properties.desktopNotify)).toBe(false);

          // Run 1
          el.desktopNotify(notification, message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          expect(Boolean(el.properties.desktopNotify)).toBe(true);

          // Run 2
          el.desktopNotify(notification, message);
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });

        it("Should set desktopMessage and desktopNotify", function() {
          expect(Boolean(el.properties.desktopNotify)).toBe(false);
          expect(Boolean(el.properties.desktopMessage)).toBe(false);

          // Run
          el.desktopNotify(notification, message);

          // Posttest
          expect(Boolean(el.properties.desktopNotify)).toBe(true);
          expect(el.properties.desktopMessage).toBe(message);
        });

        it("Should listen for the message to be read and call closeDesktopNotify", function() {
          spyOn(el, "closeDesktopNotify");
          message.isRead = false;

          // Run
          el.desktopNotify(notification, message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.trigger('messages:change', {});
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });

        it("Should listen for the message to be destroyed and call closeDesktopNotify", function() {
          spyOn(el, "closeDesktopNotify");
          message.isRead = false;

          // Run
          el.desktopNotify(notification, message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.trigger('destroy', {});
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });
      });

      describe("The closeDesktopNotify() method", function() {
        it("Should set desktopMessage and desktopNotify to null", function() {
          el.properties.desktopMessage = message;
          var spy = jasmine.createSpy('close');
          el.properties.desktopNotify = {
            close: spy
          };

          // Run
          el.closeDesktopNotify();

          // Posttest
          expect(el.properties.desktopMessage).toBe(null);
          expect(el.properties.desktopNotify).toBe(null);
          expect(spy).toHaveBeenCalled();
        });
      });

      describe("The toastNotify() method", function() {
        it("Should set the avatar users", function() {
          expect(el.nodes.avatar.users).toEqual([]);
          el.toastNotify(notification, message);
          expect(el.nodes.avatar.users).toEqual([message.sender]);
        });

        it("Should set the title", function() {
          expect(el.nodes.title.innerHTML).toEqual('');
          el.toastNotify(notification, message);
          expect(el.nodes.title.innerHTML.indexOf(message.sender.displayName)).not.toEqual(-1);
        });

        it("Should set message area", function() {
          expect(el.nodes.message.innerHTML).toEqual("");
          el.toastNotify(notification, message);
          expect(el.nodes.message.innerHTML).toEqual("Ho");
        });

        it("Should replace the message area", function() {
          expect(el.nodes.message.innerHTML).toEqual("");
          el.toastNotify({text: "test 1"}, message);
          el.toastNotify({text: "test 2"}, conversation.createMessage("test 2"));
          el.toastNotify({text: "test 3"}, conversation.createMessage("test 3"));
          el.toastNotify({text: "test 4"}, conversation.createMessage("test 4"));
          expect(el.nodes.message.innerHTML).toEqual("test 4");
        });

        it("Should listen for the message to be read and call closeToast", function() {
          spyOn(el, "closeToast");
          message.isRead = false;

          // Run
          el.toastNotify(notification, message);
          el.closeToast.calls.reset();
          message.trigger('messages:change', {});
          expect(el.closeToast).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should listen for the message to be destroyed and call closeToast", function() {
          spyOn(el, "closeToast");
          message.isRead = false;

          // Run
          el.toastNotify(notification, message);
          el.closeToast.calls.reset();
          message.trigger('destroy');
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should add the layer-notifier-toast css class", function() {
          expect(el.classList.contains('layer-notifier-toast')).toBe(false);
          el.toastNotify(notification, message);
          expect(el.classList.contains('layer-notifier-toast')).toBe(true);
        });
      });

      describe("The closeToast() method", function() {
        it("Should clear the layer-notifier-toast css class", function() {
          el.classList.add('layer-notifier-toast');
          el.toastNotify(notification, message);
          el.closeToast();
          expect(el.classList.contains('layer-notifier-toast')).toBe(false);
        });

        it("Should no longer listen for the message to be read and call closeToast", function() {
          message.isRead = false;

          // Run
          el.closeToast();

          // Posttest
          spyOn(el, "closeToast");
          el.toastNotify(notification, message);
          el.closeToast.calls.reset();
          message.trigger('messages:change', {});
          expect(el.closeToast).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should clear timeouts", function() {
          el.toastNotify(notification, message);
          el.properties._toastTimeout = 5;
          el.closeToast();
          expect(el.properties._toastTimeout).toEqual(0);
        });
      });

      describe("The onClickToast() method", function() {
        beforeEach(function() {
          el.properties.toastMessage = message;
        });
        it("Should prevent bubbling", function() {
          var preventDefaultSpy = jasmine.createSpy('preventDefault');
          var stopPropagationSpy = jasmine.createSpy('stopPropagation');

          // Run
          el.onClickToast({
            preventDefault: preventDefaultSpy,
            stopPropagation: stopPropagationSpy
          });

          // Posttest
          expect(preventDefaultSpy).toHaveBeenCalled();
          expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it("Should trigger layer-notification-click", function() {
          var spy1 = jasmine.createSpy('spy1');
          document.body.addEventListener('layer-notification-click', spy1);

          // Run
          el.click();

          // Posttest
          var args = spy1.calls.allArgs()[0];
          expect(args.length).toEqual(1);
          expect(args[0].detail).toEqual({
            item: message,
            model: message.createModel()
          });

          // Cleanup
          document.body.removeEventListener('layer-notification-click', spy1);
        });
      });
    });
  });
}