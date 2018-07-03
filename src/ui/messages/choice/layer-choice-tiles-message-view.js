/**
 * The Choice Message is used to present users with choices to pick from.
 *
 * A basic Choice Message can be created with:
 *
 * ```
 * ChoiceMessage = Layer.Core.Client.getMessageTypeModelClass('ChoiceMessage')
 * model = new ChoiceMessage({
 *    label: "What do you want?",
 *    choices: [
 *       {text:  "Scrambled Eggs", id: "product_id_1836"},
 *       {text:  "Coffee", id: "product_id_8746"},
 *       {text:  "More sleep", id: "product_id_0"},
 *   ],
 * });
 * model.send({ conversation });
 * ```
 *
 * @class Layer.UI.messages.ChoiceTilesMessageView
 * @extends Layer.Core.MessageTypeModel
 */
import { registerComponent } from '../../components/component';

import MessageViewMixin from '../message-view-mixin';
import '../../components/layer-action-button';

registerComponent('layer-choice-tiles-message-view', {
  mixins: [MessageViewMixin],
  template: `
    <div layer-id='question' class='layer-choice-message-view-question'></div>
    <div layer-id='answers' class='layer-choice-message-view-answers'></div>
  `,
  style: `
  layer-choice-tiles-message-view {
    display: block;
  }
  layer-choice-tiles-message-view .layer-choice-message-view-answers {

  }
  `,
  properties: {
    label: {
      value: 'Choices',
    },
  },
  methods: {

    onAfterCreate() {
      this.nodes.question.innerHTML = this.model.question;
      this.model.choices.forEach((choice) => {
        this.createElement('layer-action-button', {
          text: choice.text,
          event: 'layer-choice-select',
          data: { id: choice.id },
          parentNode: this.nodes.answers,
        });
      });
    },

    onRerender() {
      if (!this.model.allowReselect) {
        this.toggleClass('layer-choice-message-view-complete', this.model.selectedAnswer);
      }

      if (this.model.selectedAnswer) {
        for (let i = 0; i < this.nodes.options.childNodes.length; i++) {
          const child = this.nodes.options.childNodes[i];
          child.disabled = !this.model.allowReselect || this.model.selectedAnswer === child.data.id;
          child.selected = this.model.selectedAnswer === child.data.id;
        }
      }
    },

    _selectChoice(data) {
      this.model.selectAnswer(data);
    },

    runAction({ event, data }) {
      if (event === 'layer-choice-select') {
        this._selectChoice(data);
      }
    },
  },
});
