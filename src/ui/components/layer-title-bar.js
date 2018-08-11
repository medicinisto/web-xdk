/**
 * Reusable Titlebar Component
 *
 * ```
 * var titlebar = document.createElement('layer-title-bar');
 * var myButtonPanel = document.createElement('div');
 * var myButton = document.createElement('button');
 * myButton.value = 'close';
 * myButton.addEventListener('click', closeDialog);
 * myButtonPanel.appendChild(myButton);
 * titlebar.replaceableContent = {
 *   buttons: myButtonPanel
 * };
 *
 * panel.appendChild(titlebar);
 * ```
 *
 * @class Layer.UI.components.TitleBar
 * @extends Layer.UI.Component
 */
import { registerComponent } from './component';

registerComponent('layer-title-bar', {
  template: `
    <div layer-id='icon' class="layer-title-bar-icon"></div>
    <div layer-id='title' class="layer-title-bar-text"></div>
    <layer-replaceable-content class="layer-title-buttons" layer-id="buttons" name="buttons">
    </layer-replaceable-content>
  `,
  style: `
    layer-title-bar {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    layer-title-bar.layer-title-icon-empty .layer-title-bar-icon {
      display: none;
    }
    layer-title-bar .layer-title-bar-text {
      flex-grow: 1;
    }
    layer-title-bar > layer-replaceable-content:empty {
      display: none;
    }
  `,
  properties: {
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
     * @property {String} iconClass
     */
    iconClass: {
      value: '',
      set(icon, oldIcon) {
        if (oldIcon) this.nodes.icon.classList.remove(oldIcon);
        if (icon) this.nodes.icon.classList.add(icon);
        this.toggleClass('layer-title-icon-empty', !(this.icon || this.iconClass));
      },
    },

    /**
     * Icon for the titlebar; comes from `this.properties.ui.getIcon()`; represents an SVG XML string
     *
     * @property {String | HTMLElement} icon
     */
    icon: {
      value: '',
      set(icon, oldIcon) {
        if (icon instanceof HTMLElement) {
          this.nodes.icon.innerHTML = '';
          this.nodes.icon.appendChild(icon);
        } else {
          this.nodes.icon.innerHTML = icon;
        }
        this.toggleClass('layer-title-icon-empty', !(this.icon || this.iconClass));
      },
    },
  },
  methods: {
    onCreate() {
      this.nodes.buttons._onAfterCreate();
    },
    addButton(node) {
      this.nodes.buttons.appendToContent(node);
    },
  },
});
