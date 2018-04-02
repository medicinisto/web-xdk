/* eslint-disable */
describe('Link Message Components', function() {
  var LinkModel;
  var conversation;
  var testRoot;
  var client;

  beforeEach(function() {
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
      isFullIdentity: true,
      isMine: true
    });
    client._clientAuthenticated();
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    testRoot.style.display = 'flex';
    testRoot.style.flexDirection = 'column';
    testRoot.style.height = '300px';

    LinkModel = Layer.Core.Client.getMessageTypeModelClass("LinkModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
  });


  afterEach(function() {
    if (client) client.destroy();
    Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
    jasmine.clock().uninstall();
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message with metadata", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        title: "b",
        author: "c",
        description: "d",
        imageUrl: "https://layer.com/invalidimage.png"
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(LinkModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          url: "http://layer.com/about",
          title: "b",
          author: "c",
          description: "d",
          image_url: "https://layer.com/invalidimage.png"
        });
      });
    });

    it("Should create an appropriate Message without metadata", function() {
      var model = new LinkModel({
        url: "http://layer.com/about"
      });
      model.generateMessage(conversation, function(message) {
        expect(message.parts.size).toEqual(1);
        var rootPart = message.getRootPart();
        expect(rootPart.mimeType).toEqual(LinkModel.MIMEType);
        expect(JSON.parse(rootPart.body)).toEqual({
          url: "http://layer.com/about"
        });
      });
    });

    it("Should instantiate a Model from a Message with metadata", function() {
      var m = conversation.createMessage({
        parts: [{
          mimeType: LinkModel.MIMEType + '; role=root',
          body: JSON.stringify({
            url: "http://layer.com/about",
            title: "b",
            author: "c",
            description: "d",
            image_url: "https://layer.com/invalidimage.png"
          })
        }]
      });
      var m = new LinkModel({
        message: m,
        part: m.findPart(),
      });
      expect(m.url).toEqual("http://layer.com/about");
      expect(m.title).toEqual("b");
      expect(m.author).toEqual("c");
      expect(m.description).toEqual("d");
      expect(m.imageUrl).toEqual("https://layer.com/invalidimage.png");
    });

    it("Should instantiate a Model from a Message without metadata", function() {
      var m = conversation.createMessage({
        parts: [{
          mimeType: LinkModel.MIMEType + '; role=root',
          body: JSON.stringify({
            url: "http://layer.com/about"
          })
        }]
      });
      var m = new LinkModel({
        message: m,
        part: m.findPart(),
      });
      expect(m.url).toEqual("http://layer.com/about");
      expect(m.title).toEqual("");
      expect(m.author).toEqual("");
      expect(m.description).toEqual("");
      expect(m.imageUrl).toEqual("");
    });

    it("Should respond to Standard Message Container calls for metadata", function() {
      var model1 = new LinkModel({
        url: "http://layer.com/about",
        title: "b",
        author: "c",
        description: "d"
      });
      var model2 = new LinkModel({
        url: "http://layer.com/about"
      });

      expect(model1.getTitle()).toEqual("b");
      expect(model2.getTitle()).toEqual("");

      expect(model1.getDescription()).toEqual("d");
      expect(model2.getDescription()).toEqual("");

      expect(model1.getFooter()).toEqual("c");
      expect(model2.getFooter()).toEqual("");
    });

    it("Should have a suitable one line summary", function() {
      var model1 = new LinkModel({
        url: "http://layer.com/about",
        title: "b",
        author: "c",
        description: "d"
      });
      var model2 = new LinkModel({
        url: "http://layer.com/about"
      });

      expect(model1.getOneLineSummary()).toEqual("b");
      expect(model2.getOneLineSummary()).toEqual("http://layer.com/about");
    });
  });

  describe("View Tests", function() {
    var el, message;
    beforeEach(function() {
      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);
    });
    afterEach(function() {
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
    });

    it("Should render url alone as a chat bubble", function() {
      var model = new LinkModel({
        url: "http://layer.com/about"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();

      // Container: Core UI is shown as it contains the link
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(false);

      // Container: Metadata is hidden so no arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(false);

      // Message Viewer: Render as a chat bubble
      expect(el.classList.contains('layer-card-width-any-width')).toEqual(true);

      // Message UI: contains anchor tag
      expect(el.querySelector('a').src).toEqual("http://layer.com/about");
      expect(el.querySelector('a').innerHTML).toEqual("http://layer.com/about");
    });

    it("Should render url and image as an image alone", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAoCAYAAAB0HkOaAAAAAXNSR0IArs4c6QAABSZJREFUWAnNWGtsFFUU/mZmd7uPbpfu0vdit7SstZSHYHkVEv4oIZEfKMEfhB8mYhPjLzQhakSMJvwz4YePookGFQX/iEZjwBAfWEIKorVv2t3utl22j+2yu93343pncKa72wWZndZ4ktt759xzzv3mnHPPnC6DLDrx4ZfnWcLs5TgWIFkbCpaRRMLAsUxIZyS2Vw4d8t/PFCNuvv7e569mgLePHznIaFQqka14vjnkxB+DjoxnZm4sHFdtOfniU757GaUuuEuEZVq3r7NjKYGItq0VFrZ1db1Nq0lcPdZ5ySTy82cJDO8LGhnJU/mCSp83rrGxrQ31jXrWd/XlM2cMhewxr737mQMMQxhCKjUadaleW1JIThYvnkii4+k9sJiM4MM06wvAvqpWsNE9OJLud433GUMPbTt6dEc02/Dd5CBkNZ+vvBF+KCW9VovAfEQAk2+rrbmJS2fI2mGX+7fOzs6tHR0d0oE5mVptWYGdG1touAgcE178eWsMaprM+3a1CbwgPeDGwCjmgvMQZcXDLnf3CHzx+X7z1kd4QOn1tyaYKxTQThGQlDO8clmpHtoSNXpH3WhtrMeWtXaoOA7WKgv6HePgQ3hk/xOUxwqyeq0GfQ63MKLxxD3Pd3qm4KDDeXsaTu80XFMzqFlp4egLbfIypguiYo5neGYgFMHQ2CTCkRh2PdqCv0Zc4A8acE4IgxCCJhr/DMnAHwwLPNFYoXmD3YZYPAmOW3w3mhusqimff4eotwhMbYUZuze3otFaja6eQVFOmidn5lBbUY6JaR/stlocLtst7H363U+STPaCZRhsX2/PZknrOzTcP1/vlcrrIjDBcASOSa8AJJFMwaDTSspqFYd1TfX4oesmDZMOw2MefPtrt7SvdLEIzDwNj9s7m2O3styE5/Y/DpIh6HeOw+vzC2ByhJbgIQfMsMsDfmRTOBrDWx+dz2YJ60Kyi4RkMuh3EZxMnQcQl9LgAWQXRFT0bp+jH4EaBky72WRssFZaFnYVrOqU2DnxwdmzNBnpzZVPs9EUSWXk6/kDIfLm6XNSW5FT9IpxhDuUwMlrHpzumSlGPUdHMZh+XxTPNJsxeieG+STtiBSQYjA6mnXJNEGDqURx/6EYTLNZh2veMCgeGNTKzOXUmWI8XKVXQU+9Y9QorxDKXuUf9KYSDtMRqS0p5p0EnSUB4w0noaVtxcBcrGggvKJiMK5gAmatCvvXlOOSK4gYnzxFkmIwg9QbzWYt+NxZa9HhsjtYJJQl8MyQ/y4YHsEuaymcgTj6aO0RSY6fFN2mcVp9+eQtozeJL3d87myo0OPj3lmh7iRoy+GLpsDSJu+N7XUo0OyJmIVZUZi6aX2xlWnw9cgdnPp9Cr9MhJCibenehhVC7rRVGfDSY9XQsCyGHiC5i/KML5bCVU8YXZ55bKstxcPlWuyxlYGvxiJtqtLjymSIfrduYzNdt1gWOkZRJn+WDeYivTE8iHYKoq3agAP0FhWichq+fatXCKPQfiHewqsU2s3jfe8MgP8wHmurgTMYR3udMU9C2aMsMDemwnhhYyUuugL0KqthLVUrOz1PWxaYQDyNd65PYcQfx5M0BEtNsnKGv558DdlaY1DcLhR6EVlgjBoW2yiQ5SJZYVouEKLd/yeYNMlEk6lUWkT5X8yJVAqZTEZKFWlBOO7CjQHHs3UVK7Gq0rzsWOi/Nvjkmx/pXyL9upDzO8Xx9784TK/JKRXLKW/b/v110mlCrvU/f/DAVwwjRORv7Q8/9lLmpIIAAAAASUVORK5CYII='
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      // Container: Core UI is shown as it contains the image
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(false);

      // Container: Metadata is hidden so no arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(false);

      // Message Viewer:: Render as a card
      expect(el.classList.contains('layer-card-width-flex-width')).toEqual(true);

      // Message UI: contains image tag
      expect(el.nodes.ui.nodes.image.style.backgroundImage).toMatch(/data\:image\/png/);
    });

    it("Should render url and title", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        title: "hello"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      // Container: Core UI is hidden as only the title will be shown
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(true);

      // Container: Metadata is showing so show arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(true);

      // Message Viewer:: Render as a card
      expect(el.classList.contains('layer-card-width-flex-width')).toEqual(true);

      // Title is rendered
      expect(el.querySelector(' .layer-standard-card-container-title').innerText.trim()).toEqual('hello');
    });

    it("Should render url, title and image", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        title: "hello",
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAoCAYAAAB0HkOaAAAAAXNSR0IArs4c6QAABSZJREFUWAnNWGtsFFUU/mZmd7uPbpfu0vdit7SstZSHYHkVEv4oIZEfKMEfhB8mYhPjLzQhakSMJvwz4YePookGFQX/iEZjwBAfWEIKorVv2t3utl22j+2yu93343pncKa72wWZndZ4ktt759xzzv3mnHPPnC6DLDrx4ZfnWcLs5TgWIFkbCpaRRMLAsUxIZyS2Vw4d8t/PFCNuvv7e569mgLePHznIaFQqka14vjnkxB+DjoxnZm4sHFdtOfniU757GaUuuEuEZVq3r7NjKYGItq0VFrZ1db1Nq0lcPdZ5ySTy82cJDO8LGhnJU/mCSp83rrGxrQ31jXrWd/XlM2cMhewxr737mQMMQxhCKjUadaleW1JIThYvnkii4+k9sJiM4MM06wvAvqpWsNE9OJLud433GUMPbTt6dEc02/Dd5CBkNZ+vvBF+KCW9VovAfEQAk2+rrbmJS2fI2mGX+7fOzs6tHR0d0oE5mVptWYGdG1touAgcE178eWsMaprM+3a1CbwgPeDGwCjmgvMQZcXDLnf3CHzx+X7z1kd4QOn1tyaYKxTQThGQlDO8clmpHtoSNXpH3WhtrMeWtXaoOA7WKgv6HePgQ3hk/xOUxwqyeq0GfQ63MKLxxD3Pd3qm4KDDeXsaTu80XFMzqFlp4egLbfIypguiYo5neGYgFMHQ2CTCkRh2PdqCv0Zc4A8acE4IgxCCJhr/DMnAHwwLPNFYoXmD3YZYPAmOW3w3mhusqimff4eotwhMbYUZuze3otFaja6eQVFOmidn5lBbUY6JaR/stlocLtst7H363U+STPaCZRhsX2/PZknrOzTcP1/vlcrrIjDBcASOSa8AJJFMwaDTSspqFYd1TfX4oesmDZMOw2MefPtrt7SvdLEIzDwNj9s7m2O3styE5/Y/DpIh6HeOw+vzC2ByhJbgIQfMsMsDfmRTOBrDWx+dz2YJ60Kyi4RkMuh3EZxMnQcQl9LgAWQXRFT0bp+jH4EaBky72WRssFZaFnYVrOqU2DnxwdmzNBnpzZVPs9EUSWXk6/kDIfLm6XNSW5FT9IpxhDuUwMlrHpzumSlGPUdHMZh+XxTPNJsxeieG+STtiBSQYjA6mnXJNEGDqURx/6EYTLNZh2veMCgeGNTKzOXUmWI8XKVXQU+9Y9QorxDKXuUf9KYSDtMRqS0p5p0EnSUB4w0noaVtxcBcrGggvKJiMK5gAmatCvvXlOOSK4gYnzxFkmIwg9QbzWYt+NxZa9HhsjtYJJQl8MyQ/y4YHsEuaymcgTj6aO0RSY6fFN2mcVp9+eQtozeJL3d87myo0OPj3lmh7iRoy+GLpsDSJu+N7XUo0OyJmIVZUZi6aX2xlWnw9cgdnPp9Cr9MhJCibenehhVC7rRVGfDSY9XQsCyGHiC5i/KML5bCVU8YXZ55bKstxcPlWuyxlYGvxiJtqtLjymSIfrduYzNdt1gWOkZRJn+WDeYivTE8iHYKoq3agAP0FhWichq+fatXCKPQfiHewqsU2s3jfe8MgP8wHmurgTMYR3udMU9C2aMsMDemwnhhYyUuugL0KqthLVUrOz1PWxaYQDyNd65PYcQfx5M0BEtNsnKGv558DdlaY1DcLhR6EVlgjBoW2yiQ5SJZYVouEKLd/yeYNMlEk6lUWkT5X8yJVAqZTEZKFWlBOO7CjQHHs3UVK7Gq0rzsWOi/Nvjkmx/pXyL9upDzO8Xx9784TK/JKRXLKW/b/v110mlCrvU/f/DAVwwjRORv7Q8/9lLmpIIAAAAASUVORK5CYII='

      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      // Container: Core UI is shown with an image
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(false);

      // Container: Core UI is showing so don't bother showing the arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(false);

      // Message Viewer:: Render as a card
      expect(el.classList.contains('layer-card-width-flex-width')).toEqual(true);

      // Message UI: contains image tag
      expect(el.nodes.ui.nodes.image.style.backgroundImage).toMatch(/data\:image\/png/);

      // Title is rendered
      expect(el.querySelector(' .layer-standard-card-container-title').innerText.trim()).toEqual('hello');
    });

    it("Should render url, title, description and author", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        title: "hello",
        description: "there",
        author: "all"
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      // Container: Core UI is hidden, no image to show
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(true);

      // Container: Core UI is hidden so show the arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(true);

      // Message Viewer:: Render as a card
      expect(el.classList.contains('layer-card-width-flex-width')).toEqual(true);

      // Title, description and author are rendered
      expect(el.querySelector('.layer-standard-card-container-title').innerText.trim()).toEqual('hello');
      expect(el.querySelector('.layer-standard-card-container-description').innerText.trim()).toEqual('there');
      expect(el.querySelector('.layer-standard-card-container-footer').innerText.trim()).toEqual('all');
    });

    it("Should render url, title, description, author and image", function() {
      var model = new LinkModel({
        url: "http://layer.com/about",
        title: "hello",
        description: "there",
        author: "all",
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAoCAYAAAB0HkOaAAAAAXNSR0IArs4c6QAABSZJREFUWAnNWGtsFFUU/mZmd7uPbpfu0vdit7SstZSHYHkVEv4oIZEfKMEfhB8mYhPjLzQhakSMJvwz4YePookGFQX/iEZjwBAfWEIKorVv2t3utl22j+2yu93343pncKa72wWZndZ4ktt759xzzv3mnHPPnC6DLDrx4ZfnWcLs5TgWIFkbCpaRRMLAsUxIZyS2Vw4d8t/PFCNuvv7e569mgLePHznIaFQqka14vjnkxB+DjoxnZm4sHFdtOfniU757GaUuuEuEZVq3r7NjKYGItq0VFrZ1db1Nq0lcPdZ5ySTy82cJDO8LGhnJU/mCSp83rrGxrQ31jXrWd/XlM2cMhewxr737mQMMQxhCKjUadaleW1JIThYvnkii4+k9sJiM4MM06wvAvqpWsNE9OJLud433GUMPbTt6dEc02/Dd5CBkNZ+vvBF+KCW9VovAfEQAk2+rrbmJS2fI2mGX+7fOzs6tHR0d0oE5mVptWYGdG1touAgcE178eWsMaprM+3a1CbwgPeDGwCjmgvMQZcXDLnf3CHzx+X7z1kd4QOn1tyaYKxTQThGQlDO8clmpHtoSNXpH3WhtrMeWtXaoOA7WKgv6HePgQ3hk/xOUxwqyeq0GfQ63MKLxxD3Pd3qm4KDDeXsaTu80XFMzqFlp4egLbfIypguiYo5neGYgFMHQ2CTCkRh2PdqCv0Zc4A8acE4IgxCCJhr/DMnAHwwLPNFYoXmD3YZYPAmOW3w3mhusqimff4eotwhMbYUZuze3otFaja6eQVFOmidn5lBbUY6JaR/stlocLtst7H363U+STPaCZRhsX2/PZknrOzTcP1/vlcrrIjDBcASOSa8AJJFMwaDTSspqFYd1TfX4oesmDZMOw2MefPtrt7SvdLEIzDwNj9s7m2O3styE5/Y/DpIh6HeOw+vzC2ByhJbgIQfMsMsDfmRTOBrDWx+dz2YJ60Kyi4RkMuh3EZxMnQcQl9LgAWQXRFT0bp+jH4EaBky72WRssFZaFnYVrOqU2DnxwdmzNBnpzZVPs9EUSWXk6/kDIfLm6XNSW5FT9IpxhDuUwMlrHpzumSlGPUdHMZh+XxTPNJsxeieG+STtiBSQYjA6mnXJNEGDqURx/6EYTLNZh2veMCgeGNTKzOXUmWI8XKVXQU+9Y9QorxDKXuUf9KYSDtMRqS0p5p0EnSUB4w0noaVtxcBcrGggvKJiMK5gAmatCvvXlOOSK4gYnzxFkmIwg9QbzWYt+NxZa9HhsjtYJJQl8MyQ/y4YHsEuaymcgTj6aO0RSY6fFN2mcVp9+eQtozeJL3d87myo0OPj3lmh7iRoy+GLpsDSJu+N7XUo0OyJmIVZUZi6aX2xlWnw9cgdnPp9Cr9MhJCibenehhVC7rRVGfDSY9XQsCyGHiC5i/KML5bCVU8YXZ55bKstxcPlWuyxlYGvxiJtqtLjymSIfrduYzNdt1gWOkZRJn+WDeYivTE8iHYKoq3agAP0FhWichq+fatXCKPQfiHewqsU2s3jfe8MgP8wHmurgTMYR3udMU9C2aMsMDemwnhhYyUuugL0KqthLVUrOz1PWxaYQDyNd65PYcQfx5M0BEtNsnKGv558DdlaY1DcLhR6EVlgjBoW2yiQ5SJZYVouEKLd/yeYNMlEk6lUWkT5X8yJVAqZTEZKFWlBOO7CjQHHs3UVK7Gq0rzsWOi/Nvjkmx/pXyL9upDzO8Xx9784TK/JKRXLKW/b/v110mlCrvU/f/DAVwwjRORv7Q8/9lLmpIIAAAAASUVORK5CYII='
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      // Container: Core UI is showing an image
      expect(el.nodes.cardContainer.classList.contains('layer-no-core-ui')).toEqual(false);

      // Container: Core UI is showing so hide the arrow in the container
      expect(el.nodes.cardContainer.classList.contains('layer-arrow-next-container')).toEqual(false);

      // Message Viewer:: Render as a card
      expect(el.classList.contains('layer-card-width-flex-width')).toEqual(true);

      // Title, description and author are rendered
      expect(el.querySelector(' .layer-standard-card-container-title').innerText.trim()).toEqual('hello');
      expect(el.querySelector(' .layer-standard-card-container-description').innerText.trim()).toEqual('there');
      expect(el.querySelector(' .layer-standard-card-container-footer').innerText.trim()).toEqual('all');

      // Message UI: contains image tag
      expect(el.nodes.ui.nodes.image.style.backgroundImage).toMatch(/data\:image\/png/);
    });

    it("Should open the link using the url", function() {
      var tmp = Layer.UI.UIUtils.showFullScreen;
      spyOn(Layer.UI.UIUtils, "showFullScreen");

      var model = new LinkModel({
        url: "http://layer.com/about",
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      expect(model.actionEvent).toEqual('open-url');
      el._runAction({});
      expect(Layer.UI.UIUtils.showFullScreen).toHaveBeenCalledWith("http://layer.com/about");

      // Restore
      Layer.UI.UIUtils.showFullScreen = tmp;
    });

    it("Should open the link using action data url", function() {
      var tmp = Layer.UI.UIUtils.showFullScreen;
      spyOn(Layer.UI.UIUtils, "showFullScreen");

      var model = new LinkModel({
        url: "http://layer.com/about",
        action: {
          data: {
            url: "https://layer.com/aboutface"
          }
        }
      });
      model.generateMessage(conversation, function(m) {
        message = m;
      });
      el.client = client;
      el.message = message;
      Layer.Utils.defer.flush();

      expect(model.actionEvent).toEqual('open-url');
      el._runAction({});
      expect(Layer.UI.UIUtils.showFullScreen).toHaveBeenCalledWith("https://layer.com/aboutface");

      // Restore
      Layer.UI.UIUtils.showFullScreen = tmp;
    });
  });
});
