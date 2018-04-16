/* eslint-disable */
describe("The Content class", function() {
    var appId = "Fred's App";
    var conversation,
        client,
        requests;

    afterAll(function() {

    });

    beforeEach(function() {
        jasmine.Ajax.install();
        requests = jasmine.Ajax.requests;
        client = new Layer.Core.Client({
            appId: appId,
            reset: true,
            url: "https://doh.com"
        });
        client.userId = "999";
        client.user = new Layer.Core.Identity({
          userId: client.userId,
          id: "layer:///identities/" + client.userId,
          firstName: "first",
          lastName: "last",
          phoneNumber: "phone",
          emailAddress: "email",
          metadata: {},
          publicKey: "public",
          avatarUrl: "avatar",
          displayName: "display",
          syncState: Layer.Constants.SYNC_STATE.SYNCED,
          isFullIdentity: true,
          isMine: true
        });


        client._clientAuthenticated();
        getObjectsResult = [];
        spyOn(client.dbManager, "getObjects").and.callFake(function(tableName, ids, callback) {
            setTimeout(function() {
                callback(getObjectsResult);
            }, 10);
        });
        client._clientReady();
        client.onlineManager.isOnline = true;

        conversation = Layer.Core.Conversation._createFromServer(responses.conversation2).conversation;
        requests.reset();
        client.syncManager.queue = [];
    });
    afterEach(function() {
        client.destroy();
        jasmine.Ajax.uninstall();
    });


    describe("The constructor() method", function() {
        it("Should initialize with an object", function() {
            expect(new Layer.Core.Content({downloadUrl: "hey"}).downloadUrl).toEqual("hey");
            expect(new Layer.Core.Content({expiration: 100000}).expiration).toEqual(100000);
            expect(new Layer.Core.Content({refreshUrl: "hey"}).refreshUrl).toEqual("hey");
            expect(new Layer.Core.Content({id: "content"}).id).toEqual("content");
        });

        it("Should initialize by id", function() {
            expect(new Layer.Core.Content("content").id).toEqual("content");
        });
    });

    describe("The loadContent() method", function() {
        it("Should send a request to the server", function() {
            var content = new Layer.Core.Content({
                downloadUrl: "http://hey.com"
            });

            // Run
            content.loadContent("text/plain");

            // Posttest
            expect(requests.mostRecent().url).toEqual("http://hey.com");
            expect(requests.mostRecent().method).toEqual("GET");
            expect(requests.mostRecent().responseType).toEqual("arraybuffer");
        });

        it("Should call the callback", function() {

            var content = new Layer.Core.Content({
                downloadUrl: "http://hey.com"
            });
            var spy = jasmine.createSpy('spy');

            // Run
            content.loadContent("text/plain", spy);

            requests.mostRecent().response({
                status: 200,
                responseText: atob("abc938a")
            });

            // Posttest
            expect(spy).toHaveBeenCalledWith(null, jasmine.any(Blob));
        });

        it("Should call the callback with an error", function() {
            var tmp = window.Blob;
            window.Blob = undefined;

            var content = new Layer.Core.Content({
                downloadUrl: "http://hey.com"
            });
            var spy = jasmine.createSpy('spy');

            // Run
            content.loadContent("text/plain", spy);

            requests.mostRecent().response({
                status: 404,
                responseText: "abc938a"
            });

            // Posttest
            expect(spy).toHaveBeenCalledWith("abc938a", null);

            // Cleanup
            window.Blob = tmp;
        });
    });

    describe("The refreshContent() method", function() {
      var content;
      beforeEach(function() {
        content = new Layer.Core.Content({
            downloadUrl: "http://hey.com",
            refreshUrl: "https://ho.com",
            expiration: 100000,
            contentId: "fred"
        });
      })

      it("Should call xhr", function() {
          content.refreshContent();
          expect(requests.mostRecent().url).toEqual("https://ho.com");
          expect(requests.mostRecent().method).toEqual("GET");
      });

      it("Should set expiration and downloadUrl", function() {
        content.refreshContent();
        requests.mostRecent().response({
          status: 200,
          responseText: JSON.stringify({
            expiration: 300000,
            download_url: "http://there.com"
          })
        });
        expect(content.downloadUrl).toEqual("http://there.com");
        expect(content.expiration.getTime()).toEqual(300000);
      });

      it("Should call the callback", function() {
        var spy = jasmine.createSpy('callback');
        content.refreshContent(spy);
        requests.mostRecent().response({
          status: 200,
          responseText: JSON.stringify({
            expiration: 300000,
            download_url: "http://there.com"
          })
        });
        expect(spy).toHaveBeenCalledWith("http://there.com");
      });
    });

    xdescribe("The isExpired() method", function() {});

    describe("The static _createFromServer() method", function() {
        it("Should initialize with an object", function() {
            expect(Layer.Core.Content._createFromServer({download_url: "hey1"}).downloadUrl).toEqual("hey1");
            expect(Layer.Core.Content._createFromServer({expiration: 100000}).expiration).toEqual(new Date(100000));
            expect(Layer.Core.Content._createFromServer({refresh_url: "hey2"}).refreshUrl).toEqual("hey2");
            expect(Layer.Core.Content._createFromServer({id: "content"}).id).toEqual("content");
        });
    });
});
