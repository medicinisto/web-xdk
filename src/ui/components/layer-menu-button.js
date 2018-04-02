/**
 * The Layer Menu Button renders a menu button and has associated menu items.
 *
 * This is provided as a specialized component so that it can be easily redefined by your app to
 * provide your own menu capability.
 *
 * Note that the `item` property can refer to any data, but is expected to be used for subclasses of Layer.Core.Root such as
 * Layer.Core.Message, Layer.Core.Conversation, Layer.Core.Identity, etc...
 *
 * ```
 * var menuButton = document.createElement('layer-menu-button');
 * menuButton.item = message;
 * menuButton.getMenuItems = function(item) {
 *     return [
 *       {text: "delete", method: function() {item.delete(Layer.Constants.DELETION_MODE.ALL);}
 *     ];
 * };
 * ```
 *
 * > *Note*
 * >
 * > The Layer.UI.components.MenuButton.item is used within the Layer.UI.components.MenuButton.getMenuItems method, and is
 * > not directly provided to your Menu Item Methods, as illustrated above.
 *
 * > *Note*
 * >
 * > The Layer.UI.components.MenuButton.getMenuItems is called each time the user clicks on the Menu Button;
 * > your menu freshness is based solely on the user click time; updates that take place after that do not affect
 * > the menu that is displayed.
 *
 * ### Importing
 *
 * Any of the following will import this component
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-menu-button';
 * ```
 *
 *
 * @class Layer.UI.components.MenuButton
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from './component';
import './layer-menu';
import Clickable from '../mixins/clickable';

registerComponent('layer-menu-button', {
  mixins: [Clickable],
  template: '<span>&#8285;</span>',
  style: `
    layer-menu-button {
      cursor: pointer;
    }
    layer-menu-button span {
      user-select: none;
      -webkit-user-select: none;
    }
  `,
  properties: {

    /**
     * Get the menu options to display in the menu.
     *
     * This is called each time the user clicks the menu button.
     *
     * Menu items are provided via a `getMenuItems` Function provided by the application,
     * or a `getMenuItems` provided by the Layer.UI.components.MenuButton.parentComponent
     *
     * @property {Function} getMenuItems
     * @property {Layer.Core.Root} getMenuItems.item
     * @property {Object[]} getMenuItems.return
     */
    getMenuItems: {
      type: Function,
      noGetterFromSetter: true,
      // value() { return []; },
      get() {
        if (this.properties.getMenuItems) return this.properties.getMenuItems;
        if (this.parentComponent && this.parentComponent.getMenuItems) return this.parentComponent.getMenuItems;
      },
      set(value) {
        this.toggleClass('layer-has-menu', Boolean(value));
      },
    },


    /**
     * The (optional) item represents some piece of data that this button will generate a menu for.
     *
     * If this Menu Button is part of the template for a List Item (and this button has a `layer-id`),
     * then its item property will automatically be set to the List's item.
     *
     * @property {Layer.Core.Root} [item]
     */
    item: {},

    /**
     * Different buttons may need menus of differing widths; set it here and its applied by the button, not style sheet.
     *
     * Width is applied after each click, and is not updated between clicks.
     *
     * @property {Number} [menuWidth=100]
     */
    menuWidth: {
      value: 100,
      type: Number,
    },
  },
  methods: {

    // Lifecycle
    onCreate() {
      this.addClickHandler('menu-click', this, this.onButtonClick.bind(this));
    },

    /**
     * Mixin Hook: Override this method to have your own menuing system kick in.
     *
     * Note that Button Clicks do not bubble up, they simply generate a `<layer-menu />` and show it.
     *
     * @method onButtonClick
     * @param {Event} evt
     */
    onButtonClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      const options = this.getMenuItems ? this.getMenuItems(this.item) : [];

      // If there are options, update the menu's items and show it
      if (options) {
        let menuNode = document.querySelector('layer-menu');
        if (!menuNode) {
          menuNode = document.createElement('layer-menu');
          document.body.appendChild(menuNode);
        }

        menuNode.items = options;
        if (this.menuWidth) menuNode.menuWidth = this.menuWidth;

        if (!menuNode.isShowing || menuNode.near !== this) {
          menuNode.near = this;
          menuNode.isShowing = true;
        }
      }
    },
  },
});
