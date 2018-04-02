/**
 * A generalized Button, primarily for use by Message Type Views, but usable anywhere.
 *
 * The main inputs are {@link #text}, {@link #event} and {@link #data}.
 *
 * If the {@link #parentComponent} is a Layer.UI.messages.MessageViewer, it will allow the MessageViewer to handle it.
 *
 * Otherwise, it will trigger an event based on the event name provided:
 *
 * ```
 * var button = document.createElement('layer-action-button');
 * button.event = 'frodo-is-evil';
 * button.data = {
 *    name: 'frodo-the-dodo'
 * };
 *
 * button.addEventListener('frodo-is-evil', function(evt) {
 *     console.log(evt.detail.name); // outputs frodo-the-dodo
 * });
 * ```
 *
 * TODO: Make Layer.UI.components.SendButton a subclass of this.
 *
 * ### Importing
 *
 * Included directly by any Message Type View that requires it. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-action-button';
 * ```
 *
 * @class Layer.UI.components.ActionButton
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from './component';
import Clickable from '../mixins/clickable';
import { processText } from '../handlers/text/text-handlers';

registerComponent('layer-action-button', {
  mixins: [Clickable],
  template: '<button class="layer-button" layer-id="button" tab-index="0"></button>',
  style: `
    layer-action-button {
      display: flex;
      flex-direction: column;
      align-content: stretch;
    }
    layer-action-button button {
      cursor: pointer;
    }
    .layer-button-content > * {
      max-width: 100%;
      width: 100%;
    }
  `,
  properties: {
    /**
     * Button text; note that at this time, only text, no html is allowed.
     *
     * @property {String} text
     */
    text: {
      set(value) {
        this.nodes.button.innerHTML = processText(value, ['emoji']);
      },
    },

    /**
     * Button tool tip.
     *
     * @property {String} tooltip
     */
    tooltip: {
      set(value) {
        this.nodes.button.title = processText(value, ['emoji']);
      },
    },

    /**
     * Name of the event to trigger or to deliver to the Layer.UI.messages.MessageViewer.
     *
     * @property {String} event
     */
    event: {},

    /**
     * Event data to deliver with the event; can be any kind of object.
     *
     * @property {Object} data
     */
    data: {},

    /**
     * Set/get the button disabled state.
     *
     * ```
     * actionButton.disabled = !actionButton.disabled; // toggle disabled state
     * ```
     *
     * @property {Boolean} disabled
     */
    disabled: {
      type: Boolean,
      set(value) {
        this.nodes.button.disabled = value;
      },
    },

    /**
     * Adds/removes CSS class to the button which can be used to add styling/icons/etc...
     *
     * @property {String} icon
     */
    icon: {
      set(value, oldValue) {
        if (oldValue) this.classList.remove(oldValue);
        if (value) this.classList.add(value);
      },
    },

    /**
     * Get/set the selected state of the button; note that most buttons do not need a selected state and are just clicked without becoming selected.
     *
     * Being selected means getting a `layer-action-button-selected` CSS class add/removed.  Typically used by a parent component such as
     * Layer.UI.messages.ChoiceMessageView which has state to persist after a click has completed.
     *
     * @property {Boolean} selected
     */
    selected: {
      type: Boolean,
      set(value) {
        this.toggleClass('layer-action-button-selected', value);
      },
    },
  },
  methods: {
    onCreate() {
      this.addClickHandler('button-click', this, this._onClick.bind(this));
    },

    /**
     * When the button is clicked, either call MessageViewer's `_runAction` method, or directly trigger the event on the DOM.
     *
     * @method _onClick
     * @param {Event} evt
     * @private
     */
    _onClick(evt) {
      if (!this.event || this.disabled) return;
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      let node = this;
      while (!node.isMessageTypeView && node.parentComponent) {
        node = node.parentComponent;
      }
      if (node.messageViewer) {
        node.messageViewer._runAction({
          event: this.event,
          data: this.data,
        });
      } else if (this.event) {
        this.trigger(this.event, this.data);
      }
      if (evt) evt.target.blur(); // Don't recall specific problem that this addresses but probably better that the button not stay active after clicked/tapped
    },
  },
});
