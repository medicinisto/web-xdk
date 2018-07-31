/**
  FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel')
  model = new FeedbackModel({
    title: "Experience Rooting", // Optional, defaults to Experience Rating
    prompt: "Rate your experiment 1-5 beakers", // Optional, defaults to Rate your experience 1-5 stars
    promptWait: "Waiting for more Beakers", // Optional, defaults to "Waiting for Feedback"
    responseMessage: "Feedback Message has a response", // Optional, defaults to "Rating submitted"
    placeholder: "Tell us that you love us", // Optional, defaults to "Add a comment..."
    enabledFor: "layer:///identities/user_id", // Only a single Identity is supported
   });
   model.send({ conversation });
 * ```
 *
 *### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-view';
 * ```
 *
 * @class Layer.UI.messages.FeedbackMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Settings from '../../../settings';
import Core from '../../../core/namespace';
import { CRDT_TYPES } from '../../../constants';
import { ErrorDictionary } from '../../../core/layer-error';

const { getClient } = Settings;
const { MessagePart, Root, MessageTypeModel } = Core;

export default class FeedbackModel extends MessageTypeModel {
  registerAllStates() {
    this.responses.registerState('rating', CRDT_TYPES.FIRST_WRITER_WINS);
    this.responses.registerState('comment', CRDT_TYPES.FIRST_WRITER_WINS);
    this.responses.registerState('custom_response_data', CRDT_TYPES.FIRST_WRITER_WINS);
  }

  // See parent class; generates the root message part for the feedback message
  generateParts(callback) {
    const body = this.initBodyWithMetadata([
      'title', 'prompt', 'promptWait', 'responseMessage',
      // 'summary', 'customResponseData',
      'placeholder', 'enabledFor',
    ]);
    if (!body.enabled_for) {
      throw new Error(ErrorDictionary.enabledForMissing);
    }

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    callback([this.part]);
  }

  // See parent class; parses all Response Messages and updates rating and comment properties
  parseModelResponses() {
    const rating = this.responses.getState('rating', this.enabledFor);
    if (rating) {
      this.rating = rating;
      this.comment = this.responses.getState('comment', this.enabledFor) || '';
    }
  }

  /**
   * Does this model represent something that the user can edit/interact with, or is it readonly data?
   *
   * @method isEditable
   * @returns {Boolean}
   */
  isEditable() {
    if (this.isRated) return false;
    if (this.enabledFor !== getClient().user.id) return false;
    return true;
  }

  /**
   * Send feedback submits the rating and comment to the server and shares it with other participants.
   *
   * ```
   * model.rating = 3;
   * model.comment = 'I think that everyone should see my comment';
   * model.sendFeedback();
   * ```
   *
   * @method sendFeedback
   */
  sendFeedback() {
    if (this.enabledFor !== getClient().user.id) return;

    const responseText = this.responseMessage; // this.getSummary(this.responseMessage, false);

    this.responses.addState('rating', this.rating);
    if (this.comment) this.responses.addState('comment', this.comment);
    // if (this.customResponseData) this.responses.addState('custom_response_data', this.customResponseData);
    this.responses.setResponseMessageText(responseText);
    this.responses.sendResponseMessage();
  }

  __setRating(newValue, oldValue) {
    this._triggerAsync('message-type-model:change', {
      property: 'rating',
      oldValue,
      newValue,
    });
  }

  __setComment(newValue, oldValue) {
    this._triggerAsync('message-type-model:change', {
      property: 'comment',
      oldValue,
      newValue,
    });
  }

  __getRatedAt() {
    if (this.isRated && this.responses.part) {
      return this.responses.part.updatedAt;
    } else {
      return null;
    }
  }

  __getIsRated() {
    return Boolean(this.responses.getState('rating', this.enabledFor));
  }
/*
  getSummary(template, useYou) {
    return template.replace(/(\$\{.*?\})/g, (match) => {
      const key = match.substring(2, match.length - 1);
      switch (key) {
        case 'customer':
          if (useYou && this.enabledFor === getClient().user.userId) {
            return 'You';
          } else {
            return getClient().getIdentity(this.enabledFor).displayName || FeedbackModel.anonymousUserName;
          }
        default:
          return this[key];
      }
    });
  }
*/
}

/**
 * Title to represent the Message.
 *
 * This can be customized using the Message Payload:
 *
 * ```
 * new FeedbackModel({ title: "My Title" }).send({ conversation });
 * ```
 *
 * Or by customizing the prototype:
 *
 * ```
 * FeedbackModel.prototype.title = 'My Title';
 * ```
 *
 * @property {String} [title=Experience Rating]
 */
FeedbackModel.prototype.title = 'Experience Rating';

/**
 * Prompt to show user in Large Message View to ask them to provide feedback.
 *
 * This can be customized using the Message Payload:
 *
 * ```
 * new FeedbackModel({ prompt: "I demand your feedback!" }).send({ conversation });
 * ```
 *
 * Or by customizing the prototype:
 *
 * ```
 * FeedbackModel.prototype.prompt = 'I demand your feedback!';
 * ```
 *
 * @property {String} [prompt=Rate your experience 1-5 stars]
 */
