/* eslint-disable */
describe("Email Text Handler", function() {
  var handler;
  beforeEach(function() {
    handler = Layer.UI.handlers.text.handlers.email.handler;
  });

  it("Should replace all occurance of emmail address with mailto:email address", function() {
    var textData = {
      text: "user@layer.com sent an email to user+user@layer.come and instead it was received by user@layer.com",
      afterText: []
    };
    handler(textData);
    expect(textData.text).toEqual('mailto:user@layer.com sent an email to mailto:user+user@layer.come and instead it was received by mailto:user@layer.com');
  });

  it("Should ignore incomplete email addresses", function() {
    var textData = {
      text: "user@ layer.com sent an email to user+user @layer.come and instead it was received by user@layer",
      afterText: []
    };
    handler(textData);
    expect(textData.text).toEqual('user@ layer.com sent an email to user+user @layer.come and instead it was received by user@layer');
  });

  it("Should ignore mailto preceded email addresses", function() {
    var textData = {
      text: "mailto:user@layer.com sent an email to mailto:user+user@layer.come and instead it was received by mailto:user@layer.com",
      afterText: []
    };
    handler(textData);
    expect(textData.text).toEqual('mailto:user@layer.com sent an email to mailto:user+user@layer.come and instead it was received by mailto:user@layer.com');
  });
});