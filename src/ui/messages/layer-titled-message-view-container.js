/**
 * Container for Message Type Views that adds a titlebar.
 *
 * ### Importing
 *
 * Included with the standard build. For custom build,  import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/layer-titled-message-view-container
 * ```
 *
 * @class Layer.UI.messages.TitledMessageViewContainer
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../components/component';

registerComponent('layer-titled-message-view-container', {
  style: `
    layer-titled-message-view-container {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
  `,
  template: `
  <layer-title-bar layer-id='titlebar'></layer-title-bar>
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
        this.nodes.titlebar.title = title;
        this.toggleClass('layer-no-title', !title);
      },
    },

    /**
     * Icon for the titlebar; comes from `this.properties.ui.getIconClass()`
     *
     * @property {String} iconClass
     */
    iconClass: {
      value: '',
      set(icon, oldIcon) {
        this.nodes.titlebar.iconClass = icon;
        this.toggleClass('layer-title-icon-empty', !(icon));
      },
    },

    icon: {
      value: '',
      set(icon) {
        this.nodes.titlebar.icon = icon;
      },
    },
  },
  methods: {
    onAfterCreate() {
      this.model.on('message-type-model:change', this.onRerender, this);
    },

    onRerender() {
      if (this.properties.ui.getIconClass) this.iconClass = this.properties.ui.getIconClass();
      if (this.properties.ui.getIcon) this.icon = this.properties.ui.getIcon();
      this.title = this.properties.ui.getTitle();
    },
  },
});
