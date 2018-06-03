/* eslint-disable */
describe("Autolinker Text Handler", function() {
  var handler;
  beforeEach(function() {
    handler = Layer.UI.handlers.text.handlers.autolinker.handler;
  });

  it("Should replace all links with anchor tags", function() {
    var textData = {
      text: "http://layer.com sent an email to https://layer.com and instead it was received by http://layer.com/path/?query=string&query=string",
      afterText: []
    };
    handler(textData);
    expect(textData.text).toEqual("<a href='http://layer.com' target='_blank' class='layer-parsed-url'>layer.com</a> sent an email to <a href='https://layer.com' target='_blank' class='layer-parsed-url'>layer.com</a> and instead it was received by <a href='http://layer.com/path/?query=string&query=string' target='_blank' class='layer-parsed-url'>layer.com/path</a>");
  });

  it("Should replace all long links and extraneous path and query strings with shortened links", function() {
    var textData = {
      text: "http://layer.com/abcdef/ghijk/lmnop/qrst/uvwx/yzAB sent an email to https://layer.com/abcdef#abcd/efgh and instead it was received by http://layer.com/path/?query=string&query=string",
      afterText: []
    };
    handler(textData);

    expect(textData.text).toEqual("<a href='http://layer.com/abcdef/ghijk/lmnop/qrst/uvwx/yzAB' target='_blank' class='layer-parsed-url'>layer.com/abcdef/.../yzAB</a> sent an email to <a href='https://layer.com/abcdef#abcd/efgh' target='_blank' class='layer-parsed-url'>layer.com/abcdef</a> and instead it was received by <a href='http://layer.com/path/?query=string&query=string' target='_blank' class='layer-parsed-url'>layer.com/path</a>");
  });

  it("Should replace tel:number with anchor tag", function() {
    var textData = {
      text: "tel:1234567890 called tel:0987654321",
      afterText: []
    };
    handler(textData);

    expect(textData.text).toEqual("<a href='tel:1234567890' target='_blank' class='layer-parsed-url'>1234567890</a> called <a href='tel:0987654321' target='_blank' class='layer-parsed-url'>0987654321</a>");
  });

  it("Should replace mailto:email with anchor tag", function() {
    var textData = {
      text: "mailto:1234567890 emailed mailto:0987654321",
      afterText: []
    };
    handler(textData);

    expect(textData.text).toEqual("<a href='mailto:1234567890' target='_blank' class='layer-parsed-url'>1234567890</a> emailed <a href='mailto:0987654321' target='_blank' class='layer-parsed-url'>0987654321</a>");

  });
});