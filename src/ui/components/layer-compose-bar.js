/**
 * The Layer Composer widget provides the textarea for Layer.UI.components.ConversationView.
 *
 * It provides a self-resizing text area that resizes to the size of the entered text, and sends typing indicators as the user types.
 *
 * Special behaviors to know about:
 *
 * * CSS Class `layer-compose-bar-one-line-of-text`: If there is only a single line's worth of text, then this CSS class is applied to
 *   help center the text
 * * Event `layer-files-selected`: This widget listens for this event, and if it receives it, uses that event to retrieve a file to send in
 *   the Conversation.  Event comes from Layer.UI.components.FileUploadButton or from your custom widgets.
 * * Keyboard Handling: ENTER: Sends message unless its accompanied by a modifier key.  TAB: Enters a \t character unless you
 *   set `Layer.UI.settings.disableTabAsWhiteSpace` to true
 *]
 *
 * ### Importing
 *
 * Included in the default build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-compose-bar';
 * ```
 *
 * ### Replaceable Content
 *
 * Note that replaceable content may be set via:
 *
 * * The `replaceableContent` property
 * * Any Ancestor UI Component's `replaceableContent` property (Layer.UI.components.ConversationView)
 * * DOM nodes with a `layer-replaceable-name` attribute placed within an Ancestor's UI Component
 *
 * The following named regions can be used:
 *
 * * `composerButtonPanelLeft`: Insert a node containing buttons that go to the left of the Compose Bar
 * * `composerButtonPanelRight`: Insert a node containing buttons that go to the right of the Compose Bar
 *
 * ```
 * composeBar.replaceableContent = {
 *   composerButtonPanelRight: "<layer-send-button />",
 *   composerButtonPanelLeft: () => document.createElement('layer-file-upload-button'),
 * };
 * ```
 *
 * @class Layer.UI.components.ComposeBar
 * @extends Layer.UI.Component
 */
import Core from '../../core/namespace';
import { registerComponent } from './component';
import Settings from '../../settings';
import { logger } from '../../utils';
import IsUrl from '../ui-utils/is-url';

const { getClient } = Settings;
const ErrorDictionary = Core.LayerError.ErrorDictionary;
const ENTER = 13;
const TAB = 9;