FeedbackModel.prototype.prompt = 'Rate your experience 1-5 stars';

/**
 * Prompt to show user in Large Message View to ask them to wait for the other user to provide feedback.
 *
 * This can be customized using the Message Payload:
 *
 * ```
 * new FeedbackModel({ promptWait: "I demand you wait for feedback!" }).send({ conversation });
 * ```
 *
 * Or by customizing the prototype:
 *
 * ```
 * FeedbackModel.prototype.promptWait = 'I demand you wait for feedback!';
 * ```
 *
 * @property {String} [promptWait=Waiting for Feedback]
 */
FeedbackModel.prototype.promptWait = 'Waiting for Feedback';

/**
 * Prompt to show user in Large Message View to ask them to wait for the other user to provide feedback.
 *
 * This can be customized using the Message Payload:
 *
 * ```
 * new FeedbackModel({ responseMessage: "Feedback process completed" }).send({ conversation });
 * ```
 *
 * Or by customizing the prototype:
 *
 * ```
 * FeedbackModel.prototype.responseMessage = 'Feedback process completed';
 * ```
 *
 * @property {String} [responseMessage=Rating submitted]
 */
FeedbackModel.prototype.responseMessage = 'Rating submitted';
// FeedbackModel.prototype.responseMessage = '${customer} rated the experience ${rating} stars'; // eslint-disable-line no-template-curly-in-string
// FeedbackModel.prototype.summary = '${customer} rated the experience ${rating} stars'; // eslint-disable-line no-template-curly-in-string

/**
 * Placeholder text to put in the Text Area if there is no text there and its waiting for input.
 *
 * This can be customized using the Message Payload:
 *
 * ```
 * new FeedbackModel({ placeholder: "Please write something here." }).send({ conversation });
 * ```
 *
 * Or by customizing the prototype:
 *
 * ```
 * FeedbackModel.prototype.placeholder = 'Please write something here.';
 * ```
 *
 * @property {String} [placeholder=Add a comment...]
 */
FeedbackModel.prototype.placeholder = 'Add a comment...';

/**
 * Required property for specifying which user is expected/allowed to provide the feedback; sent in the form of an Identity ID.
 *
 * This must be sent as part of any Feedback Message:
 *
 * ```
 * new FeedbackModel({ enabledFor: "layer:///identitites/frodo-the-dodo" }).send({ conversation });
 * ```
 *
 * @property {String} enabledFor
 */
FeedbackModel.prototype.enabledFor = '';


// FeedbackModel.prototype.customResponseData = null;

/**
 * Currently selected rating.
 *
 * This value may be set via user selection, but not yet sent (or currently being sent); in this case
 * you will see the local copy, but not necessarily a published value.
 *
 * @property {Number} [rating=0]
 */
FeedbackModel.prototype.rating = 0;

/**
 * Currently entered comment from the user.
 *
 * This value may be set via user entry, but not yet sent (or currently being sent); in this case
 * you will see the local copy, but not necessarily a published value.
 *
 * @property {String} comment
 */
FeedbackModel.prototype.comment = '';

/**
 * Date object representing when this feedback was completed (or null if not completed)
 *
 * @property {Date} [ratedAt=null]
 */
FeedbackModel.prototype.ratedAt = null;

/**
 * Boolean indicates if this Feedback has a rating; rating may not have yet reached the server.
 *
 * @property {Boolean} [isRated=false]
 */
FeedbackModel.prototype.isRated = false;

// FeedbackModel.anonymousUserName = 'Customer';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Feedback Request]
 */
FeedbackModel.LabelSingular = 'Feedback Request';

/**
 * Multiple instances of this type
 *
 * @static
 * @property {String} [LabelPlural=Feedback Requests]
 */
FeedbackModel.LabelPlural = 'Feedback Requests';

/**
 * The default action for the Feedback Message is to show a Large Message View.
 *
 * @static
 * @property {String} [defaultAction=layer-show-large-message]
 */
FeedbackModel.defaultAction = 'layer-show-large-message';

/**
 * Medium Message view is a `<layer-feedback-message-view />`
 *
 * @static
 * @property {String} [messageRenderer=layer-feedback-message-view]
 */
FeedbackModel.messageRenderer = 'layer-feedback-message-view';

/**
 * Large Message view is a `<layer-feedback-message-large-view />`
 *
 * @static
 * @property {String} [largeMessageRenderer=layer-feedback-message-large-view]
 */
FeedbackModel.largeMessageRenderer = 'layer-feedback-message-large-view';

/**
 * Set the MIME Type for Feedback Messages
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.feedback+json]
 */
FeedbackModel.MIMEType = 'application/vnd.layer.feedback+json';

Root.initClass.apply(FeedbackModel, [FeedbackModel, 'FeedbackModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(FeedbackModel, 'FeedbackModel');
