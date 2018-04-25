/**
 * The Button Model represents a Message Type that presents Action or Choice buttons, optionally
 * accompanying some sub-message (i.e. a Product Message, Text Message, etc...).
 *
 * The `contentModel` property is used for any content to have Buttons associated with it; this example shows
 * a simple TextModel for the Content Model, and a couple of simple action buttons.
 *
 * ```
 * TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
 * ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');
 * model = new ButtonModel({
 *   buttons: [
 *     {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"},
 *     {"type": "action", "text": "Give Holy Grail", "event": "grant-grail"}
 *   ],
 *   contentModel: new TextModel({
 *     text: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.',
 *     title: 'The Holy Hand Grenade',
 *     author: 'King Arthur'
 *   })
 * });
 * model.send({ conversation });
 * ```
 *
 * You can also create Action Buttons to use existing event definitions such as `open-url`:
 *
 * ```
 * ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');
 * model = new ButtonModel({
 *   buttons: [
 *     {"type": "action", "text": "Open Page", "event": "open-url", data: {url: "https://layer.com" }}
 *   ]
 * });
 * model.send({ conversation });
 * ```
 *
 * Finally, you can use Choice Buttons instead of or in addition to Action Buttons:
 *
 * ```
 * TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
 * ButtonModel = Layer.Core.Client.getMessageTypeModelClass('ButtonsModel');
 * model = new ButtonModel({
 *   buttons: [
 *     {"type": "action", "text": "Kill Arthur", "event": "kill-arthur"},
 *     {
 *        "type": "choice",
 *        "choices": [
 *          {"text": "Like It", "id": "like"},
 *          {"text": "Hate It", "id": "hate"},
 *        ],
 *        "data": {
 *          "responseName": "judgement-is"
 *        }
 *     }
 *   ],
 *   contentModel: new TextModel({
 *     text: 'And the Lord spake, saying, "First shalt thou take out the Holy Pin. Then shalt thou count to three, no more, no less. Three shall be the number thou shalt count, and the number of the counting shall be three. Four shalt thou not count, neither count thou two, excepting that thou then proceed to three. Five is right out! Once the number three, being the third number, be reached, then lobbest thou thy Holy Hand Grenade of Antioch towards thy foe, who, being naughty in my sight, shall snuff it.',
 *     title: 'The Holy Hand Grenade',
 *     author: 'King Arthur'
 *   })
 * });
 * model.send({ conversation });
 * ```
 *
 *
 * ### Technical Details
 *
 * Note that Choice Models are generated to represent Choice Buttons, and are unique in that they do not have a
 * Message Part that they represent.
 * That in turn means that their standard means of creating a Response Message that targets their Message Part
 * is invalid.  Instead, these Choice Models are provided with a `parentId` that points to this Model's Message Part;
 * this is used as the target for any Message Response.
 *
 * Implications:
 *
 * * A Buttons Message with multiple sets of Choice Buttons will have multiple types of responses being gathered.
 * * Each set of Choice Buttons needs to have its own `responseName` to distinguish it from other Choice Buttons
 * * The Buttons Message will have a `model.responses` property that contains all of the responses from all of its Choice Buttons
 * * In generating Choice Models, this Model will pass all of its `responses` into the Choice Model as an input.
 *
 * ### Importing
 *
 * Included with the standard build. For a custom build, import either of these:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/buttons/layer-buttons-message-view';
 * import '@layerhq/web-xdk/ui/messages/buttons/layer-buttons-message-model';
 * ```
 *
 * @class Layer.UI.messages.ButtonsMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import { Client, MessagePart, MessageTypeModel, Root, MessageTypeModels } from '../../../core/namespace';
import { hyphenate, camelCase, clone } from '../../../utils';
import ChoiceModel from '../choice/layer-choice-message-model';
import ChoiceItem from '../choice/layer-choice-message-model-item';

class ButtonsModel extends MessageTypeModel {

  constructor(options = {}) {
    options.choices = {};
    super(options);
  }

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Buttons Message.
   *
   * @method generateParts
   * @private
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  generateParts(callback) {
    this._setupButtonModels();
    this.once('message-type-model:has-new-message', () => {
      Object.keys(this.choices).forEach(choiceName => (this.choices[choiceName].message = this.message));
    }, this);
    const buttons = this.buttons.map((button) => {
      if (button.type === 'choice') {
        delete button.data.preselectedChoice; // temporary value to generate the initial response state
        const obj = clone(button);
        const data = obj.data;

        if (data) {
          obj.data = {};
          Object.keys(data).forEach((dataKey) => {
            obj.data[hyphenate(dataKey, '_')] = data[dataKey];
          });
        }
        return obj;
      } else {
        return button;
      }
    });

    // Call initBodyWithMetadata after initial_response_data has been added by the above code
    const body = this.initBodyWithMetadata([]);
    body.buttons = buttons;

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });

    // If a Content Model was provided, add it to this model and generate its Message Part(s)
    if (this.contentModel) {
      this.addChildModel(this.contentModel, 'content', (parts) => {
        this.contentModel.mergeAction(this.action);
        callback([this.part].concat(parts));
      });
    } else {
      callback([this.part]);
    }
  }

  // If this.responses.part is set then _setupButtonModels was already called
  parseMessage() {
    super.parseMessage();
    this._setupButtonModels();
  }

  parseModelChildParts({ parts, init }) {
    this.contentModel = this.getModelsByRole('content')[0] || null;
    if (this.contentModel) this.contentModel.mergeAction(this.action);
  }


  parseModelResponses() {
    super.parseModelResponses();
    this._setupButtonModels();
  }

  /**
   * For each Choice button set in the `buttons` array, setup a Layer.UI.messages.ChoiceMessageModel for it.
   *
   * Layer.UI.messages.ButtonsMessageModel.choices contains an index of all of these Choice Models.
   *
   *
   * @method _setupButtonModels
   * @private
   */
  _setupButtonModels() {
    if (!this.buttons) return;
    const choices = this.buttons.filter(button => button.type === 'choice');

    // For Each Choice Button Set:
    choices.forEach((button, index) => {
      const buttonData = button.data || {};
      button.data = {};
      Object.keys(buttonData).forEach((dataKey) => {
        button.data[camelCase(dataKey)] = buttonData[dataKey];
      });

      // Make sure that each of our Anonymous Choice Models receives the Message
      const currentChoice = this.choices[button.data.responseName || 'selection'];
      if (currentChoice && !currentChoice.message && this.message) {
        currentChoice.message = this.message;
      }

      // Generate the Choice Model if it doesn't yet exist (will eventually need to handle message updates
      // that redefine these)
      if (!currentChoice) {

        // The Choice Model will be instantiated with these properties
        const obj = {
          choices: button.choices.map(choice => new ChoiceItem(choice)),
          message: this.message,
          parentId: this.nodeId,
          responses: this.responses,
          isAnonymous: true,
          parentModel: this,
        };

        // Copy all data from button.data into the object for the Choice Model.
        // Assumes that anything in button.data is valid Choice Model properties...
        // this could be done more safely...
        Object.keys(button.data).forEach(key => (obj[key] = button.data[key]));

        // Generate the model and add it to this.choices[model.responseName]
        const model = new ChoiceModel(obj);

        this.choices[model.responseName] = model;

        // Any change in state for the anonymous Choice model will trigger a change event on this Button Model
        model.on('message-type-model:change', evt => this.trigger('message-type-model:change', evt));

        // Update the preselectedChoice based on any responses
        if (this.responses.part) {
          model.responses.parseResponsePart(this.responses.part);
          model.parseModelResponses();
        }
      } else if (this.responses.part) {
        const model = this.choices[button.data.responseName || 'selection'];
        model.responses.parseResponsePart(this.responses.part);
        model.parseModelResponses();
      }
    });
  }

  // Used by Layer.UI.messages.StandardMessageViewContainer which will be very unlikely to ever wrap a Buttons Message
  getTitle() { return this.contentModel ? this.contentModel.getTitle() : ''; }
  getFooter() { return this.contentModel ? this.contentModel.getFooter() : ''; }
  getDescription() { return this.contentModel ? this.contentModel.getDescription() : ''; }

  // Used to render Last Message in the Conversation List
  getOneLineSummary() {
    if (this.contentModel) {
      return this.contentModel.getOneLineSummary();
    } else {
      return this.buttons.length > 1 || this.buttons[0].type === 'choice' && this.buttons[0].choices.length > 1 ?
        this.constructor.LabelPlural : this.constructor.LabelSingular;
    }
  }

  getChoiceModelResponseTopic() {
    if (this.contentModel && this.contentModel.getChoiceModelResponseTopic) {
      return this.contentModel.getChoiceModelResponseTopic();
    }
    return '';
  }
}