registerComponent('layer-compose-bar', {
  template: `
    <layer-replaceable-content
      class='layer-button-panel layer-button-panel-left'
      name='composerButtonPanelLeft'>
    </layer-replaceable-content>

    <div class='layer-compose-edit-panel' layer-id='editPanel'>
      <div class='hidden-resizer' layer-id='resizer'>&nbsp;&nbsp;</div>
      <div class='hidden-lineheighter' layer-id='lineHeighter'>&nbsp;</div>
      <textarea rows="1" layer-id='input'></textarea>
    </div>

    <layer-replaceable-content
      class='layer-button-panel layer-button-panel-right'
      name='composerButtonPanelRight'
      layer-id='composerButtonPanelRight'>
      <layer-send-button></layer-send-button>
    </layer-replaceable-content>
  `,

  style: `
    layer-compose-bar {
      display: flex;
      flex-direction: row;
    }
    layer-compose-bar .layer-compose-edit-panel {
      position: relative;
      flex-grow: 1;
      width: 100px; /* Flexbox fix */
      padding: 1px 0px;
    }
    layer-compose-bar textarea, layer-compose-bar .hidden-resizer, layer-compose-bar .hidden-lineheighter {
      min-height: 20px;
      overflow: hidden;
      width: 100%;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 250px;
    }
    layer-compose-bar textarea {
      resize: none;
      outline: none;
      position: absolute;
      z-index: 2;
      top: 0px;
      left: 0px;
      height: 100%;
      overflow-y: auto;
    }
    layer-compose-bar.layer-compose-bar-one-line-of-text textarea {
      overflow-y: hidden;
    }
    layer-compose-bar .hidden-resizer {
      opacity: 0.1;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    layer-compose-bar .layer-compose-edit-panel .hidden-lineheighter {
      top: 0px;
      opacity: 0.1;
      white-space: nowrap;
      position: absolute;
      right: 10000px;
    }
    layer-compose-bar .layer-button-panel .layer-replaceable-inner {
      display: flex;
      flex-direction: row;
      align-items: stretch;
    }
  `,
  properties: {

    /**
     * Specify which Conversation we are sending messages and typing indicators to.
     *
     * @property {Layer.Core.Conversation} [conversation=null]
     */
    conversation: {
      set(value) {
        this._setTypingListenerConversation();
        if (this.manageDisabledState) this.disabled = !(value);
      },
    },

    /**
     * Custom buttons to put in the panel, on the right side.
     *
     * @property {HTMLElement[]} [buttons=[]]
     * @removed
     */


    /**
     * Custom buttons to put in the panel, on the left side.
     *
     * @property {HTMLElement[]} [buttonsLeft=[]]
     * @removed
     */

    /**
     * The text shown in the editor; this is the editor's value.
     *
     * @property {String} [value='']
     */
    value: {
      set(value) {
        const oldValue = this.nodes.input.value;
        this.nodes.input.value = value;
        this.onRender();
        this._triggerChange(value, oldValue);
      },
      get() {
        return this.nodes.input.value;
      },
    },

    /**
     * The text shown in the editor; this is the editor's placeholder.
     *
     * @property {String} [placeholder='']
     */
    placeholder: {
      value: 'Enter a message',
      noGetterFromSetter: true,
      set(value) {
        this.nodes.input.placeholder = value;
        this.onRender();
      },
      get() {
        return this.nodes.input.placeholder;
      },
    },

    /**
     * Boolean indicates if the input area is empty `true` or non-empty `false`.
     *
     * @property {Boolean} [isEmpty=true]
     */
    isEmpty: {
      value: true,
      type: Boolean,
      set(value) {
        this.toggleClass('layer-is-empty', value);
      },
    },

    /**
     * Indicates if the Compose Bar is disabled.
     *
     * This can be directly set using:
     *
     * ```
     * composeWidget.disabled = true;
     * ```
     *
     * However, note that any change to the Layer.UI.components.ComposeBar.conversation property
     * will reset this, and set disabled based on whether or not there is a Conversation present.
     *
     * See Layer.UI.components.ComposeBar.manageDisabledState if your code should solely be responsible
     * for setting the disabled state:
     *
     * ```
     * composeWidget.manageDisabledState = false;
     * composeWidget.disabled = true;
     * ```
     *
     * @property {Boolean} [disabled=false]
     */
    disabled: {
      type: Boolean,
      value: false,
      set(value) {
        this.toggleClass('layer-is-disabled', value);
        this.nodes.input.disabled = value;
        this.nodes.input.placeholder = value ? '' : this.properties.placeholder;
      },
    },

    /**
     * Does the widget manage its own disabled state?
     *
     * See Layer.UI.components.ComposeBar.disabled for more detail.
     *
     * @property {Boolean} [manageDisabledState=true]
     */
    manageDisabledState: {
      type: Boolean,
      value: true,
    },
  },
  methods: {
    /**
     * Constructor.
     *
     * @method onCreate
     * @typescript public
     * @private
     */
    onCreate() {
      // Set here rather than via cssClassList as this is dynamic
      this.classList.add('layer-compose-bar-one-line-of-text');

      // Setting this in the template causes errors in IE 11.
      this.nodes.input.placeholder = this.placeholder;
      this.nodes.input.addEventListener('keydown', this._onKeyDown.bind(this));
      this.nodes.input.addEventListener('input', this._onInput.bind(this));
      this.nodes.input.addEventListener('touchend', this._onFocus.bind(this)); // focus event doesn't refire after keyboard closes and you try to reopen it

      // Event handlers
      this.addEventListener('layer-send-click', this._handleSendClick.bind(this, null));
    },

    /**
     * Whenever the value changes, trigger a `layer-compose-bar-change-value` event.
     *
     * @method _triggerChange
     * @private
     * @param {String} newValue   The current value
     * @param {String} oldValue   The prior value
     */
    _triggerChange(newValue, oldValue) {
      if (newValue === oldValue) return;
      this.properties.value = newValue;

      /**
       * This event is triggered whenever the composer value changes.
       *
       * This is not a cancelable event.
       *
       * ```javascript
       * document.body.addEventListener('layer-compose-bar-change-value', function(evt) {
       *   this.setState({composerValue: evt.detail.newValue});
       * }
       * ```
       *
       * @event layer-compose-bar-change-value
       * @param {Event} evt
       * @param {Object} evt.detail
       * @param {String} evt.detail.newValue
       * @param {String} evt.detail.oldValue
       */
      this.trigger('layer-compose-bar-change-value', { newValue, oldValue });

      this.isEmpty = !(this.value);
    },

    /**
     * Focus on the textarea so keyboard actions enter text into it.
     *
     * Note that this may or may not cause mobile soft-keyboards to open up, but most likely will not.
     *
     * @method focus
     */
    focus() {
      this.nodes.input.focus();
    },

    // Sometimes focus on mobile device will open a keyboard and message list fails to stay stuck to bottom
    _onFocus() {
      this.trigger('layer-compose-bar-focus');
    },

    /**
     * Update the Typing Listener's `conversation` property so that it reports typing activity
     * to the correct Conversation.
     *
     * @method _setTypingListenerConversation
     * @private
     */
    _setTypingListenerConversation() {
      if (!this.properties.typingListener) {
        this.properties.typingListener = getClient().createTypingListener(this.nodes.input);
      }
      this.properties.typingListener.setConversation(this.conversation);
    },

    /**
     * Insure that if a SEND button is used, that focus remains on the text input,
     * and that mobile devices keep the keyboard open.
     *
     * @method _handleSendClick
     * @private
     */
    _handleSendClick() {
      this.send();
      this.focus();
      this.nodes.input.click();
    },

    /**
     * Send the Message that the user has typed in.
     *
     * This is called automatically when the user hits `ENTER`.
     *
     * This can also be called directly:
     *
     * ```
     * widget.send(); // send the current text in the textarea
     * ```
     *
     * @method send
     */
    send() {
      if (this.nodes.input.value) {
        const TextModel = Core.Client.getMessageTypeModelClass('TextModel');
        const LinkModel = Core.Client.getMessageTypeModelClass('LinkModel');
        const textData = {
          text: this.nodes.input.value,
        };
        this.trigger('layer-compose-bar-processing-text', textData);
        const text = textData.text;

        let model;
        if (IsUrl(null, true).test(text)) {
          model = new LinkModel({ url: text });
        } else {
          model = new TextModel({ text });
        }
        if (this.conversation) {
          model.generateMessage(this.conversation, message => this._send(model));
        } else {
          this._send(model);
        }
        this.nodes.input.value = '';
        this._onInput({});
      }
    },

    /**
     * Send a Message using the specified array of models.
     *
     * If its a single Message Type Model, the message will be sent as described in the model.
     *
     * If its an array of Message Type Models, then the models will be sent within a Carousel Message.
     *
     * ```
     * widget.sendModels(models);
     * ```
     *
     * Note that any text in the Text Area will be ignored when sending this.
     *
     * @param {Layer.Core.MessageTypeModel[]} models
     */
    sendModels(models) {
      if (models.length === 0) {
        // no-op
      } else if (models.length === 1) {
        if (this.conversation) {
          models[0].generateMessage(this.conversation, message => this._send(models[0]));
        } else {
          this._send(models[0]);
        }
      } else {
        const CarouselModel = Core.Client.getMessageTypeModelClass('CarouselModel');
        const model = new CarouselModel({
          items: models,
        });
        if (this.conversation) {
          model.generateMessage(this.conversation, message => this._send(model));
        } else {
          this._send(model);
        }
      }
    },

    /**
     * This event is triggered before any Message is sent; used to control notifications and override sending.
     *
     * You can use this event to control the notifications by modifying the `evt.detail.notification` object.
     * Note that you should modify the object but not try to replace the object.
     *
     * ```javascript
     * document.body.addEventListener('layer-send-message', function(evt) {
     *   var model = evt.detail.model;
     *   var notification = evt.detail.notification;
     *
     *   notification.title = 'You have a new Message from ' + message.sender.displayName;
     *   notification.sound = 'sneeze.aiff';
     *   notification.text = model.text || model.title || 'New Message';
     * }
     * ```
     *
     * You can also use this event to provide your own logic for sending the Message.
     *
     * ```javascript
     * document.body.addEventListener('layer-send-message', function(evt) {
     *   var model = evt.detail.model;
     *
     *   // Prevent the message from being sent
     *   evt.preventDefault();
     *
     *   // Perform some custom (possibly async) actions and manipulate the message before sending it
     *   myAsyncLookup(function(result) {
     *     var part = new Layer.Core.MessagePart({
     *       mimeType: 'application/json',
     *       body: result
     *     });
     *     model.message.addPart(part);
     *     model.send({
     *         conversation: myConversation,
     *         notification: evt.detail.notification
     *     });
     *   });
     * });
     * ```
     *
     * @event layer-send-message
     * @param {Event} evt
     * @param {Object} evt.detail
     * @param {Layer.Core.MessageTypeModel} evt.detail.model     Message Type Model for the message being sent
     * @param {Layer.Core.Conversation} [evt.detail.conversation=null]  The conversation that the message was created on; may be null if no conversation has been set.
     * @param {Object} evt.detail.notification         Standard Notification structure defined for Layer.Core.MessageChannel.send
     * @param {String} evt.detail.notification.text
     * @param {String} evt.detail.notification.title
     * @param {String} evt.detail.notification.sound
     */

    /**
     * The _send method takes a MessageTypeModel, adds a notification, and either sends it or allows the app to send it.
     *
     * If the Compose Bar does not have a Layer.Core.Conversation, then the model will not have a Message associated
     * with it, and will not be ready to sendIf there is no Message (happens when the Compose Bar
     * does not have an associated ), then it is ok to provide a `null` Message.  The result will
     * not send a Layer.Core.Message, but will allow the event handler to handle it and create a Conversation if needed.
     *
     * @method _send
     * @private
     * @param {Layer.Core.MessageTypeModel} model
     */
    _send(model) {
      if (!model) throw new Error(ErrorDictionary.modelParamRequired);

      const notification = model.getNotification();

      if (this.trigger('layer-send-message', {
        model,
        notification,
        conversation: this.conversation,
      })) {
        if (!this.conversation) {
          logger.error('LAYER-COMPOSE-BAR: Unable to send message without a conversationId');
        } else if (this.conversation instanceof Core.Channel) {
          this.onSend(model);
        } else {
          this.onSend(model, notification);
        }
      }
    },

    /**
     * MIXIN HOOK: Called just before sending a message.
     *
     * @method onSend
     * @param {Layer.Core.MessageTypeModel} model
     * @param {Object} notification   See Layer.Core.Message.send for details on the notification object
     */
    onSend(model, notification) {
      model.send({
        conversation: this.conversation,
        notification,
      });
    },

    /**
     * On ENTER call `send()`; on TAB enter some spacing rather than leaving the text area.
     *
     * @method _onKeyDown
     * @private
     */
    _onKeyDown(event) {
      if (event.keyCode === ENTER) {
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.send();
        } else {
          event.target.value += '\n';
          this._onInput(event);
        }
      } else if (!Settings.disableTabAsWhiteSpace && event.keyCode === TAB && !event.shiftKey) {
        event.preventDefault();
        event.target.value += '\t  ';
        this._onInput(event);
      }
    },

    /**
     * Any time the input field changes this method causes appropriate UI adjustments and events
     *
     * @method _onInput
     * @private
     * @param {Event} event
     */
    _onInput(event) {
      this.onRender();
      this._triggerChange(this.nodes.input.value, this.properties.value);
    },

    /**
     * On any change in value, recalculate our height and lineHeight to fit the input text.
     *
     * @method onRender
     */
    onRender() {
      setTimeout(() => {
        this.nodes.resizer.innerHTML = this.nodes.input.value.replace(/\n/g, '<br/>') || '&nbsp;';
        this.nodes.lineHeighter.innerHTML = this.nodes.input.value.replace(/\n/g, '<br/>') || '&nbsp;';
        const willBeOneLine = !this.nodes.input.value.match(/\n/) &&
          (this.nodes.resizer.clientHeight - this.nodes.lineHeighter.clientHeight < 10);

        // Prevent scrollbar flickering in and then out
        if (willBeOneLine) {
          this.nodes.input.style.overflow = 'hidden';
          setTimeout(() => { this.nodes.input.style.overflow = ''; }, 1);
        }

        this.toggleClass('layer-compose-bar-one-line-of-text', willBeOneLine);
      }, 10);
    },

    /**
     * Send some attachments; called from the {@link Layer.UI.components.FileUploadButton}.
     *
     * @method onModelsGenerated
     * @param {Layer.Core.MessageTypeModel[]} models
     */
    onModelsGenerated(models) {
      this.sendModels(models);
    },
  },
});

