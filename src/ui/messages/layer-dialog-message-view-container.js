/**
 * Similar to the Layer.UI.messages.TitledMessageViewContainer, this adds a title and a close button
 * to a container that wraps a Message Type View.
 *
 * ### Importing
 *
 * Included with the standard build. For custom build,  import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/layer-dialog-message-view-container
 * ```
 *
 * @class Layer.UI.messages.DialogMessageViewContainer
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from '../components/component';
import Clickable from '../mixins/clickable';

registerComponent('layer-dialog-message-view-container', {
  mixins: [Clickable],
  style: `
    layer-dialog-message-view-container {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    layer-dialog-message-view-container.layer-title-icon-empty .layer-card-title-bar-icon {
      display: none;
    }
    layer-dialog-message-view-container .layer-card-title-bar {
      display: flex;
      flex-direction: row;
    }
    layer-dialog-message-view-container .layer-card-title-bar-text {
      flex-grow: 1;
    }
    layer-dialog-message-view-container:not(.layer-show-close-button) .layer-card-title-close-button {
      display: none;
    }
    layer-dialog-message-view-container .layer-card-top {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    layer-dialog-message-view-container .layer-card-top > * {
      flex-grow: 1;
    }
  `,
  template: `
  <div class="layer-card-title-bar">
    <div layer-id='icon' class="layer-card-title-bar-icon"></div>
    <div layer-id='title' class="layer-card-title-bar-text"></div>
    <div layer-id='titleButtons' class="layer-card-title-buttons">
      <div layer-id='close' class="layer-card-title-close-button">&times;</div>
    </div>
  </div>
  <div layer-id='UIContainer' class='layer-card-top'></div>
  `,

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    /**
     * The Layer.Core.MessageTypeModel whose data is rendered here.
     *
     * @property {Layer.Core.MessageTypeModel} model
     */
    model: {},

    /**
     * The action data of the button or Message that was used to open this expanded viewer.
     *
     * @property {Object}
     */
    openActionData: {},

    /**
     * The Layer.UI.messages.MessageViewMixin that is wrapped by this UI Component.
     *
     * @property {Layer.UI.messages.MessageViewMixin} ui
     */
    ui: {
      set() {
        while (this.nodes.UIContainer.firstChild) this.nodes.UIContainer.removeChild(this.nodes.UIContainer.firstChild);
        if (this.properties.ui) this.nodes.UIContainer.appendChild(this.properties.ui);
      },
    },

    /**
     * Title for the titlebar; comes from `this.properties.ui.getTitle()`
     *
     * @property {String} title
     */
    title: {
      set(title) {
        this.nodes.title.innerHTML = title;
      },
    },

    /**
     * Icon for the titlebar; comes from `this.properties.ui.getIconClass()`
     *
     * @property {String} icon
     */
    icon: {
      value: '',
      set(icon, oldIcon) {
        if (oldIcon) this.nodes.icon.classList.remove(oldIcon);
        if (icon) this.nodes.icon.classList.add(icon);
        this.toggleClass('layer-title-icon-empty', !(icon));
      },
    },

    /**
     * Show a close button in the titlebar to close the dialog?:
     *
     * @property {Boolean} [isCloseButtonShowing=false]
     */
    isCloseButtonShowing: {
      value: false,
      set(value) {
        this.toggleClass('layer-show-close-button', value);
      },
    },
  },
  methods: {
    onCreate() {
      this.addClickHandler('close-click', this.nodes.close, this.onCloseClick.bind(this));
    },

    onAfterCreate() {
      this.model.on('message-type-model:change', this.onRerender, this);
    },


    onRerender() {
      this.icon = this.properties.ui.getIconClass();
      this.title = this.properties.ui.getTitle();
    },

    /**
     * Mixin Hook: On clicking the close button, destroy the parent component (the dialog)
     *
     * @method onCloseClick
     */
    onCloseClick() {
      this.parentComponent.destroy();
    },
  },
});

