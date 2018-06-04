/**
 * UI for a Buttons Message.
 *
 * ### Importing
 *
 * Included with the standard build. For a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/buttons/layer-buttons-message-view';
 * ```
 *
 * @class Layer.UI.messages.ButtonsView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import '../../components/layer-action-button';
import '../../components/layer-choice-button';
import MessageViewMixin from '../message-view-mixin';
import './layer-buttons-message-model';
import { logger } from '../../../utils';

registerComponent('layer-buttons-message-view', {
  template: `
    <div class="layer-button-content" layer-id="content"></div>
    <div class="layer-button-list" layer-id="buttons"></div>
  `,
  style: `layer-buttons-message-view {
    display: flex;
    flex-direction: column;
  }
  layer-buttons-message-view .layer-button-content {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
  }
  .layer-button-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  }
  `,
  mixins: [MessageViewMixin],
  properties: {

    /**
     * Button Messages use whatever its content view's preferred max width is... or 350.
     *
     * @property {Number} [maxWidth=350]
     */
    maxWidth: {
      noGetterFromSetter: true,
      value: 350,
      get() {
        if (this.properties.contentView) {
          return this.properties.contentView.nodes.ui.maxWidth; // may not have a value
        } else {
          return this.properties.maxWidth;
        }
      },
    },

    /**
     * Button Messages use whatever its content view's preferred min width is
     *
     * @property {Number} [minWidth]
     */
    minWidth: {
      noGetterFromSetter: true,
      get() {
        if (this.properties.contentView) {
          return this.properties.contentView.nodes.ui.minWidth; // may not have a value
        } else {
          return this.properties.minWidth;
        }
      },
      set(value) {
        if (this.properties.contentView) {
          this.properties.contentView.minWidth = value;
        }
      },
    },
  },
  methods: {
    onCreate() {
      this.addEventListener('message-width-change', this._handleContentWidthChange.bind(this));
    },

    /**
     * After creating the component (Lifecycle method) initialize the sub-model if present.
     *
     * @method onAfterCreate
     */
    onAfterCreate() {

      // Either there is a Content Model for this Message in which case genereate a Viewer for it...
      // or flag this Message UI as having no-content
      if (this.model.contentModel) {
        this.properties.contentView = this.createElement('layer-message-viewer', {
          model: this.model.contentModel,
          parentNode: this.nodes.content,
          name: 'subviewer',
        });
        this.minWidth = this.minWidth;
        this.maxWidth = this.maxWidth;
        if (this.properties.contentView.style.width) {
          this.messageViewer.width = parseInt(this.properties.contentView.style.width, 10);
          this.style.width = this.properties.contentView.style.width;
        }
      } else {
        this.classList.add('layer-button-card-no-content');
      }

      // For each button (or button-set) in the Button Model's buttons array, add them to the UI
      this.model.buttons.forEach((button) => {
        let widget;
        let model;

        // If any button is actually a set of buttons all on a single row, insure a reasonable minimum width
        // by adding a css class
        if ('choices' in button && button.choices.length > 1) {
          this.parentComponent.classList.add('layer-button-card-with-choices');
        }

        switch (button.type) {
          // Generate an Action Button with the specified text, tooltip, event and event data
          case 'action':
            widget = this.createElement('layer-action-button', {
              text: button.text,
              tooltip: button.tooltip,
              event: button.event,
              data: button.data,
            });
            break;
          case 'choice':
            // Generate a Choice Button (which will generate a set of its own buttons) and pass it
            // the model representing the Choice.
            model = this.model.choices[button.data.responseName || 'selection'];
            if (model) {
              widget = this.createElement('layer-choice-button', {
                model,
              });
            } else {
              logger.error('LAYER-BUTTONS-MESSAGE-VIEW: Failed to find a Choice Model to render');
            }
            break;
        }
        this.nodes.buttons.appendChild(widget);
      });
    },

    _handleContentWidthChange() {
      if (this.properties.contentView) {
        if (this.properties.contentView.style.width) {
          this.messageViewer.width = parseInt(this.properties.contentView.style.width, 10);
          this.style.width = this.properties.contentView.style.width;
        }
      }
    },

    /**
     * Any time there is a model change, this lifecycle method is called.
     *
     * In case the change contains an update to the Choice Message Responses,
     * update each Choice Model's Responses object
     *
     * TODO: This looks wrong, the Button Model should update the Choice Models,
     *       and the Choice Models should trigger a change event to rerender the Choice Buttons.
     *       Investigate Further.
     *
     * @method onRerender
     */
    onRerender() {
      for (let i = 0; i < this.nodes.buttons.childNodes.length; i++) {
        const node = this.nodes.buttons.childNodes[i];
        if (node.tagName === 'LAYER-CHOICE-BUTTON') {
          node.model.responses = this.model.responses;
        }
      }
    },

    /**
     * This is called by Layer.UI.handlers.message.MessageViewer._runAction when the user clicks on the Message UI.
     *
     * On clicking the Message UI, either a button has been clicked in which case this method is not called,
     * or else we deliver the click event to the subviewer if it exists, or else tell the
     * MessageViewer's _runAction method to handle it on its own.
     *
     * @param {Object} action
     * @param {String} action.event   Event name
     * @param {Object} action.data    Data to use when processing the event, in addition to the model's data
     */
    runAction(action) {
      if (this.nodes.subviewer) {
        this.nodes.subviewer._runAction(action);
        return true;
      }
    },
  },
});
