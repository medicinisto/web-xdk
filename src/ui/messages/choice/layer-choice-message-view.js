/**
 * UI for a Choice Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-choice-message-view';
 * ```
 *
 * @class Layer.UI.messages.ChoiceMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */

/**
 * To customize the Response Message text or prevent the Response Message from being sent, use this event.
 *
 * To prevent the Response Message from being sent (perhaps you want to create your own Response Message?) call `evt.preventDefault()`:
 *
 * ```
 * document.body.addEventListener('layer-choice-model-generate-response-message', evt) {
 *     evt.preventDefault();
 * });
 * ```
 *
 * To customize the text of the Response Message call `evt.detail.returnValue()`
 *
 * ```
 * document.body.addEventListener('layer-choice-model-generate-response-message', evt) {
 *  evt.detail.returnValue(`${evt.detail.name}: ${client.user.displayName} has ${evt.detail.action} ${evt.detail.choice.text}`);
 * });
 * ```
 *
 * @event layer-choice-model-generate-response-message
 * @property {CustomEvent} evt
 * @property {Layer.Core.LayerEvent} evt.detail
 * @property {Object} evt.detail.choice           A single choice from the array of choices for the Choice Model
 * @property {Layer.UI.messages.ChoiceMessageModel} evt.detail.model   The Choice Model that is reporting on the newly selected answer
 * @property {String} evt.detail.text             The proposed text to send as the renderable part of the Response Message
 * @property {String} evt.detail.action           One of "selected" or "deselected" indicating whether the user action selected or deselected a Choice
 * @property {String} evt.detail.name             Proposed name for the Choice Model in order to describe what the user was answering. May be empty string.
 */
import { client } from '../../../settings';
import { registerComponent } from '../../components/component';
import Constants from '../../constants';

import MessageViewMixin from '../message-view-mixin';
import '../../components/layer-action-button';
import './layer-choice-label-message-view';
import './layer-choice-message-model';

registerComponent('layer-choice-message-view', {
  mixins: [MessageViewMixin],
  template: `
    <div layer-id='label' class='layer-choice-message-view-label'></div>
    <div layer-id='choices' class='layer-choice-message-view-choices'></div>
  `,
  style: `
  layer-choice-message-view .layer-choice-message-view-choices {
    display: flex;
    flex-direction: column;
  }

  `,
  properties: {

    /**
     * Use a Titled Display Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-titled-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-titled-message-view-container',
    },

    // See parent definition
    widthType: {
      value: Constants.WIDTH.FLEX,
    },
  },
  methods: {
    /**
     * Provide a CSS class to the `<layer-titled-message-view-container />` to help it select an image to render.
     *
     * @method getIconClass
     * @protected
     */
    getIconClass() {
      return 'layer-poll-message-view-icon';
    },

    /**
     * Provide a title to the `<layer-titled-message-view-container />`.
     *
     * @method getTitle
     * @protected
     */
    getTitle() {
      return this.model.title;
    },

    /**
     * After the UI Component has been created (lifecycle method) generate all necessary `<layer-action-button />` components.
     *
     * Note that this may need to be moved to onRerender to handle Message Editing that could add/remove choices.
     *
     * @method onAfterCreate
     */
    onAfterCreate() {
      this.nodes.label.innerText = this.model.label;
      this.model.choices.forEach((choice) => {
        this.createElement('layer-action-button', {
          text: choice.text,
          tooltip: choice.tooltip,
          event: 'layer-choice-select',
          data: { id: choice.id },
          // icon: choice.icon,
          parentNode: this.nodes.choices,
        });
      });
    },

    /**
     * Whenever the component changes (lifecycle method), update all choices.
     *
     * The model supports the notion that text and tooltip may vary based on the Choice's selection state, so any change
     * in state may require an update to the text and tooltip.  Obviously changes in state can also impact
     * a given choice's selected and disabled states.
     *
     * @method onRerender
     */
    onRerender() {
      if (!this.model.allowReselect) {
        this.toggleClass('layer-choice-message-view-complete', this.model.selectedAnswer);
      }

      this.model.choices.forEach((choice, index) => {
        const button = this.nodes.choices.childNodes[index];
        button.text = this.model.getText(index);
        button.tooltip = this.model.getTooltip(index);
        button.selected = this.model.isSelectedIndex(index);
        button.disabled = !this.model.isSelectionEnabledFor(index);
      });
    },

    /**
     * MIXIN HOOK: Select the specified Choice.
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'layer-choice-message-view': {
     *       methods: {
     *         onChoiceSelect: {
     *           // Conditional in a mixin prevents the method from being run if it returns false
     *           conditional: function(data) {
     *             if (data.id === 'frodo-the-dodo') return false;
     *             return true;
     *           }
     *         }
     *       }
     *     }
     *   }
     * });
     * ```
     *
     * @param {Object} data
     * @param {String} data.id   ID of the selected Choice
     * @method onChoiceSelect
     * @private
     */
    onChoiceSelect(data) {
      this.model.selectAnswer(data);
    },

    /**
     * When the user selects a `<layer-action-button />` representing a choice, it calls this `runAction` method to handle the selection event.
     *
     * Selecting a choice should result in:
     *
     * * a call to this.model.selectAnswer()
     * * Triggering a UI event that the application can intercept
     *
     * @param {String} event   The actionEvent for the choice; all choices are "layer-choice-select"
     * @param {Object} data   Data to run this action with; of the form `{id: answerId}`
     */
    runAction({ event, data }) {
      if (event === 'layer-choice-select') {
        if (!this.model.isSelectionEnabled()) return;
        this.onChoiceSelect(data);

        const rootPart = this.model.message.getPartsMatchingAttribute({ role: 'root' })[0];
        const rootModel = client.getMessageTypeModel(rootPart.id);
        this.trigger(this.model.responseName, {
          model: this.model,
          data: this.model,
          rootModel,
        });
      }
    },
  },
});

