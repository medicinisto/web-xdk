/**
 * This model represents a Receipt Message.
 *
 * A Receipt Message contains one or more Products, as well as billing information.
 *
 * ```
 * ReceiptModel = Layer.Core.Client.getMessageTypeModelClass('ReceiptModel');
 * ProductModel = Layer.Core.Client.getMessageTypeModelClass('ProductModel');
 * model = new ReceiptModel({
 *    currency: 'USD',
 *    order: { number: 'FRODO-DODO-ONE'  },
 *    paymentMethod: "VISA ****1234",
 *    summary: { total_cost: 350.02 },
 *    shippingAddress: new LocationModel({
 *       city: 'San Francisco',
 *       name: 'Layer Inc',
 *       postalCode: '94107',
 *       administrativeArea: 'CA',
 *       street1: '655 4th st'
 *    }),
 *    items: [ new ProductModel(...)]
 * });
 * model.send({ conversation });
 * ```
 *
 * A Receipt Message could be embedded within a Buttons Message to add a
 * 'Confirm' button or 'Procede with Purchase' button or other ways of changing
 * this from a Receipt into a Confirmation Message.
 *
 * ### Importing
 *
 * Not included with the standard build. Import with either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/receipt/layer-receipt-message-view';
 * import '@layerhq/web-xdk/ui/messages/receipt/layer-receipt-message-model';
 * ```
 *
 * @class Layer.UI.messages.ReceiptMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Core, { MessagePart, MessageTypeModel, Root } from '../../../core/namespace';
import Util from '../../../utils';
import '../location/layer-location-message-model';

class ReceiptModel extends MessageTypeModel {

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Receipt Message.  It will generate one MessagePart per
   * Product Message, and one MessagePart per Location Message.
   *
   * @method generateParts
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  generateParts(callback) {
    // Put the basic fields into the body
    const body = this.initBodyWithMetadata(['createdAt', 'currency', 'discounts', 'paymentMethod', 'order', 'title']);

    // Copy in a snake cased version of the summary fields
    body.summary = {};
    Object.keys(this.summary).forEach((keyName) => {
      const newKeyName = Util.hyphenate(keyName, '_');
      body.summary[newKeyName] = this.summary[keyName];
    });

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    const parts = [this.part];

    const expectedCount = this.constructor.modelSet.filter(modelDef => this[modelDef.model]).length;
    let currentCount = 0;

    // For each field represented by a submodel, add them to the model and to the parts.
    this.constructor.modelSet.forEach((modelDef) => {
      if (this[modelDef.model]) {
        if (modelDef.model === 'items') {
          // For each product item, add it to this model, and generate parts to add to our parts array
          this.items.forEach((item) => {
            this.addChildModel(item, modelDef.role, moreParts => moreParts.forEach(p => parts.push(p)));
          });
          currentCount++;
          if (currentCount === expectedCount) callback(parts);
        } else {
          // For each location message, and other model, add a pointer to it from this model, and
          // add it to our parts array.
          this.addChildModel(this[modelDef.model], modelDef.role, (moreParts) => {
            moreParts.forEach(p => parts.push(p));
            currentCount++;
            if (currentCount === expectedCount) callback(parts);
          });
        }
      }
    });
  }

  // See parent class
  parseModelPart({ payload, isEdit }) {
    super.parseModelPart({ payload, isEdit });

    this.createdAt = new Date(this.createdAt);

    // Turn the summary into a camelCased summary object
    const summary = payload.summary;
    this.summary = {
      totalCost: 0,
    };
    if (summary) {
      Object.keys(summary).forEach((propertyName) => {
        this.summary[Util.camelCase(propertyName)] = summary[propertyName];
      });
    }
  }

  parseModelChildParts({ parts, init }) {
    // Gather all of the product items for this Receipt Message, and generate models for them
    this.items = this.getModelsByRole('product-item');

    // Gather addresses from this Receipt Message, and generate models for them
    this.billingAddress = this.getModelsByRole('billing-address')[0];
    this.shippingAddress = this.getModelsByRole('shipping-address')[0];
    /* this.merchantModel = this.getModelsByRole('merchant');
    this.recipientModel = this.getModelsByRole('recipient'); */
  }

  __getItemCount() {
    return this.items.length;
  }

  __getItemLabel() {
    return this.items.length > 1 ? ReceiptModel.ItemPlural : ReceiptModel.ItemSingular;
  }
}

/**
 * Number of Product Items in this receipt.
 *
 * @property {Number} itemCount
 */
ReceiptModel.prototype.itemCount = 0;

/**
 * Label to use to describe the items in this receipt.
 *
 * @property {String} [itemLabel=item/items]
 */
ReceiptModel.prototype.itemLabel = 0;

/**
 * Location Model representing the billing address for this receipt.
 *
 * Not currently rendered.
 *
 * @property {Layer.UI.messages.LocationMessageModel} billingAddress
 */
ReceiptModel.prototype.billingAddress = null;

/**
 * Location Model representing the shipping address for this receipt.
 *
 * @property {Layer.UI.messages.LocationMessageModel} shippingAddress
 */
ReceiptModel.prototype.shippingAddress = null;

/**
 * Timestamp for when this Receipt Message was created.
 *
 * NOTE: typically, Layer.Core.Message.sentAt should suffice, however,
 * there are various ways that a Receipt could be created well before it
 * became a Layer Message.
 *
 * @property {String} createdAt    ISO Date string (`new Date().toISOString()`)
 */