/**
 * Array of button descriptions that will be rendered for this Message.
 *
 * @property {Object[]} buttons
 */
ButtonsModel.prototype.buttons = null;

/**
 * Optional Message Model that will be wrapped by this Message.
 *
 * @property {Layer.Core.MessageTypeModel} contentModel
 */
ButtonsModel.prototype.contentModel = null;

/**
 * Hash of Layer.UI.messages.ChoiceMessageModel Models representing all of the Choice Button Sets.
 *
 * Hash is indexed by each Choice Button Set's `responseName` property.  This means that you can
 * access the state of any Choice Button Set using that name:
 *
 * ```
 * alert('Selected id is ' + buttonsModel.choices[myResponseName].selectedChoice);
 * ```
 *
 * @property {Object} choices
 */
ButtonsModel.prototype.choices = null;

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Button]
 */
ButtonsModel.LabelSingular = 'Button';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Buttons]
 */
ButtonsModel.LabelPlural = 'Buttons';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
ButtonsModel.SummaryTemplate = '';

/**
 * The MIME Type recognized by and used by the Buttons Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.buttons+json]
 */
ButtonsModel.MIMEType = 'application/vnd.layer.buttons+json';

/**
 * The UI Component to render the Buttons Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-buttons-message-view]
 */
ButtonsModel.messageRenderer = 'layer-buttons-message-view';

// Register the Class
Root.initClass.apply(ButtonsModel, [ButtonsModel, 'ButtonsModel', MessageTypeModels]);

// Register the Message Model Class with the Client
Client.registerMessageTypeModelClass(ButtonsModel, 'ButtonsModel');

module.exports = ButtonsModel;
