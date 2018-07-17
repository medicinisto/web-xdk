/**
 * A Product model, used anywhere that you want to display simple product information.
 *
 * Typically this would be used in a Receipt Model, or to allow a user to preview and purchase a product.
 *
 * ```
 * ProductModel = client.getMessageTypeModelClassForMimeType('application/vnd.layer.product+json')
 * ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 *
 * model = new ProductModel({
 *   customData: {
 *     product_id: "Frodo-the-dodo",
 *     sku: "frodo-is-ascew"
 *   },
 *   url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
 *   currency: 'USD',
 *   price: 175,
 *   quantity: 3,
 *   brand: 'Apple',
 *   name: 'Apple 2 plus desktop computer',
 *   description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
 *   imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
 *   options: [
 *     new ChoiceModel({
 *        question: 'RAM',
 *        type: 'Label',
 *        allowReselect: true,
 *        selectedAnswer: 'large',
 *        choices: [
 *          {text:  "2K", id: "small"},
 *          {text:  "4K", id: "medium"},
 *          {text:  "8K", id: "large"},
 *        ]
 *     }),
 *     new ChoiceModel({
 *       question: 'Color',
 *       type: 'Label',
 *       allowReselect: true,
 *       selectedAnswer: 'offwhite',
 *       choices: [
 *         {text:  "Off White", id: "offwhite"},
 *         {text:  "Awful White", id: "awfwhite"}
 *       ]
 *     }),
 *   ]
 * });
 * model.send({ conversation });
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import with either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/product/layer-product-message-view';
 * import '@layerhq/web-xdk/ui/messages/product/layer-product-message-model';
 * ```
 *
 * @class Layer.UI.messages.ProductMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Core from '../../../core/namespace';

const { MessagePart, Root, MessageTypeModel } = Core;

export default class ProductModel extends MessageTypeModel {
  constructor(options = {}) {
    if (!options.imageUrls) options.imageUrls = [];
    if (!options.options) options.options = [];
    super(options);
  }

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Product Message.
   *
   * @method generateParts
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   * @typescript public
   * @private
   */
  generateParts(callback) {
    const body = this.initBodyWithMetadata([
      'name', 'brand', // naming
      'description', 'imageUrls', // Rendering
      'currency', 'price', 'quantity', // Purchasing
      'url', 'title', // Action properties
    ]);
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });

    // For each option, generate a Choice Model and add a MessagePart for it.
    if (this.options.length === 0) {
      callback([this.part]);
    } else {
      let count = 0;
      const parts = [this.part];
      this.options.forEach((option) => {
        this.addChildModel(option, 'options', (newParts) => {
          count++;
          newParts.forEach(p => parts.push(p));
          if (count === this.options.length) callback(parts);
        });
      });
    }
  }

  /**
   * On receiving a new Layer.Core.Message, parse it and setup this Model's properties.
   *
   * @method parseModelChildParts
   * @protected
   */
  parseModelChildParts({ parts, init }) {
    super.parseModelChildParts({ parts, init });

    // Read the options Message Parts, generate models for them and store them in the options property
    this.options = this.getModelsByRole('options');
  }

  /**
   * If a title is needed, return the name; typically not used.
   *
   * @method getTitle
   * @returns {String}
   */
  getTitle() {
    return this.name;
  }

  /**
   * Get the formatted price as represented by the currency and price properties.
   *
   * @method getFormattedPrice
   * @returns {String}
   */
  getFormattedPrice() {
    if (this.price === null) return '';
    return Number(this.price).toLocaleString(navigator.language, {
      currency: this.currency,
      style: 'currency',
    });
  }

  /**
   * If sending a Response Message concerning this product, come up with a name
   * to describe this product.
   *
   * ```
   * UserX selected "Red" for "Product Name"
   * ```
   *
   * @method getChoiceModelResponseTopic
   * @protected
   * @returns {String}
   */
  getChoiceModelResponseTopic() {
    return this.name;
  }
}

/**
 * Name of the product.
 *
 * @property {String} name
 */
ProductModel.prototype.name = '';

/**
 * Name of the product's brand.
 *
 * @property {String} brand
 */
ProductModel.prototype.brand = '';

/**
 * Array of image urls; typically only the first one renders.
 *
 * @property {String[]} imageUrls
 */
ProductModel.prototype.imageUrls = null;

/**
 * Description of the Product.
 *
 * @property {String} description
 */
ProductModel.prototype.description = '';

/**
 * Array of Choice Models representing Options that have been selected for the Product.
 *
 * A details view might allow users to change the selected options; but the Basic View does not.
 *
 * @property {Layer.UI.messages.ChoiceMessageModel[]} options
 */
ProductModel.prototype.options = null;

/**
 * Currency to use, based on ISO 4217 standard.
 *
 * @property {String} [currency=USD]
 */
ProductModel.prototype.currency = 'USD';

/**
 * Numeric price for this product.
 *
 * @property {Number} price
 */
ProductModel.prototype.price = null;

/**
 * Quantity of this product that is represented by this Message.
 *
 * @property {Number} quantity
 */
ProductModel.prototype.quantity = 1;

/**
 * Url to more details for this product
 *
 * @property {String} url
 */
ProductModel.prototype.url = '';

/**
 * The default action when selecting this Message is to trigger an `open-url` action to show
 * details referenced by the `url` property.
 *
 * @static
 * @property {String} [defaultAction=open-url]
 */
ProductModel.defaultAction = 'open-url';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=${name}]
 */
ProductModel.SummaryTemplate = '${name}'; // eslint-disable-line no-template-curly-in-string

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Product]
 */
ProductModel.LabelSingular = 'Product';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Products]
 */
ProductModel.LabelPlural = 'Products';

/**
 * The MIME Type recognized by and used by the Product Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.product+json]
 */
ProductModel.MIMEType = 'application/vnd.layer.product+json';

/**
 * The UI Component to render the Product Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-product-message-view]
 */
ProductModel.messageRenderer = 'layer-product-message-view';

// Finish setting up the Class
Root.initClass.apply(ProductModel, [ProductModel, 'ProductModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(ProductModel, 'ProductModel');
