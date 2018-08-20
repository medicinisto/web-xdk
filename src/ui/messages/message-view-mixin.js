/**
 * A Mixin that provides common patterns for rendering any Message Type Model.
 *
 * @class Layer.UI.messages.MessageViewMixin
 * @typescript ismixin
 */

import mixins from '../mixins';

mixins.MessageViewMixin = {
  properties: {
    defaultWidth: {
      value: 192,
    },
    defaultHeight: {
      value: 0,
    },

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
     * Each Message Type View can specify their minimum width.
     *
     * @property {Number} [minWidth=256]
     */
    minWidth: {
      type: Number,
      value: 256,
      valueLowPriority: true,
      set(value) {
        const availableWidth = this.getAvailableMessageWidth();
        const realValue = this.minWidth; // get the real value from the getter, if one is provided
        const adjustedValue = realValue ? Math.min(availableWidth, realValue) : '';
        this.style.minWidth = adjustedValue ? adjustedValue + 'px' : '';
        if (this.messageViewer) {
          this.messageViewer.style.minWidth = this.style.minWidth;
        }
      },
    },

    /**
     * Each Message Type View can specify their preferred maximum width.
     *
     * If unset, then 70% of message list width is used if message list is wide; 95% if message list is narrow.
     *
     * @property {Number} [maxWidth]
     */
    maxWidth: {
      set(value) {
        const availableWidth = this.getAvailableMessageWidth();
        const realValue = this.maxWidth;
        const adjustedValue = realValue ? Math.min(availableWidth, realValue) : '';
        this.style.maxWidth = adjustedValue ? adjustedValue + 'px' : '';
        if (this.messageViewer) this.messageViewer.style.maxWidth = this.style.maxWidth;
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
      valueLowPriority: true,
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

    onAfterCreate: {
      conditional() {
        const part = this.model.part;
        if (part && part.isFiring && !part.body) {
          if (!this.properties._waitingForPart) {
            const changeHeightAllocated = this.isHeightAllocated;
            if (changeHeightAllocated) this.isHeightAllocated = false;
            part.once('content-loaded', () => {
              this.properties._waitingForPart = false;
              if (changeHeightAllocated) this.isHeightAllocated = true;
              this.onAfterCreate();
            }, this);
            this.properties._waitingForPart = true;
          }
          return false;
        }
        return true;
      },
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
      this.minWidth = this.minWidth; // Reevaluate the minWidth getter and if changes, apply the setter
    },

    _setupContainerClasses() {},

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
     * Returns the number of pixels wide that a message has available to it.
     *
     * This can use `parentComponent` properties that exist prior to this widget being inserted into the document,
     * and thus the parentComponent may already know the available width even though this widget has no width.
     *
     * @method getAvailableMessageWidth
     * @return {Number}
     */
    getAvailableMessageWidth(messageViewer) {
      if (this.messageViewer) {
        return this.messageViewer.getAvailableMessageWidth(messageViewer);
      } else {
        return this.clientWidth;
      }
    },

    getFullAvailableMessageWidth(messageViewer) {
      if (messageViewer) {
        return this.getAvailableMessageWidth(messageViewer);
      } else if (this.messageViewer) {
        return this.messageViewer.getFullAvailableMessageWidth(null);
      } else {
        return this.clientWidth;
      }
    },

    /**
     * Returns the maximum number of pixels width allowed for a message given the current Message Width List.
     *
     * Messages may violate this (Carousel does), but should only be violated under special conditions.
     *
     * @method getMaxMessageWidth
     * @returns {Number}
     */
    getMaxMessageWidth() {
      const width = this.getAvailableMessageWidth();
      if (width) {
        if (this.maxWidth) {
          return Math.min(width, this.maxWidth);
        } else {
          return width;
        }
      } else {
        return this.maxWidth;
      }
    },

    onDetach() {
      this.isHeightAllocated = false;
    },

    onDestroy() {
      delete this.properties.messageViewer;
    },


    /**
     * Calculate best width and height for the preview image given the previewWidth/height and the maxWidth/height.
     *
     *
     * @method getBestDimensions
     * @protected
     * @param {Object} options
     * @param {Number} [options.maxWidth]
     * @param {Number} [options.maxHeight]
     * @param {Number} [options.minWidth]
     * @param {Number} [options.minHeight]
     * @param {Number} [options.contentWidth]
     * @param {Number} [options.contentHeight]
     * @param {Boolean} [options.proportional=true]
     * @return {Object}
     * @return {Number} return.width
     * @return {Number} return.height
     * @return {Boolean} return.isCropped  If some content may be cropped by this width/height
     * @return {Boolean} return.isScaledUp  If content needs to be scaled up in size
     */
    getBestDimensions({ maxHeight, maxWidth, minHeight, minWidth, contentWidth, contentHeight, proportional = true }) {
      let height = contentHeight || this.defaultHeight;
      let width = contentWidth || this.defaultWidth;
      let isCropped = false;
      let isScaledUp = false;
      const maxWidthAvailable = this.getMaxMessageWidth();
      maxWidth = maxWidth ? Math.min(maxWidth, maxWidthAvailable) : maxWidthAvailable;

      if (!proportional) {

        if (minWidth && width < minWidth) width = minWidth;
        else if (maxWidth && width > maxWidth) width = maxWidth;

        if (minHeight && height < minHeight) height = minHeight;
        else if (maxHeight && height > maxHeight) height = maxHeight;
      } else {
        let ratio;
        if (width && height) {
          ratio = width / height;
        } else {
          ratio = 1;
        }

        if (maxWidth && width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }
        if (maxHeight && height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }

        if (minWidth && width < minWidth) {
          width = minWidth;
          height = width / ratio;
        }

        if (minHeight && height < minHeight) {
          height = minHeight;
          width = height * ratio;
        }

        // Cropping
        if (minWidth && width < minWidth) {
          width = minWidth;
          isScaledUp = true;
        }
        if (maxWidth && width > maxWidth) {
          width = maxWidth;
          isCropped = true;
        }
        if (minHeight && height < minHeight) {
          height = minHeight;
          isScaledUp = true;
        }
        if (maxHeight && height > maxHeight) {
          height = maxHeight;
          isCropped = true;
        }
      }
      return {
        width: Math.round(width),
        height: Math.round(height),
        isCropped,
        isScaledUp,
      };
    },

    onResize() {

    },
  },
};
export default mixins.MessageViewMixin;
