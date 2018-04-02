/**
 * A Message Handler Mixin that provides common properties and behaviors for implementing a Card.
 *
 * ```
 * import { UI } from '@layerhq/web-xdk';
 * const MessageHandler = UI.mixins.MessageHandler;
 *
 * layerUI.registerComponent('sample-message-handler', {
 *     mixins: [MessageHandler],
 *     methods: {
 *         onCreate() {
 *            // If using a template, your dom nodes will already be setup,
 *            // and you can wire up UI event handlers here.
 *            // Do any DOM creation/manipulation that does not depend upon the message here.
 *         },
 *
 *         onSent() {
 *           // If you are rendering messages before they are sent, and need special processing of them once they ARE sent,
 *           // put your special processing in here
 *         },
 *
 *         // Your onRender method is called once the message property is set.
 *         onRender() {
 *            // DOM Manipulation Here
 *         },
 *
 *         // Your onRerender method is called by onRender, and called any time the Message
 *         // changes; all dynamic rendering goes in onRerender.
 *         onRerender() {
 *             // DOM Manipulation Here
 *         }
 *     }
 * });
 *
 * // If a template is needed, register a template for your component using a String;
 * // Note that layer-id will allow you to access these nodes directly as this.nodes.description
 * // or this.nodes.checkox
 * UI.buildAndRegisterTemplate('sample-message-handler', '<label layer-id="label">Approve Purchase</label>' +
 *    '<input type="checkbox" layer-id="checkbox" /><div layer-id="description"></div>');
 *
 * // OR Register a template for your component using a <template /> DOM node:
 * UI.registerTemplate('sample-message-handler', myTemplateNode);
 * ```
 *
 * If you need to add side effects to setting the `message` property, you can add a message setter; it will be
 * called before the MessageHandlerMixin's message setter:
 *
 * ```
 * UI.registerComponent('sample-message-handler', {
 *   mixins: [MessageHandler],
 *   properties: {
 *     message: {
 *       setter: function(value) {
 *         this.properties.data = value.filterPartsByMimeType('blah/blah')[0].body;
 *       }
 *     }
 *   },
 *   methods: {
 *     onRender: function() {
 *       this.innerHTML = this.properties.data;
 *     }
 *   }
 * });
 * ```
 *
 * @class Layer.UI.mixins.MessageHandler
 * @deprecated
 */
import { registerComponent } from '../components/component';
import mixins from './index';

mixins.Throttler = module.exports = {
  properties: {
    /**
     * The Layer.Core.Message to be rendered.
     *
     * @property {Layer.Core.Message} message
     */
    message: {
      mode: registerComponent.MODES.AFTER,
      set(newMessage, oldMessage) {
        if (oldMessage) oldMessage.off(null, null, this);
        this.onRender();
        if (newMessage) {
          newMessage.on('messages:change', this._onChange, this);
          if (newMessage.isNew()) newMessage.once('messages:sent', this.onSent, this);
        }
      },
    },
  },
  methods: {

    /**
     * Your onRender method is called once the message property is set.
     *
     * Any call to onRender will also call onRerender
     * which may handle some more dynamic rendering.
     *
     * @method onRender
     */
    onRender: {
      conditional: function onCanRender() {
        return Boolean(this.message && !this.message.isDestroyed);
      },
    },

    /**
     * Your onRerender method handles any dynamic rendering.
     *
     * It should be called when:
     *
     * * Your Layer.Core.Message is first rendered
     * * Your Layer.Core.Message triggers any `messages:change` events
     * * Any outside events that influence rendering occur (though this is in your control)
     *
     * @method onRerender
     */
    onRerender() {},

    /**
     * Whenever the message changes, call onRerender().
     *
     * Unless of course, the message is new, and unsent, and we're actually
     * rendering a Message Preview, in which case call onRender.
     *
     * Rationale: When the message is new, anything/everything can change, requiring a full rerendering.
     * Once sent, only specific things can change, such as read receipts.
     *
     * @method _onChange
     * @private
     */
    _onChange(evt) {
      if (this.message.isNew() || evt.hasProperty('parts.body') || evt.hasProperty('parts')) {
        this.onRender();
      } else {
        this.onRerender();
      }
    },


    /**
     * Your onSent method will be called if you rendered the message prior to sending it.
     *
     * Use this if there is any change to your message that need to be made after its been sent.
     *
     * @method onSent
     */
    onSent() {},
  },
};
