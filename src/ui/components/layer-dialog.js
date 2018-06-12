/**
 * Floating modal dialog for containing arbitrary content.
 *
 * ```
 * var dialog = document.createElement('layer-dialog');
 * dialog.replaceableContent = {
 *   content: arbitraryDomNodes
 * };
 * dialog.isCloseButtonShowing = true;
 *
 * document.body.appendChild(dialog);
 * ```
 *
 * This dialog is not designed to hide/show/hide/show.  Its either present in the DOM structure in which case
 * its visible, or its been removed from the DOM structure (done and gone).
 *
 * Quick way to dismiss the dialog:
 *
 * ```
 * dialog.destroy();
 * ```
 *
 * The dialog listens to its child components for a `layer-container-done` event, and will close on detecting this event.
 * Thus a component within a dialog might implement a Save method as:
 *
 * ```
 * onSave(result) {
 *   this.model.responses.addState('result', result);
 *   this.trigger('layer-container-done');
 * }
 * ```
 *
 * @class Layer.UI.components.Dialog
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from './component';
import './layer-title-bar';
import Clickable from '../mixins/clickable';
import { generateUUID } from '../../utils';
import { isInBackground } from '../ui-utils';
import { client } from '../../settings';

registerComponent('layer-dialog', {
  mixins: [Clickable],
  template: `
    <div class="layer-dialog-inner" layer-id="inner">
      <layer-title-bar layer-id="titleBar">
        <div layer-replaceable-name="buttons">
          <div layer-id='close' class="layer-title-close-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path class="layer-close-button-line" d="M38 12.83L35.17 10 24 21.17 12.83 10 10 12.83 21.17 24 10 35.17 12.83 38 24 26.83 35.17 38 38 35.17 26.83 24z"/>
                <path d="M0 0h48v48H0z" fill="none"/>
            </svg>
          </div>
        </div>
      </layer-title-bar>
      <layer-replaceable-content name='content' layer-id='content' class='layer-dialog-content-container'>
      </layer-replaceable-content>
    </div>
  `,
  style: `
    layer-dialog {
      position: absolute;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      top: 0px;
      left: 0px;
    }
    layer-dialog .layer-dialog-inner {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
    }

    layer-dialog:not(.layer-show-close-button) .layer-title-close-button {
      display: none;
    }
    layer-dialog .layer-dialog-content-container {
      flex-grow: 1;
      height: 100px; /* Flexbox workaround */
      display: flex;
      flex-direction: column;
    }
    layer-dialog .layer-dialog-content-container > * {
      flex-grow: 1;
    }
    layer-dialog .layer-dialog-content {
      width: 100%;
      max-width: 100%;
    }
    layer-dialog > .layer-dialog-inner > layer-title-bar {
      display: none;
    }
    layer-dialog.layer-dialog-titlebar-showing > .layer-dialog-inner > layer-title-bar {
      display: flex;
      flex-direction: row;
      box-sizing: border-box;
      width: 100%;
    }
  `,
  properties: {
    /**
     * Does this component list for popstate events and use `history.pushState()`?
     *
     * Use of this may conflict with your app's own manipulations of these... however,
     * when the user hits the back button on a mobile device, its nice to have it dismiss this dialog.
     *
     * TODO: User clicking back AFTER this dialog is dismissed will have at least one no-op back click
     * this should be fixed.
     *
     * @property {Boolean} [managePopState=true]
     */
    managePopState: {
      type: Boolean,
      value: true,
    },

    /**
     * Title for the titlebar; comes from `this.properties.ui.getTitle()`
     *
     * @property {String} title
     */
    title: {
      set(title) {
        this.nodes.titleBar.title = title;
        this._updateTitlebarShowing();
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
        if (icon) this.nodes.titleBar.icon = icon;
        this._updateTitlebarShowing();
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
        this._updateTitlebarShowing();
      },
    },

    /**
     * Shortcut for reading the dialog's content; use Replaceable Content for
     * setting the the content.
     *
     * @readonly
     * @property {HTMLElement} content
     */
    content: {},

    /**
     * Are animations enabled.
     *
     * Set to `false` to disable animations:
     *
     * ```
     * Layer.init({
     *   mixins: {
     *     'layer-dialog': {
     *       properties: {
     *         animationEnabled: {
     *           value: true,
     *         }
     *       }
     *     }
     *   }
     * });
     * ```
     *
     * @property {Boolean} [isAnimationEnabled=true]
     */
    isAnimationEnabled: {
      value: true,
    },

    /**
     * Informational property only; if it has a model then this Dialog is being used to render the model or something closely related to it.
     *
     * @property {Layer.Core.MessageTypeModel} model
     */
    model: {},
  },
  methods: {
    onCreate() {
      // Read in its layer-id nodes such as the close button
      this.nodes.titleBar._onAfterCreate();

      if (this.isAnimationEnabled) {
        this.classList.add('layer-dialog-showing');
      }

      // Last `true` argument prevents `evt.preventDefault()` from being called
      // on touch events that occur within the dialog
      this.addEventListener('layer-container-done', this.hideAndDestroy.bind(this));
      this.addEventListener('layer-container-reduce-height', this._reduceMaxHeightTo.bind(this));
      this.addClickHandler('dialog-click', this, this._onClick.bind(this), true);
      this.addEventListener('touchmove', this.onTouchMove.bind(this));
      this.addEventListener('animationend', this._onAnimationEnd.bind(this), false);
      this.properties.boundPopStateListener = this._popStateListener.bind(this);
      if (!this.id) this.id = generateUUID();
    },

    _onAnimationEnd(evt) {
      if (evt.animationName === 'layer-dialog-fade-out') this.destroy();
    },

    // Lifecycle method
    onAfterCreate() {
      this.addClickHandler('close-click', this.nodes.titleBar.nodes.close, this.onCloseClick.bind(this));

      // this.replaceableContent is the settings that configures what replaceable content is setup for this
      // dialog's content.  If its been setup, then its either going to be an HTMLElement that we can just use
      // as-is, or a String, which is used to insert something into this.nodes.content.firstChild
      // (so get its firstChild)
      if (this.replaceableContent.content instanceof HTMLElement) {
        this.properties.content = this.replaceableContent.content;
      } else if (this.nodes.content.firstChild.firstChild instanceof HTMLElement) {
        this.properties.content = this.nodes.content.firstChild.firstChild;
      } else {
        // The contents are probably a text node which are not something we can add/remove classes to or otherwise
        // manipulate as needed
        this.properties.content = this.nodes.content.firstChild;
      }

      // Tell the content that its content for a dialog (probably not necessary, but does simplify some CSS rules)
      if (this.properties.content) {
        this.properties.content.classList.add('layer-dialog-content');
        if (this.content.getDialogClass) {
          this.classList.add(this.content.getDialogClass());
        }
      }

      const content = this.properties.content;
      if (content.getTitle) {
        this.nodes.titleBar.title = content.getTitle();
      }

      if (content.getIconClass) {
        this.icon = content.getIconClass();
      }

      // If we are managing pop state, then push our state to the history, and listen for it to be popped.
      // This allows us to support android back button to dismiss the dialog
      if (this.managePopState) {
        history.pushState({ dialog: this.id }, '');
        window.addEventListener('popstate', this.properties.boundPopStateListener);
      }

      // If our parent component is a `layer-conversation-view` then listen for its conversation change event and
      // call our onConversationClose handler.
      if (this.parentComponent && this.parentComponent.tagName === 'LAYER-CONVERSATION-VIEW') {
        const props = this.properties;
        props.onConversationClose = this.onClose.bind(this);
        props.conversationView = this.parentComponent;
        props.conversationView.addEventListener('layer-conversation-panel-change', props.onConversationClose);
      }

      if (this.model) {
        client._triggerAsync('analytics', {
          type: 'message-viewed',
          size: 'large',
          where: 'dialog',
          message: this.model.message,
          model: this.model,
          modelName: this.model.getModelName(),
          wasUnread: this.model.message.isUnread,
          inBackground: isInBackground(),
        });
      }
    },


    /**
     * Set the titlebar to show if there is something in the titlebar to be shown; else let its display be none.
     *
     * @private
     * @method _updateTitlebarShowing
     */
    _updateTitlebarShowing() {
      this.toggleClass('layer-dialog-titlebar-showing', (this.title || this.icon || this.isCloseButtonShowing));
    },

    /**
     * If the back button is clicked, close this dialog.
     *
     * @method _popStateListener
     * @private
     * @param {Event} evt
     */
    _popStateListener(evt) {
      this.destroy();
    },

    /**
     * If the user clicks on the dialog... and specifically on the dialog's background, trigger its {@link #onDialogBackgroundClick} mixin.
     *
     * @method _onClick
     * @private
     * @param {Event} evt
     */
    _onClick(evt) {
      if (evt.target === this) {
        this.onDialogBackgroundClick();
        evt.stopPropagation(); // do not propagate up to the Conversation View
      }
    },

    /**
     * Mixin Hook: When the user clicks on the Dialog's background, close the dialog.
     *
     * You can use this mixin to provide your own handling of this click.
     *
     * @method onDialogBackgroundClick
     */
    onDialogBackgroundClick() {
      this.onClose();
    },

    // Lifecycle method
    onDestroy() {
      // If managing the popState, remove event listeners, and IF our state is the current state in history, remove it.
      // Unfortunately, the app may have pushed a new state of its own, and we don't dare mess about with history in that case.
      if (this.managePopState) {
        window.removeEventListener('popstate', this.properties.boundPopStateListener);
        if (history.state && history.state.dialog && history.state.dialog === this.id) {
          history.back();
        }
      }

      // Cleanup event handlers around tracking conversation changes
      if (this.properties.onConversationClose) {
        const props = this.properties;
        props.conversationView.removeEventListener('layer-conversation-panel-change', props.onConversationClose);
        delete props.conversationView;
        delete props.onConversationClose;
      }
    },

    /**
     * Mixin Hook: When the dialog is closing, its closed by being destroyed.
     *
     * @method onClose
     */
    onClose() {
      this.hideAndDestroy();
    },

    /**
     * Mixin Hook: This method is used to prevent mobile devices from shifting the dialog around the screen.
     *
     * @method onTouchMove
     * @param {Event} evt
     */
    onTouchMove(evt) {
      if (evt.target === this || evt.target === this.firstChild) evt.preventDefault();
      evt.stopPropagation();
    },

    /**
     * Mixin Hook: On clicking the close button, destroy the parent component (the dialog)
     *
     * @method onCloseClick
     */
    onCloseClick() {
      this.hideAndDestroy();
    },

    hideAndDestroy() {
      if (this.isAnimationEnabled) {
        this.classList.add('layer-dialog-hiding');
      } else {
        this.destroy();
      }
    },

    onAttach() {
      if (this.properties.requestedAltMaxHeight) {
        this.reduceMaxHeightTo(this.properties.requestedAltMaxHeight);
        this.properties.requestedAltMaxHeight = null;
      }
    },

    _reduceMaxHeightTo(evt) {
      this.reduceMaxHeightTo(evt.detail.height);
    },

    reduceMaxHeightTo(altMaxHeight) {
      if (!this.properties._internalState.onAttachCalled) {
        this.properties.requestedAltMaxHeight = altMaxHeight;
        return;
      }
      altMaxHeight += this.nodes.titleBar.clientHeight;
      const styles = getComputedStyle(this.nodes.inner);
      const maxHeight = parseInt(styles.getPropertyValue('max-height'), 10);
      if (altMaxHeight < maxHeight) this.nodes.inner.style.maxHeight = altMaxHeight + 'px';
    },

    /**
     * Get the width available to the Message Viewer within this dialog.
     *
     * @method getAvailableMessageWidth
     * @param {Layer.UI.handlers.message.MessageViewer} messageViewer
     * @returns {Number}
     */
    getAvailableMessageWidth(messageViewer) {
      return this.nodes.inner.clientWidth;
    },
  },
});