ReceiptModel.prototype.createdAt = null;

/**
 * Currency to use, based on ISO 4217 standard.
 *
 * @property {String} [currency=USD]
 */
ReceiptModel.prototype.currency = 'USD';

/**
 * Array of adjustments to the price.
 *
 * Adjustments are an array of `name` and `amount` fields:
 *
 * ```
 * receiptModel.discounts = [
 *  {
 *    name: "Cheapskate Discount",
 *    amount: 10
 *  }, {
 *    name: "Just wanted to close the deal",
 *    amount: 2
 *  }
 * ];
 * ```
 *
 * None of these values are currently rendered.
 *
 * @property {Object[]} discounts
 * @property {String} discounts.name     Descriptive name of the discount
 * @property {String} discounts.amount   Number to subtract from the price
 */
ReceiptModel.prototype.discounts = null;

/**
 * Array of Product Models that are being purchased as part of this Receipt Message.
 *
 * ```
 * receiptModel.items = [
 *    new ProductModel({
 *         price: 525,
 *         quantity: 1,
 *         currency: "USD",
 *         brand: "Prison Garb Inc",
 *         name: "Formal Strait Jacket",
 *         description: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
 *         imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ]
 *     })
 * ];
 * ```
 *
 * @property {Layer.UI.messages.ProductMessageModel[]} items
 */
ReceiptModel.prototype.items = null;

/**
 * Payment method is a simple string representation to hint at how a purchase will be made.
 *
 * Typically this would be the credit card type and 4 digits of the card number.  However,
 * any string is acceptable.
 *
 * ```
 * receiptModel.paymentMethod = 'Paysquare xxxx-3939';
 * ```
 *
 * @property {String} paymentMethod
 */
ReceiptModel.prototype.paymentMethod = '';

/* For use in v2 with Full Screen receipts
ReceiptModel.prototype.merchantModel = null;
ReceiptModel.prototype.recipientModel = null;
*/

/**
 * Order data, includes the `order.number` and the `order.url`.
 *
 * Both fields are optional; the `order.url` lets one open the order details in a new View.
 *
 * None of these fields are currently rendered.
 *
 * ```
 * receiptModel.order = {
 *     number: '42',
 *     url: 'https://myco.com/orders/42'
 * };
 * ```
 *
 * @property {Object} order
 * @property {String} order.number    Order Number for this Receipt
 * @property {String} order.url       URL to a detailed view of this Order
 */
ReceiptModel.prototype.order = null;

/**
 * The Order Summary contains subtotal, tax, shipping, total cost and a subtitle.
 *
 * Note that of these fields, only `summary.total_cost` is currently rendered.
 *
 * ```
 * receiptModel.summary.subtotal = 5;
 * receiptModel.summary.shippingCost = 2;
 * receiptModel.summary.totalTax = 1;
 * receiptModel.summary.totalCost = 8;
 * ```
 *
 * @property {Object} summary
 * @property {String} summary.subtotal    Initial cost to show in a details view (not currently rendered)
 * @property {String} summary.shippingCost  Shipping cost to show in a details view (not currently rendered)
 * @property {String} summary.totalTax    Taxes added to the cost, to show in a details view (not currently rendered)
 * @property {String} summary.totalCost   Total cost of the purchase, to be shown in the standard Receipt Message.
 */
ReceiptModel.prototype.summary = null;

/**
 * Custom title to show in the titlebar above the Receipt.
 *
 * By default, 'Order Confirmation' is rendered if this is left empty.
 *
 * @property {String} [title]
 */
ReceiptModel.prototype.title = '';


/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Receipt]
 */
ReceiptModel.LabelSingular = 'Receipt';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Receipts]
 */
ReceiptModel.LabelPlural = 'Receipts';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [ItemSingular=item]
 */
ReceiptModel.ItemSingular = 'item';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [ItemPlural=items]
 */
ReceiptModel.ItemPlural = 'items';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=${typeLabel} for ${itemCount} ${itemLabel}]
 */
ReceiptModel.SummaryTemplate = '${typeLabel} for ${itemCount} ${itemLabel}'; // eslint-disable-line no-template-curly-in-string


/**
 * Array of submodel definitions to use when parsing the Receipt Message.
 *
 * TODO: Generalize this for use in all Messages.
 *
 * @static
 * @property {Object[]} modelSet
 * @property {String} modelSet.model    Property name to write this submodel to `receiptModel.shippingAddress`
 * @property {String} modelSet.role     Role name of the Message Part containing the submodel data.
 */
ReceiptModel.modelSet = [
  { model: 'items', role: 'product-item' },
  { model: 'shippingAddress', role: 'shipping-address' },
  { model: 'billingAddress', role: 'billing-address' },
  { model: 'merchantModel', role: 'merchant' },
  { model: 'recipientModel', role: 'recipient' },
];

/**
 * The MIME Type recognized by and used by the Receipt Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.receipt+json]
 */
ReceiptModel.MIMEType = 'application/vnd.layer.receipt+json';

/**
 * The UI Component to render the Receipt Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-receipt-message-view]
 */
ReceiptModel.messageRenderer = 'layer-receipt-message-view';

// Finish setting up the Class
Root.initClass.apply(ReceiptModel, [ReceiptModel, 'ReceiptModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(ReceiptModel, 'ReceiptModel');

module.exports = ReceiptModel;
