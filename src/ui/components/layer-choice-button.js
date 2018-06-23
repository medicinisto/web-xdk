/**
 * A Button Set driven by a Layer.UI.messages.ChocieMessageModel.
 *
 * The main input is the {@link #model}, and any events are delivered to and handled by that model
 *
 * ### Importing
 *
 * Included directly by any Message Type View that requires it. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-choice-button';
 * ```
 *
 * @class Layer.UI.components.ChoiceButton
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from './component';
import Clickable from '../mixins/clickable';

registerComponent('layer-choice-button', {
  mixins: [Clickable],
  style: `layer-choice-button {
    display: flex;
    flex-direction: row;
    align-content: stretch;
  }
  layer-choice-button layer-action-button {
    cursor: pointer;
    flex-grow: 1;
    width: 50px; // flexbox bug
  }
  .layer-button-content > * {
    max-width: 100%;
    width: 100%;
  }
  `,
  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    /**
     * Set all choices enabled or disabled
     *
     * @property {Boolean} [disabled=false]
     */
    disabled: {
      type: Boolean,
      set(value) {
        for (let i = 0; i < this.childNodes.length; i++) this.childNodes[i].disabled = value;
      },
    },

    /**
     * The Choice Model whose options are to be rendered.
     *
     * @property {Layer.UI.messages.ChoiceMessageModel} model
     */
    model: {
      set(newModel, oldModel) {
        if (oldModel) {
          this.model.off(null, null, this);
          this.properties.buttons = [];
          this.innerHTML = '';
        }
        if (newModel) {
          newModel.on('message-type-model:change', this.onRerender, this);
          newModel.choices.forEach((choice, index) => {
            const widget = this.createElement('layer-action-button', {
              text: newModel.getText(index),
              tooltip: newModel.getTooltip(index),
              parentNode: this,
              data: { id: choice.id },
              icon: choice.icon,
            });

            const def = { widget, choice };
            this.properties.buttons.push(def);
            widget.removeClickHandler('button-click', widget);
            this.addClickHandler('button-click-' + choice.id, widget, this._onClick.bind(this, def));
            this.onRerender();
          });
        }
      },
    },
  },

  methods: {
    onCreate() {
      this.properties.buttons = [];
    },

    /**
     * Whenever the model changes, update the selection state of all buttons.
     *
     * Also update any text/tooltip whenever the model changes.
     *
     * @method onRerender
     */
    onRerender() {
      if (!this.model.allowReselect) {
        this.toggleClass('layer-choice-message-view-complete', this.model.selectedAnswer);
      }

      for (let i = 0; i < this.childNodes.length; i++) {
        const child = this.childNodes[i];
        const isSelected = this.model.isSelectedIndex(i);
        child.disabled = !this.model.isSelectionEnabled() ||
          isSelected && !this.model.allowDeselect;
        child.selected = isSelected;

        this.childNodes[i].text = this.model.getText(i);
        this.childNodes[i].tooltip = this.model.getTooltip(i);
      }
    },

    onChoiceSelect(data) {
      this.model.selectAnswer(data);
    },

    /**
     * When clicked, find the associated Layer.UI.messages.MessageViewer and call its `_runAction` method.
     *
     * @method _onClick
     * @param {Object} boundData
     * @param {Object} choice   The choice represented by this button
     * @param {Event} evt
     * @private
     */
    _onClick({ choice }, evt) {
      evt.preventDefault();
      evt.stopPropagation();

      // Select the answer
      this.onChoiceSelect(choice);

      // Trigger any other customized events as though this were an action button
      let node = this;
      while (!node.isMessageTypeView && node.parentComponent) {
        node = node.parentComponent;
      }
      if (node.messageViewer) {
        node.messageViewer._runAction({
          event: this.model.responseName,
          data: this.model,
          choice,
        });
      }
      if (evt) evt.target.blur();
    },
  },
});
