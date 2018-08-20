/**
 * The Message Viewer (`<layer-message-viewer />`) is a Message Handler that handles all standard Messages.
 *
 * A standard message is assumed to have a single Message Part whose `role` is `root` and which represents
 * a Layer.Core.MessageTypeModel.
 *
 * A Message Viewer can be instantiated with *either* a:
 *
 * * `message`: A model is generated/retrieved for this message using the Root MessagePart for this Message
 * * `model`: The model unambiguously specifies what `message` and what `rootPart` are to be used for this Message Viewer
 *
 * Note that if using a `model` that does not have a message, best practice is to create a message but
 * not send it; you should call `message.presend()` if rendering this within a Message List.
 *
 * ```
 * var model = new TextModel({ text: "Howdy" });
 * model.generateMessage(conversation, (message) => {
 *   messageViewer.model = model;  // model.message will be accessed by the Viewer
 * });
 * ```
 *
 * @class Layer.UI.handlers.message.MessageViewer
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 * @mixin Layer.UI.mixins.SizeProperty
 */
import { registerComponent } from '../../components/component';
import MessageHandler from '../../mixins/message-handler';
import Clickable from '../../mixins/clickable';
import SizeProperty from '../../mixins/size-property';
import Settings from '../../../settings';
import { handlers as messageActionHandlers } from '../../message-actions';
import { register } from './message-handlers';
import { getWhereClicked } from '../../ui-utils/analytics';

const { conversationViewWidths, getClient } = Settings;

