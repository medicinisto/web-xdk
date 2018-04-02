/**
  FeedbackModel = Layer.Core.Client.getMessageTypeModelClass('FeedbackModel')
  model = new FeedbackModel({
    title: "Experience Rooting", // Optional, defaults to Experience Rating
    prompt: "Rate your experiment 1-5 beakers", // Optional, defaults to Rate your experience 1-5 stars
    promptWait: "Waiting for more Beakers",

    // ${rating} extracts this.rating; ${customer} gets the customer's displayName... or "You" if rated by the customer viewing it.
    summary: "${rating} stars by ${customer}",
    // ${rating} extracts this.rating; ${customer} gets the customer's displayName (but not "You" as all users will see the same message)
    responseMessage: "Rated ${rating} beakers by ${customer}",
    placeholder: "Tell us that you love us", // Optional, defaults to "Add a comment..."
    enabledFor: "layer:///identities/user_id", // Only a single Identity is supported
    customResponseData: {hey: "ho"},
   });
   model.send({ conversation });
 * ```
 *
 *### Importing
 *
 * Not included with the standard build. Import using either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-view';
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-model';
 * ```
 *
 * @class Layer.UI.messages.FeedbackMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import { client as Client } from '../../../settings';
import Core, { MessagePart, Root, MessageTypeModel } from '../../../core';
import { CRDT_TYPES } from '../../../constants';
import { ErrorDictionary } from '../../../core/layer-error';

class FeedbackModel extends MessageTypeModel {
  registerAllStates() {
    this.responses.registerState('rating', CRDT_TYPES.FIRST_WRITER_WINS);
    this.responses.registerState('comment', CRDT_TYPES.FIRST_WRITER_WINS);
    this.responses.registerState('sent_at', CRDT_TYPES.FIRST_WRITER_WINS);
    this.responses.registerState('custom_response_data', CRDT_TYPES.FIRST_WRITER_WINS);
  }

  generateParts(callback) {
    const body = this.initBodyWithMetadata([
      'title', 'prompt', 'promptWait', 'responseMessage',
      'summary', 'placeholder', 'customResponseData', 'enabledFor',
    ]);
    if (this.enabledFor) {
      body.enabled_for = this.enabledFor;
    } else {
      throw new Error(ErrorDictionary.enabledForMissing);
    }

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    callback([this.part]);
  }

  // See parent class
  parseModelPart({ payload, isEdit }) {
    const rating = this.rating;
    const comment = this.comment;
    super.parseModelPart({ payload, isEdit });

    if (this.rating !== rating) {
      this._triggerAsync('message-type-model:change', {
        property: 'rating',
        newValue: this.rating,
        oldValue: rating,
      });
    }
    if (this.comment !== comment) {
      this._triggerAsync('message-type-model:change', {
        property: 'comment',
        newValue: this.comment,
        oldValue: comment,
      });
    }
  }

  parseModelResponses() {
    const rating = this.responses.getState('rating', this.enabledFor);
    if (rating) {
      this.rating = rating;
      this.comment = this.responses.getState('comment', this.enabledFor);
      this.sentAt = new Date(this.responses.getState('sent_at', this.enabledFor));
    }
  }

  isEditable() {
    if (this.sentAt) return false;
    if (this.enabledFor !== Client.user.id) return false;
    return true;
  }

  sendFeedback() {
    if (this.enabledFor !== Client.user.id) return;

    const responseText = this.getSummary(this.responseMessage, false);
    this.sentAt = new Date();

    this.responses.addState('rating', this.rating);
    this.responses.addState('comment', this.comment);
    this.responses.addState('sent_at', this.sentAt.toISOString());
    if (this.customResponseData) this.responses.addState('custom_response_data', this.customResponseData);
    this.responses.setResponseMessageText(responseText);
    this.responses.sendResponseMessage();

    this._triggerAsync('message-type-model:change', {
      property: 'sentAt',
      oldValue: null,
      newValue: this.sentAt,
    });
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

  getSummary(template, useYou) {
    return template.replace(/(\$\{.*?\})/g, (match) => {
      const key = match.substring(2, match.length - 1);
      switch (key) {
        case 'customer':
          if (useYou && this.enabledFor === Client.user.userId) {
            return 'You';
          } else {
            return Client.getIdentity(this.enabledFor).displayName || FeedbackModel.anonymousUserName;
          }
        default:
          return this[key];
      }
    });
  }
}

FeedbackModel.prototype.title = 'Experience Rating';
FeedbackModel.prototype.prompt = 'Rate your experience 1-5 stars';
FeedbackModel.prototype.promptWait = 'Waiting for Feedback';
FeedbackModel.prototype.summary = '${customer} rated the experience ${rating} stars'; // eslint-disable-line no-template-curly-in-string
FeedbackModel.prototype.responseMessage = '${customer} rated the experience ${rating} stars'; // eslint-disable-line no-template-curly-in-string
FeedbackModel.prototype.placeholder = 'Add a comment...';
FeedbackModel.prototype.enabledFor = '';
FeedbackModel.prototype.customResponseData = null;
FeedbackModel.prototype.rating = 0;
FeedbackModel.prototype.comment = '';
FeedbackModel.prototype.sentAt = null;
FeedbackModel.prototype.customer = '';

FeedbackModel.anonymousUserName = 'Customer';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Feedback Request]
 */
FeedbackModel.LabelSingular = 'Feedback Request';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Feedback Requests]
 */
FeedbackModel.LabelPlural = 'Feedback Requests';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=${prompt}]
 */
FeedbackModel.SummaryTemplate = '${prompt}'; // eslint-disable-line no-template-curly-in-string

FeedbackModel.defaultAction = 'layer-open-expanded-view';
FeedbackModel.messageRenderer = 'layer-feedback-message-view';
FeedbackModel.messageRendererExpanded = 'layer-feedback-message-expanded-view';
FeedbackModel.MIMEType = 'application/vnd.layer.feedback+json';

Root.initClass.apply(FeedbackModel, [FeedbackModel, 'FeedbackModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(FeedbackModel, 'FeedbackModel');

module.exports = FeedbackModel;
