/**
 * A dialog for showing a Message Type Model in an expanded full (or near-full) screen view.
 *
 * ### Importing
 *
 * Included with the standard build. For custom build,  import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/layer-message-viewer-expanded
 * ```
 *
 * @class Layer.UI.messages.MessageViewerExpanded
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.Clickable
 */
import { registerComponent } from '../components/component';
import Clickable from '../mixins/clickable';


registerComponent('layer-message-viewer-expanded', {
  mixins: [Clickable],
  style: `layer-message-viewer-expanded {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    box-sizing: border-box;
  }
  layer-message-viewer-expanded .layer-message-viewer-expanded-inner {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
  }
  layer-message-viewer-expanded .layer-message-viewer-expanded-inner > * {
    flex-grow: 1;
  }
  layer-message-viewer-expanded .layer-message-viewer-expanded-inner >
    layer-titled-display-container > .layer-card-top {
    height: 100%;
  }
  `,
  template: '<div class="layer-message-viewer-expanded-inner" layer-id="inner"></div>',

  properties: {
    /**
     * The Message Type Model to render.
     *
     * @property {Layer.Core.MessageTypeModel} model
     */
    model: {},

    /**
     * The action data of the button or Message that was used to open this expanded viewer.
     *
     * @property {Object}
     */
    openActionData: {},

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
  },
  methods: {
    // Lifecycle method: Setup event handlers and local variables
    onCreate() {
      // Last `true` argument prevents `evt.preventDefault()` from being called
      // on touch events that occur within the dialog
      this.addClickHandler('dialog-click', this, this._onClick.bind(this), true);
      this.addEventListener('touchmove', this.onTouchMove.bind(this));
      this.properties.boundPopStateListener = this._popStateListener.bind(this);
    },

    // Lifecycle method; if managing the pop state, setup the pop state event listener;
    onAfterCreate() {
      // If we are managing pop state, then push our state to the history, and listen for it to be popped.
      if (this.managePopState) {
        history.pushState({ dialog: this.model.id }, '');
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
        if (history.state && history.state.dialog && history.state.dialog === this.model.id) {
          history.back();
        }
      }

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
      this.destroy();
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

    // Lifecycle method: roughly identical to <layer-message-viewer />
    onRender() {
      const cardUIType = this.model.currentMessageRendererExpanded;
      this.classList.add(cardUIType);
      if (this.parentComponent && this.parentComponent.isMessageListItem) {
        this.parentComponent.classList.add('layer-message-item-' + cardUIType);
      }
      const cardUI = this.createElement(cardUIType, {
        model: this.model,
        messageViewer: this,
        noCreate: true,
        openActionData: this.openActionData,
      });
      this.nodes.ui = cardUI;

      const cardContainerClass = this.nodes.ui.messageViewContainerTagName;
      if (cardContainerClass) this.classList.add(cardContainerClass);

      if (cardContainerClass) {
        const cardContainer = this.createElement(cardContainerClass, {
          model: this.model,
          ui: cardUI,
          openActionData: this.openActionData,
          parentNode: this.nodes.inner,
          name: 'cardContainer',
          isCloseButtonShowing: true,
          noCreate: true, // tells createElement not to call _onAfterCreate just yet
        });
        cardContainer.ui = cardUI;
        cardUI.parentComponent = cardContainer;
      } else {
        this.nodes.inner.appendChild(cardUI);
      }

      if (typeof CustomElements !== 'undefined') CustomElements.takeRecords();
      if (this.nodes.cardContainer) this.nodes.cardContainer._onAfterCreate();
      if (cardUI._onAfterCreate) cardUI._onAfterCreate();
      if (this.nodes.cardContainer) cardUI._setupContainerClasses();
    },
  },
});
