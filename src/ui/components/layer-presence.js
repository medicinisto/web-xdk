/**
 * The Layer Presence widget renders an icon representing a user's status of Available, Away, Busy or Offline.
 *
 * If using it outside of the Avatar widget, make sure you set `layerPresenceWidget.item = identity`.  Most common usage is:
 *
 * ```
 * document.getElementById('mypresencewidget').item = client.user;
 * ```
 *
 * The simplest way to customize this widget is to replace it with your own implementation of the `<layer-presence />` tag.
 *
 * ```javascript
 * Layer.UI.registerComponent('layer-presence', {
 *    properties: {
 *      item: {
 *        set: function(identityItem) {
 *           this.onRender();
 *           if (identityItem) identityItem.on('identity:changes', this.onRerender, this);
 *        }
 *      }
 *    },
 *    methods: {
 *      onRerender: function() {
 *        this.className = 'my-presence-' + this.item.status;
 *      },
 *    }
 * });
 *
 * // Call init after custom components are defined
 * Layer.init({
 *   appId: 'layer:///apps/staging/UUID'
 * });
 * ```
 *
 * ### Importing
 *
 * Any of the following will import this component
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-presence';
 * ```
 *
 * @class Layer.UI.components.Presence
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 * @mixin Layer.UI.mixins.SizeProperty
 */
import { client as Client } from '../../settings';
import Core from '../../core/namespace';
import { registerComponent } from './component';
import SizeProperty from '../mixins/size-property';
import Clickable from '../mixins/clickable';

registerComponent('layer-presence', {
  mixins: [SizeProperty, Clickable],
  style: `
    layer-presence {
      display: inline-block;
      border-radius: 30px;
    }
  `,
  /**
   * The user has clicked on the `<layer-presence />` widget
   *
   * @event layer-presence-click
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity} evt.detail.item - The user rendered by this Presence Widget
   */

  /**
   * @inheritdoc #event-layer-presence-click
   *
   * @property {Function} onPresenceClick
   * @property {Event} onPresenceClick.evt
   * @property {Object} onPresenceClick.evt.detail
   * @property {Layer.Core.Identity} onPresenceClick.evt.detail.item - The user rendered by this Presence Widget
   */
  events: ['layer-presence-click'],
  properties: {

    /**
     * User whose status is to be rendered.
     *
     * @property {Layer.Core.Identity} item
     */
    item: {
      set(value, oldValue) {
        if (oldValue) oldValue.off(null, null, this);

        if (value) {
          // Item will be a Message if the status widget is within a `<layer-message-item-sent />` widget:
          if (value instanceof Core.Message) {
            value = value.sender;
          }

          // Item will be a Conversation if widget is within a `<layer-conversation-item />` widget
          else if (value instanceof Core.Conversation) {
            value = value.participants.filter(identity => !identity.isMine)[0];
          }

          // If item is an object, but not an Identity instance, assume its an Identity POJO and get the instance
          else if (typeof value === 'object' && !(value instanceof Core.Identity)) {
            if (Client) {
              value = Client.getIdentity(value.id);
            }
          }

          // If the object does not match any Identity, set it to null; it represents an unknown
          if (!(value instanceof Core.Identity)) {
            value = null;
          }
          this.properties.item = value;
        }

        // Rerender on changes
        if (value) value.on('identities:change', this.onRerender, this);

        // Rerender on initialization
        this.onRender();
      },
    },

    // See SizeProperty Mixin...
    size: {
      value: 'small',
    },

    // See SizeProperty Mixin...
    supportedSizes: {
      value: ['small', 'medium', 'large'],
    },
  },
  methods: {
    onCreate() {
      this.addClickHandler('presence-click', this, this.onClick.bind(this));
    },

    /**
     * Render new user.
     *
     * @method onRender
     */
    onRender() {
      if (this.item) this.onRerender();
    },

    /**
     * Render's changes in user status
     *
     * @method onRerender
     */
    onRerender() {
      const status = this.item ? this.item.status : '';
      this.toggleClass('layer-presence-available', status === 'available');
      this.toggleClass('layer-presence-busy', status === 'busy');
      this.toggleClass('layer-presence-away', status === 'away');
      this.toggleClass('layer-presence-offline', status === 'offline');
      this.toggleClass('layer-presence-invisible', status === 'invisible');
      this.toggleClass('layer-presence-unknown', !status);
    },

    /**
     * The user clicked on this widget.
     *
     * Typically, you wouldn't respond to these, but if the user clicked on their OWN presence,
     * you may prompt them to change their status
     *
     * @method onClick
     * @param {Event} evt
     */
    onClick(evt) {
      evt.preventDefault();
      this.trigger('layer-presence-click', { item: this.item });
    },
  },
});