registerComponent('layer-message-viewer', {
  mixins: [MessageHandler, Clickable, SizeProperty],
  style: `layer-message-viewer {
    display: inline-flex;
    flex-direction: row;
    align-items: stretch;
    position: relative;
  }
  `,

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    /**
     * Set the size class of the Message, either "medium" or "large".
     *
     * This is not currently a dynamically changable property; this is currently only set during initialization.
     *
     * @property {String} size
     */
    size: {
      value: 'medium',
    },

    supportedSizes: {
      value: ['medium', 'large'],
    },

    /**
     * The model to be rendered by some UI within this Viewer.
     *
     * @property {Layer.Core.MessageTypeModel} model
     */
    model: {
      set(model) {
        if (model.message !== this.properties.message) {
          this.message = model.message;
        } else if (!model.message) {
          this._setupMessage();
        }
      },
    },

    /**
     * The message being rendered either in its entirety, or some subtree of content within it.
     *
     * The message determines what is being rendered; but the specific
     * model identifies a Message Part within it that has a position within the Message Part
     * tree and determines what part of the message this UI Component will render.
     *
     * @property {Layer.Core.Message} message
     */
    message: {
      set(message) {
        const model = (message && !this.properties.model) ? message.createModel() : null;
        if (model) {
          this.classList.remove('layer-model-not-supported');
          this.properties.model = model;
          if (this.properties._internalState.onAfterCreateCalled) {
            this._setupMessage();
          }
        } else if (!this.model) {
          this.classList.add('layer-model-not-supported');
          this.innerHTML = this.modelNotSupported + (this.message.getRootPart() || this.message.findPart()).mimeType;
        }
      },
    },

    /**
     * This property primarily exists so that one can set/override the messageViewContainerTagName on
     * individual Card UIs.
     *
     * Currently can only be used to replace 'layer-standard-view-container' with a custom value.
     *
     * @property {String} messageViewContainerTagName
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,

      // If the property is set, indicate that its been explicitly set
      set(inValue) {
        this.properties.messageViewContainerTagNameIsSet = true;
      },

      // Get the UI Node's preferred Display Container... unless this component's messageViewContainerTagName has been set
      get() {
        if (this.properties.messageViewContainerTagNameIsSet) return this.properties.messageViewContainerTagName;
        return this.nodes.ui.messageViewContainerTagName;
      },
    },

    /**
     * Possible values are:
     *
     * * standard: full border with rounded corners
     * * list: top border only, no radius
     * * rounded-top: full border, rounded top, square bottom
     * * rounded-bottom: full border, rounded bottom, square top
     * * none: no border
     *
     * @property {String} cardBorderStyle
     */
    cardBorderStyle: {
      set(newValue, oldValue) {
        if (oldValue) {
          this.classList.remove('layer-card-border-' + oldValue);
        }
        if (newValue) {
          this.classList.add('layer-card-border-' + newValue);
        }
      },
    },

    /**
     * Width of the View in pixels; leave unset to let it adjust its size to its content.
     *
     * @property {Number} [type=]
     */
    width: {
      set(value) {
        this.style.width = value + 'px';
        this.trigger('message-width-change');
      },
    },

    modelNotSupported: {
      value: 'No model registered to handle MIME Type: ',
    },
    isRootModel: {
      set(value) {
        if (value) this.classList.add('layer-root-viewer');
      },
    },
  },
  methods: {
    // Standard lifecycle event insures that _handleSelection will be called when clicked
    onCreate() {
      this.addClickHandler('message-click', this, this._handleSelection.bind(this), false, true);
    },

    // Standard lifecycle event insures that setupMessage is called
    onAfterCreate() {
      if (this.message) this._setupMessage();
    },

    /**
     * Given a message and a model, generate the UI Component and a Display Container.
     *
     * @method _setupMessage
     * @private
     */
    _setupMessage() {
      if (!this.model) return;
      if (this.firstChild) this.innerHTML = '';

      // The rootPart is typically the Root Part of the message, but the Card View may be asked to render subcards
      // Clearly differentiate a top level Root Part from subparts using the layer-root-viewer css class
      if (!this.message || this.model.part === this.message.getRootPart()) this.isRootModel = true;

      let cardUIType;
      if (this.size === 'medium') {
        cardUIType = this.model.currentMessageRenderer;
      } else if (this.size === 'large') {
        cardUIType = this.model.currentLargeMessageRenderer || this.model.currentMessageRenderer;
      }

      this.classList.add(cardUIType);
      if (this.parentComponent && this.parentComponent.isMessageListItem) {
        this.parentComponent.classList.add('layer-message-item-' + cardUIType);
      }
      let titleBar;

      // All Large Messages get a title bar built in (can be hidden via CSS if needed)
      // All Large Message Sub-views however should not get their own title bar
      if (this.size === 'large' && (!this.parentNode || !this.closest.call(this.parentNode, 'layer-message-viewer'))) {
        titleBar = document.createElement('layer-title-bar');
        this.nodes.titlebar = titleBar;
        this.appendChild(titleBar);
      }

      const cardUI = this.createElement(cardUIType, {
        model: this.model,
        messageViewer: this,
        noCreate: true,
      });
      this.nodes.ui = cardUI;
      if (titleBar) {
        titleBar.view = cardUI;
        if (cardUI.getIconClass) titleBar.iconClass = cardUI.getIconClass();
        if (cardUI.getIcon) titleBar.icon = cardUI.getIcon();
        if (cardUI.getTitle) titleBar.title = cardUI.getTitle();
      }

      const cardContainerClass = this.messageViewContainerTagName;
      if (this.messageViewContainerTagName) this.classList.add(this.messageViewContainerTagName);

      if (cardContainerClass) {
        const cardContainer = this.createElement(cardContainerClass, {
          model: this.model,
          ui: cardUI,
          parentNode: this,
          name: 'cardContainer',
          noCreate: true, // tells createElement not to call _onAfterCreate just yet
        });
        cardContainer.ui = cardUI;
        cardUI.parentComponent = cardContainer;
        this.cardBorderStyle = this.properties.cardBorderStyle || cardContainer.cardBorderStyle || 'standard';
      } else {
        this.appendChild(cardUI);
        this.cardBorderStyle = this.properties.cardBorderStyle || cardUI.cardBorderStyle || 'standard';
      }

      if (typeof CustomElements !== 'undefined') CustomElements.upgradeAll(this);
      if (this.nodes.cardContainer) this.nodes.cardContainer._onAfterCreate();
      if (cardUI._onAfterCreate) cardUI._onAfterCreate();
      if (this.nodes.cardContainer) cardUI._setupContainerClasses();
      if (cardUI.hideMessageItemRightAndLeftContent && this.parentComponent) {
        this.parentComponent.classList.add('layer-message-item-hide-replaceable-content');
        cardUI.onRerender();
      }
    },

    /**
     * When the user taps/clicks/selects this Message, call `runAction()`
     *
     * @method _handleSelection
     * @private
     * @param {Event} evt
     */
    _handleSelection(evt) {
      evt.stopPropagation();
      this._runAction({});
    },

    /**
     * Initiates the execution of action handlers upon this Message.
     *
     * When called from an actionButton, an options argument is provided with that button's
     * actionEvent and actionData properties.
     *
     * @method _runAction
     * @private
     * @param {Object} action
     * @param {String} action.event   Event name
     * @param {Object} action.data    Data to use when processing the event, in addition to the model's data
     */
    _runAction(action) {
      if (this.size === 'large') return; // For now, there is no action performed when users tap on a Large Message Viewer

      getClient()._triggerAsync('analytics', {
        type: 'message-selected',
        size: this.size,
        where: getWhereClicked(this),
        message: this.message,
        model: this.model,
        modelName: this.model.getModelName(),
        actionEvent: this.model.actionEvent,
        actionData: this.model.actionData,
      });

      if (this.nodes.ui.runAction && this.nodes.ui.runAction(action)) return;

      const event = action && action.event ? action.event : this.model.actionEvent;

      // If there is no event, do nothing... though do bubble this up to the parent message viewer if this is a sub-viewer
      if (!event) {
        const parent = this.closest.call(this.parentNode, 'layer-message-viewer');
        if (parent) parent._runAction(action);
        return;
      }

      const actionData = action && action.data ? action.data : this.model.actionData; // TODO: perhaps merge action.data with actionData?
      const rootModel = this.message ? this.message.getRootPart().createModel() : null;

      const args = {
        model: this.model,
        rootModel,
        data: actionData,
        messageViewer: this,
      };

      // Trigger an event based on the event name; trigger returns false if evt.preventDefault() was called
      const actionHandlerAllowed = this.nodes.ui.trigger(event, args);

      // If evt.preventDefault() was not called then invoke any registered action handler
      if (actionHandlerAllowed && messageActionHandlers[event]) {
        messageActionHandlers[event].call(null, args);
      }
    },

    /**
     * When the Message Viewer is placed within a Dialog or other container that wants icon/title,
     * this method acts as a proxy for getting that information from the Message Type View.
     *
     * @method getIconClass
     * @returns {String}
     */
    getIconClass() {
      return this.nodes.ui && this.nodes.ui.getIconClass ? this.nodes.ui.getIconClass() : null;
    },

    /**
     * When the Message Viewer is placed within a Dialog or other container that wants icon/title,
     * this method acts as a proxy for getting that information from the Message Type View.
     *
     * Expected to return either a string representing an SVG image, or an HTMLElement of type `<svg />`
     *
     * @method getIconClass
     * @returns {String | HTMLElement}
     */
    getIcon() {
      return this.nodes.ui && this.nodes.ui.getIcon ? this.nodes.ui.getIcon() : null;
    },

    /**
     * When the Message Viewer is placed within a Dialog or other container that wants icon/title,
     * this method acts as a proxy for getting that information from the Message Type View.
     *
     * @method getTitle
     * @returns {String}
     */
    getTitle() {
      return this.nodes.ui && this.nodes.ui.getTitle ? this.nodes.ui.getTitle() : null;
    },

    /**
     * When the Message Viewer is placed within a Dialog we may add CSS classes to the dialog itself
     * to influence the dialog's sizing/styling. By default, it simply provides its UIs
     * tag name as the CSS class
     *
     * @method getDialogClass
     * @returns {String}
     */
    getDialogClass() {
      return this.nodes.ui.tagName.toLowerCase();
    },

    /**
     * Get the width available to the Message Viewer within its parent.
     *
     * Offset value to account for rules on how much of a Message List its allowed to use.
     *
     * @method getAvailableMessageWidth
     * @returns {Number}
     */
    getAvailableMessageWidth() {
      if (this.parentComponent) {
        if (this.parentComponent.classList.contains('layer-message-item')) {
          let width = this.parentNode.clientWidth;
          if (width === 0) {
            // If no width yet, get the message-list's width minus the usual 8px margin on each side
            // This errs on providing more space as its actually 12px for wider screens, but wider screens
            // typically don't need the full width.
            width = this.parentComponent.parentComponent.clientWidth - 16;
          }

          // 95%, 80% and 70% must be changed both here and in layer-message-viewer.less
          if (
            this.nodes.ui.hideMessageItemRightAndLeftContent ||
            width < conversationViewWidths.medium
          ) {
            return Math.round(width * 0.95);
          } else if (width < conversationViewWidths.large) {
            return Math.round(width * 0.8);
          } else {
            return Math.round(width * 0.7);
          }
        } else if (this.parentComponent.getAvailableMessageWidth) {
          return this.parentComponent.getAvailableMessageWidth(this);
        }
      }

      return this.parentNode.clientWidth;
    },

    /**
     * Get the width available to the Message Viewer without accounting for rules for how much width the Message List allows.
     *
     * @method getFullAvailableMessageWidth
     * @returns {Number}
     */
    getFullAvailableMessageWidth() {
      return this.parentNode ? this.parentNode.clientWidth : 300;
    },

    /**
     * Find the root Message Viewer; typically returns `this` but if `this` is a child Message Viewer
     * then will return its root ancestor Message Viewer.
     *
     * @method getRootMessageViewer
     * @returns {Layer.UI.handlers.message.MessageViewer}
     */
    getRootMessageViewer() {
      let lastNode = this;
      let node = this;
      while (node && node.parentNode) {
        lastNode = node;
        node = this.closest.call(node.parentNode, 'layer-message-viewer'); // IE 11 may not have parentNode.closest()
      }
      return lastNode;
    },
  },
});

register({
  handlesMessage(message, container) {
    return Boolean(message.getRootPart());
  },
  tagName: 'layer-message-viewer',
  order: undefined,
});
