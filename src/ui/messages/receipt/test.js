/* eslint-disable */
describe('Receipt Message Components', function() {
  var ReceiptModel, ProductModel, ChoiceModel, LocationModel;
  var conversation, message;
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

    ReceiptModel = Layer.Core.Client.getMessageTypeModelClass("ReceiptModel");
    ProductModel = Layer.Core.Client.getMessageTypeModelClass("ProductModel");
    ChoiceModel = Layer.Core.Client.getMessageTypeModelClass("ChoiceModel");
    LocationModel = Layer.Core.Client.getMessageTypeModelClass("LocationModel");

    Layer.Utils.defer.flush();
    jasmine.clock().tick(800);
    jasmine.clock().uninstall();
  });


  afterEach(function() {
    Layer.UI.UIUtils.animatedScrollTo = restoreAnimatedScrollTo;
    if (client) {
      client.destroy();
      client = null;
    }
    if (testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot);
      if (testRoot.firstChild && testRoot.firstChild.destroy) testRoot.firstChild.destroy();
    }
  });

  describe("Model Tests", function() {
    it("Should create an appropriate Message", function() {
      var model = new ReceiptModel({
        createdAt: new Date("10/10/2010").toISOString(),
        currency: "EUR",
        discounts: {
          hey: 'ho'
        },
        paymentMethod: "VISA-INVALID",
        order: {
          number: 'FRODO-DODO-ONE'
        },
        summary: {
          subtitle: 'Your Purchase is Complete',
          shippingCost: 350.01,
          totalTax: 0.01,
          totalCost: 350.02
        },
        shippingAddress: new LocationModel({
          title: "Shipping Address",
          city: 'San Francisco',
          postalCode: '94107',
          administrativeArea: 'CA',
          street1: '655 4th st'
        }),
        billingAddress:  new LocationModel({
          title: "Billing Address",
          city: 'San Francisco',
          postalCode: '94107',
          administrativeArea: 'CA',
          street1: '655 4th st'
        }),
        items: [
          new ProductModel({
            name: "a",
            brand: "b",
            imageUrls: ["https://layer.com/about/c"],
            description: "e",
            options: [
              new ChoiceModel({enabledFor: client.user.id, choices: [{text: "c-one", id: "c1"}, {text: "c-two", id: "c2"}]}),
              new ChoiceModel({enabledFor: client.user.id, choices: [{text: "d-one", id: "d1"}, {text: "d-two", id: "d2"}]})
            ],
            currency: "doh",
            price: "f",
            quantity: 3,
            url: "https://layer.com/about",
            action: {
              event: "open-product"
            }
          })
        ]
      });

      model.generateMessage(conversation, function(m) {
        message = m;
      });
      expect(message.parts.size).toEqual(6);
      var rootPart = message.getRootPart();
      var choiceItems = message.getPartsMatchingAttribute({'role': 'options'});
      var productItems = message.getPartsMatchingAttribute({'role': 'product-item'});
      var shippingItems = message.getPartsMatchingAttribute({'role': 'shipping-address'});
      var billingItems = message.getPartsMatchingAttribute({'role': 'billing-address'});

      expect(rootPart.mimeType).toEqual(ReceiptModel.MIMEType);
      expect(JSON.parse(rootPart.body)).toEqual({
        created_at: new Date("10/10/2010").toISOString(),
        currency: "EUR",
        discounts: {
          hey: 'ho'
        },
        payment_method: "VISA-INVALID",
        order: {
          number: 'FRODO-DODO-ONE'
        },
        summary: {
          subtitle: 'Your Purchase is Complete',
          shipping_cost: 350.01,
          total_tax: 0.01,
          total_cost: 350.02
        },
      });

      expect(productItems[0].mimeType).toEqual(ProductModel.MIMEType);
      expect(JSON.parse(productItems[0].body).name).toEqual("a");

      expect(choiceItems[0].mimeType).toEqual(ChoiceModel.MIMEType);
      expect(JSON.parse(choiceItems[0].body)).toEqual({
        enabled_for: client.user.id,
        choices: [{text: "c-one", id: "c1"}, {text: "c-two", id: "c2"}]
      });

      expect(choiceItems[1].mimeType).toEqual(ChoiceModel.MIMEType);
      expect(JSON.parse(choiceItems[1].body)).toEqual({
        enabled_for: client.user.id,
        choices: [{text: "d-one", id: "d1"}, {text: "d-two", id: "d2"}]
      });

      expect(shippingItems[0].mimeType).toEqual(LocationModel.MIMEType);
      expect(JSON.parse(shippingItems[0].body).title).toEqual("Shipping Address");

      expect(billingItems[0].mimeType).toEqual(LocationModel.MIMEType);
      expect(JSON.parse(billingItems[0].body).title).toEqual("Billing Address");
    });

    it("Should instantiate a Model from a Message ", function() {
      var uuid1 = Layer.Utils.generateUUID();
      var uuid2 = Layer.Utils.generateUUID();
      var uuid3 = Layer.Utils.generateUUID();
      var uuid4 = Layer.Utils.generateUUID();
      var uuid5 = Layer.Utils.generateUUID();
      var uuid6 = Layer.Utils.generateUUID();
      var uuid7 = Layer.Utils.generateUUID();
      var message = conversation.createMessage({
        id: 'layer:///messages/' + uuid1,
        parts: [
          {
            id: 'layer:///messages/' + uuid1 + '/parts/' + uuid2,
            mime_type: ReceiptModel.MIMEType + '; role=root; node-id=r',
            body: JSON.stringify({
              created_at: new Date("10/10/2010").toISOString(),
              currency: "EUR",
              discounts: {
                hey: 'ho'
              },
              payment_method: "VISA-INVALID",
              order: {
                number: 'FRODO-DODO-ONE'
              },
              summary: {
                subtitle: 'Your Purchase is Complete',
                shipping_cost: 350.01,
                total_tax: 0.01,
                total_cost: 350.02
              }
            })
          },
          {
            id: 'layer:///messages/' + uuid1 + '/parts/' + uuid3,
            mime_type: ReceiptModel.MIMEType + '; role=shipping-address; parent-node-id=r',
            body: JSON.stringify({
              title: "Shipping Address",
              city: 'San Francisco',
              postalCode: '94107',
              administrative_area: 'CA',
              street1: '655 4th st'
            })
          },
          {
            id: 'layer:///messages/' + uuid1 + '/parts/' + uuid4,
            mime_type: ReceiptModel.MIMEType + '; role=billing-address; parent-node-id=r',
            body: JSON.stringify({
              title: "Billing Address",
              city: 'San Francisco',
              postalCode: '94107',
              administrative_area: 'CA',
              street1: '655 4th st'
            })
          },
          {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid5,
          mime_type: ProductModel.MIMEType + '; role=product-item; node-id=a; parent-node-id=r',
          body: JSON.stringify({
            name: "a",
            brand: "b",
            image_urls: ["c", "d"],
            description: "e",
            currency: "doh",
            price: "f",
            quantity: 3,
            url: "https://layer.com/about",
            action: {
              event: "open-product"
            }
          })
        }, {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid6,
          mime_type:  ChoiceModel.MIMEType + "; role=options; parent-node-id=a",
          body: JSON.stringify({
            enabled_for: client.user.id,
            choices: [{text: "c-one", id: "c1"}, {text: "c-two", id: "c2"}]
          })
        }, {
          id: 'layer:///messages/' + uuid1 + '/parts/' + uuid7,
          mime_type:  ChoiceModel.MIMEType + "; role=options; parent-node-id=a",
          body: JSON.stringify({
            enabled_for: client.user.id,
            choices: [{text: "d-one", id: "d1"}, {text: "d-two", id: "d2"}]
          })
        }]
      });
      var m = new ReceiptModel({
        message: message,
        part: message.getRootPart(),
      });

      expect(m.createdAt).toEqual(new Date("10/10/2010"));
      expect(m.currency).toEqual("EUR");
      expect(m.discounts).toEqual({
        hey: 'ho'
      });
      expect(m.paymentMethod).toEqual("VISA-INVALID");
      expect(m.order).toEqual({
        number: 'FRODO-DODO-ONE'
      });
      expect(m.summary).toEqual({
        subtitle: 'Your Purchase is Complete',
        shippingCost: 350.01,
        totalTax: 0.01,
        totalCost: 350.02
      });
      expect(m.shippingAddress.title).toEqual("Shipping Address");
      expect(m.billingAddress.title).toEqual("Billing Address");
      expect(m.items[0].name).toEqual("a");
      expect(m.items[0].options[0].choices).toEqual([
        jasmine.objectContaining({text: "c-one", id: "c1"}),
        jasmine.objectContaining({text: "c-two", id: "c2"})
      ]);
      expect(m.items[0].options[1].choices).toEqual([
        jasmine.objectContaining({text: "d-one", id: "d1"}),
        jasmine.objectContaining({text: "d-two", id: "d2"})
      ]);
    });

  });

  describe("View Tests", function() {
    var el, message, model;
    beforeEach(function() {
      el = document.createElement('layer-message-viewer');
      testRoot.appendChild(el);

      model = new ReceiptModel({
        createdAt: new Date("10/10/2010").toISOString(),
        currency: "EUR",
        discounts: {
          hey: 'ho'
        },
        paymentMethod: "VISA-INVALID",
        order: {
          number: 'FRODO-DODO-ONE'
        },
        summary: {
          subtitle: 'Your Purchase is Complete',
          shippingCost: 350.01,
          totalTax: 0.01,
          totalCost: 350.02
        },
        shippingAddress: new LocationModel({
          title: "Shipping Address",
          city: 'San Francisco',
          postalCode: '94107',
          administrativeArea: 'CA',
          street1: '655 4th st'
        }),
        billingAddress:  new LocationModel({
          title: "Billing Address",
          city: 'San Francisco',
          postalCode: '94107',
          administrativeArea: 'CA',
          street1: '655 4th st'
        }),
        items: [
          new ProductModel({
            name: "a",
            brand: "b",
            imageUrls: ["https://layer.com/about/c"],
            description: "e",
            options: [
              new ChoiceModel({enabledFor: client.user.id, choices: [{text: "c-one", id: "c1"}, {text: "c-two", id: "c2"}]}),
              new ChoiceModel({enabledFor: client.user.id, choices: [{text: "d-one", id: "d1"}, {text: "d-two", id: "d2"}]})
            ],
            currency: "doh",
            price: "f",
            quantity: 3,
            url: "https://layer.com/about",
            action: {
              event: "open-product"
            }
          })
        ]
      });

      model.generateMessage(conversation, function(m) {
        message = m;
      });

      el.client = client;
      el.message = message;

      Layer.Utils.defer.flush();
    });
    afterEach(function() {
      document.body.removeChild(testRoot);

      if (el) el.onDestroy();
    });

    it("Should render some properties directly", function() {

      // Message UI: contains simple properties
      expect(el.nodes.ui.nodes.products.childNodes[0].item).toBe(model.items[0]);
      expect(el.nodes.ui.nodes.products.childNodes[0].nodes.name.innerHTML).toEqual("a");
      expect(el.nodes.ui.nodes.paidWith.innerHTML).toEqual(model.paymentMethod);
      expect(el.nodes.ui.nodes.total.innerHTML).toEqual("€350.02");
    });
  });
});
