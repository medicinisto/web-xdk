/**
 * The Layer Prompt widget replaces window.confirm and window.prompt (currently window.confirm only) with something
 * that is non-blocking and themed to match the UI.
 *
 * ```javascript
 * var prompt = document.createElement('layer-prompt');
 * prompt.open({
 *   title: "Question:",
 *   text: "Is it OK if we delete all of your data?",
 *   button1: "OK",
 *   button2: "Hell No!",
 *   action1: () => {
 *     myDeleteAllData();
 *   },
 *   action2: () => {}
 * });
 * ```
 *
 * The prompt will insert itself into `document.body` unless its already been inserted into the DOM.
 *
 * You can call `prompt.close()` to dismiss the dialog; the user clicking on either button will automatically dismiss the dialog.
 *
 * ### Importing
 *
 * This UI Component is automatically imported *if* you use Layer.UI.components.Notifier; else you should import it with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-prompt';
 * ```
 *
 * @class Layer.UI.components.Prompt
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from './component';
import Clickable from '../mixins/clickable';

registerComponent('layer-prompt', {
  mixins: [Clickable],
  template: `
    <div class='layer-prompt-main' layer-id='container'>
      <div class='layer-prompt-title'>
        <span layer-id='title'></span>
      </div>
      <div class='layer-prompt-text' layer-id='text'></div>
      <div class='layer-prompt-actions'>
        <layer-action-button text='Yes' action='enable' layer-id='actionButton1'></layer-action-button>
        <layer-action-button text='No' action='dismiss' layer-id='actionButton2'></layer-action-button>
      </div>
    </div>
  `,
  style: `
    layer-prompt {
      position: fixed;
      z-index: 1050;
      display: flex;
    }
    layer-prompt .layer-prompt-text {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    layer-prompt .layer-prompt-actions {
      display: flex;
      flex-direction: row;
    }
    layer-prompt .layer-prompt-actions .layer-prompt-hidden {
      display: none;
    }
    layer-prompt .layer-prompt-actions layer-action-button {
      flex-grow: 1;
    }
  `,

  properties: {
    /**
     * Text asking the user a question
     *
     * @property {String} text
     */
    text: {
      set(value) {
        this.nodes.text.innerHTML = value;
      },
    },

    /**
     * Title for the dialog
     *
     * @property {String} title
     */
    title: {
      set(value) {
        this.nodes.title.innerHTML = value;
      },
    },

    /**
     * Text for button 1
     *
     * @property {String} button1
     */
    button1: {
      set(value) {
        this.nodes.actionButton1.text = value;
        this.nodes.actionButton1.toggleClass('layer-prompt-hidden', !value);
      },
    },

    /**
     * Text for button 2
     *
     * @property {String} button2
     */
    button2: {
      set(value) {
        this.nodes.actionButton2.text = value;
        this.nodes.actionButton2.toggleClass('layer-prompt-hidden', !value);
      },
    },

    /**
     * Action to execute when button1 is clicked
     *
     * @property {Function} action1
     */
    action1: {},

    /**
     * Action to execute when button2 is clicked
     *
     * @property {Function} action2
     */
    action2: {},
  },
  methods: {
    onCreate() {
      this.addEventListener('animationend', this._afterTransition.bind(this), true);
      this.addClickHandler('action1', this.nodes.actionButton1, this._onAction1Click.bind(this));
      this.addClickHandler('action2', this.nodes.actionButton2, this._onAction2Click.bind(this));
    },

    /**
     * Show the dialog with the specified properties
     *
     * @method show
     * @param {Object} options
     * @param {String} options.button1  See {@link #button1}
     * @param {String} options.button2  See {@link #button2}
     * @param {String} options.title  See {@link #title}
     * @param {String} options.text  See {@link #text}
     * @param {String} options.action1  See {@link #action1}
     * @param {String} options.action2  See {@link #action2}
     */
    show({ button1, button2, action1, action2, title, text }) {
      this.button1 = button1;
      this.button2 = button2;
      this.action1 = action1;
      this.action2 = action2;
      this.title = title;
      this.text = text;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(this)) {
        document.body.appendChild(this);
      }
      this.classList.add('layer-prompt-showing');
    },

    /**
     * Handle the user clicking/tapping on the first action button.
     *
     * @method _onAction1Click
     * @private
     */
    _onAction1Click() {
      if (this.action1) this.action1();
      this.close();
    },

    /**
     * Handle the user clicking/tapping on the second action button.
     *
     * @method _onAction1Click
     * @private
     */
    _onAction2Click() {
      if (this.action2) this.action2();
      this.close();
    },

    /**
     * Close the dialog.
     *
     * THis method actually adds a class that causes the dialog to fade; the `animationend` event
     * will then remove this dialog from the DOM and cleanup.
     *
     * If animations are not enabled (stylesheets not loaded) then close will not work.
     *
     * @method close
     */
    close() {
      this.classList.add('layer-prompt-fading');
    },

    /**
     * After finishing an animation either complete the showing process, or if hiding the prompt, destroy the prompt to cleanup all resources.
     *
     * @method _afterTransition
     * @private
     */
    _afterTransition() {
      if (this.classList.contains('layer-prompt-fading')) {
        this.destroy();
      } else {
        this.classList.remove('layer-prompt-showing');
      }
    },
  },
});
