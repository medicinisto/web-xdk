/* NOT SUPPORTED
 *
 * @class Layer.UI.handlers.message.MessageViewer
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../components/component';

registerComponent('layer-list-item-container', {
  style: `layer-list-item-container {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
  }
  layer-list-item-container.layer-standard-message-view-no-metadata .layer-card-body {
    display: none;
  }
  layer-list-item-container .layer-card-body {
    flex-grow: 1;
  }`,
  template: `
    <div layer-id='UIContainer' class='layer-card-left'></div>
    <div class="layer-card-body">
      <div layer-id="title" class="layer-card-title"></div>
      <div layer-id="description" class="layer-card-description"></div>
      <div layer-id="footer" class="layer-card-footer"></div>
    </div>`,

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    cardBorderStyle: {
      noGetterFromSetter: true,
      get() {
        return this.properties.cardBorderStyle || this.properties.ui.cardBorderStyle || 'list';
      },
    },
    model: {},
    ui: {
      set() {
        while (this.nodes.UIContainer.firstChild) this.nodes.UIContainer.removeChild(this.nodes.UIContainer.firstChild);
        if (this.properties.ui) this.nodes.UIContainer.appendChild(this.properties.ui);
      },
    },
    title: {
      set(title) {
        this.nodes.title.innerHTML = title;
      },
    },
    description: {
      set(description) {
        this.nodes.description.innerHTML = description;
      },
    },
    footer: {
      set(footer) {
        this.nodes.footer.innerHTML = footer;
      },
    },
  },
  methods: {

    onAfterCreate() {
      this.model.on('message-type-model:change', this.onRerender, this);
    },

    onRerender() {
      const model = this.properties.model;
      this.title = model.getTitle();
      this.description = model.getDescription();
      this.footer = model.getFooter();
      this.toggleClass('layer-standard-message-view-no-metadata', !this.title && !this.description && !this.footer);
    },
  },
});
