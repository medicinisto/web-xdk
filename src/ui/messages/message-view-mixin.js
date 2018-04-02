/**
 * A Mixin that provides common patterns for rendering any Message Type Model.
 *
 * @class Layer.UI.messages.MessageViewMixin
 */

import Constants from '../constants';
import mixins from '../mixins';

mixins.MessageViewMixin = module.exports = {
  properties: {

    /**
     * Indicates that this UI Component is a Message Type View
     *
     * @property {Boolean} [isMessageTypeView=true]
     * @readonly
     */
    isMessageTypeView: {
      value: true,
    },

    /**
     * The Message Type Model to be rendered by this UI.
     *
     * Any change event triggered by this model should trigger a call to this UI's `onRerender`
     *
     * @property {Layer.Core.MessageTypeModel} model
     */
    model: {
      set(newModel, oldModel) {
        if (oldModel) oldModel.off(null, null, this);
        if (newModel) {
          newModel.on('message-type-model:change', this.onRerender, this);
          newModel.on([
            'message-type-model:change',
            'message-type-model:customization',
            'message-type-model:sending-response-message',
            'message-type-model:notification',
            'message-type-model:has-new-message',
          ].join(' '), this._forwardEvent, this); // not well tested
        }
      },
    },

    /**
     * Provides hints to the `<layer-message-viewer />` as to what sort of border to draw around the Message/Sub-Message.
     *
     * See Layer.UI.handlers.message.MessageViewer.cardBorderStyle for more detail.
     *
     * @property {String} cardBorderStyle
     */
    cardBorderStyle: {},

    /**
     * Pointer to the Layer.UI.handlers.message.MessageViewer that contains this Message Type View.
     *
     * @property {Layer.UI.handlers.message.MessageViewer} messageViewer
     */
    messageViewer: {},

    /**
     * Specifies a width class for this Message Type View.
     *
     * One of:
     *
     * * Layer.UI.Constants.WIDTH.FULL: Uses all available width
     * * Layer.UI.Constants.WIDTH.ANY: No minimum, maximum is all available width; generallay does not look like a card
     * * Layer.UI.Constants.WIDTH.FLEX: card that has a minimum and a maximum but tries for an optimal size for its contents
     *
     * @property {String} widthType
     */
    widthType: {},

    /**
     * Each Message Type View can specify their preferred minimum width.
     *
     * Default is 192px
     *
     * @property {Number} preferredMinWidth
     */
    preferredMinWidth: {
      get() {
        return this.properties.preferredMinWidth || 192;
      },
    },

    /**
     * Each Message Type View can specify their preferred maximum width.
     *
     * Default is 1000px
     *
     * @property {Number} preferredMaxWidth
     */
    preferredMaxWidth: {
      get() {
        return this.properties.preferredMaxWidth || 1000;
      },
    },

    /**
     * Most cards are fixed height; those that must calculate their height asynchonously will use this.
     *
     * Any Message Type Model needing to calculate the height should default this property to `false`
     * and change it to `true` once the height has been set.
     *
     * @property {Boolean} isHeightAllocated
     */
    isHeightAllocated: {
      value: true,
      set(value) {
        if (value) {
          this.trigger('message-height-change');
        }
      },
    },

    /**
     * Height of the View in pixels; leave unset to let it adjust its size to its content.
     *
     * Should be set during initialization; and not changed after.
     *
     * @property {Number} [type=]
     */
    height: {
      set(value) {
        this.style.height = value + 'px';
      },
    },

    cssClassList: {
      value: ['layer-message-type-view'],
    },

    /**
     * Hide any `replaceableContent` to the left and right of the Message Item to make more room for this Message.
     *
     * That typically means hiding any Avatars, Menu Buttons, etc...
     *
     * @property {Boolean} [hideMessageItemRightAndLeftContent=false]
     */
    hideMessageItemRightAndLeftContent: {},
  },
  methods: {

    onAfterCreate() {
      const part = this.model.part;
      if (part) {
        if (part.isFiring && !part.body) {
          this.isHeightAllocated = false;
          part.once('content-loaded', () => {
            this.isHeightAllocated = true;
            this.onRender();
          });
        }
      }
    },

    /**
     * Core part of the UI Lifecycle, called whenever the model changes, and after initialization.
     *
     * Detect if there is any change to the width type. This could happen due to a message being
     * updated with metadata that wasn't there before (Link Integration Service adding metadata)
     *
     * @method onRerender
     */
    onRerender() {
      if (this.messageViewer) {
        this.messageViewer.widthType = this.widthType || Constants.WIDTH.FLEX;
      }
    },

    /**
     * If there is a Display Container wrapping this UI Component, setup its CSS Classes.
     *
     * Certain knowledge is best understood by the UI rather than the Model, such as whether
     * a panel of metadata really aught to be shown.  The Display Container will request this update
     * any time the model is changed.
     *
     * @method _setupContainerClasses
     * @protected
     */
    _setupContainerClasses() {
      this.parentComponent.toggleClass('layer-card-no-metadata',
        !this.model.getTitle() && !this.model.getDescription() && !this.model.getFooter());
    },

    /**
     * Any customization event from the model should be sent via the UI as well.
     *
     * If `evt.preventDefault()` was called on the UI event, call `evt.cancel()`
     *
     * > *Note*
     * >
     * > This needs to be better documented in public docs... or removed
     *
     * @method _forwardEvent
     * @private
     * @param {Layer.Core.LayerEvent} evt
     */
    _forwardEvent(evt) {
      evt.modelName = this.model.constructor.name;
      if (!this.trigger(evt.type || evt.eventName, evt)) {
        evt.cancel();
      }
    },

    /**
     * Returns the number of pixels wide the Message List is; maybe 0 if not yet available.
     *
     * @method getMessageListWidth
     * @returns {Number}
     */
    getMessageListWidth() {
      let parent = this.parentComponent;
      while (parent !== null && parent.tagName !== 'BODY' && parent.tagName !== 'LAYER-MESSAGE-LIST') {
        parent = parent.parentComponent || parent.parentNode;
      }

      if (parent.tagName === 'LAYER-MESSAGE-LIST') return parent.clientWidth;
      return 0;
    },

    onDestroy() {
      delete this.properties.messageViewer;
    },
  },
};
