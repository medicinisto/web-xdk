/* eslint-disable */
describe("Emoji Text Handler", function() {
  var handler;
  beforeEach(function() {
    handler = Layer.UI.handlers.text.handlers.emoji.handler;
  });

  function triggerText(text) {
    var evt = new CustomEvent('layer-compose-bar-processing-text', {
      detail: {text: text},
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(evt);
    return evt.detail.text;
  }

  describe("Twemoji", function() {
    beforeEach(function() {
      Layer.UI.settings.useEmojiImages = true;
    });
    it("Should replace any occurance of :-) with an image", function() {
      var details = {
        text: "hello :-)",
      };
      expect(triggerText("hello :-)")).toEqual("hello 😃");
    });

    it("Should replace any occurance of :grin: with an image", function() {
      expect(triggerText("hello :grin: I am a :grin: er")).toEqual("hello 😁 I am a 😁 er");
    });

    it("Should use layer-emoji-line class iff only emojis are in the message", function() {
      var textData = {
        text: "hello 😃 there 😃",
        afterText: []
      };
      handler(textData);
      expect(textData.text).not.toMatch(/layer-emoji-line/);

      textData = {
        text: "😃 😃",
        afterText: []
      };
      handler(textData);
      expect(textData.text.match(/layer-emoji-line/g).length).toEqual(2);
    });

    it("Should handle newline tags safely", function() {
      expect(triggerText("\n:-)\n:grin:\n")).toEqual("\n😃\n😁\n");

      var textData = {
        text: "\n😃\n😁\n",
        afterText: []
      };
      handler(textData);
      expect(textData.text).toMatch(/\n<img.*?\/?>\n<img.*?\/?>\n/);
    });
  });

  describe("No Twemoji", function() {
    beforeEach(function() {
      Layer.UI.settings.useEmojiImages = false;
    });
    afterEach(function() {
      Layer.UI.settings.useEmojiImages = true;
    });
    it("Should replace any occurance of 😃 with an span", function() {
      var textData = {
        text: "hello 😃",
        afterText: []
      };
      handler(textData);
      expect(textData.text).toMatch(/^hello \<span/);
    });

    it("Should use layer-emoji-line class iff only emojis are in the message", function() {
      var textData = {
        text: "hello 😃 there 😃",
        afterText: []
      };
      handler(textData);
      expect(textData.text).not.toMatch(/layer-emoji-line/);

      textData = {
        text: "😃 😃",
        afterText: []
      };
      handler(textData);
      expect(textData.text.match(/layer-emoji-line/g).length).toEqual(1);
    });

    it("Should handle newline tags safely", function() {
      var textData = {
        text: "\n😃\n😃\n",
        afterText: []
      };
      handler(textData);
      expect(textData.text).toMatch(/\n<span.*?>.+<\/span>\n<span.*?>.+<\/span>/);
    });
  });
});