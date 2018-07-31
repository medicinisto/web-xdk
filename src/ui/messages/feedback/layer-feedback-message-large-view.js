/**
 * large view for the Feedback Message
 *
 * When user has completed process, will trigger `layer-container-done` event:
 *
 * ```
 * document.body.addEventListener('layer-container-done', function() {
 *    closeLargeMessageViewer();
 * });
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-view';
 * ```
 *
 * @class Layer.UI.messages.FeedbackMessagelargeView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @mixin Layer.UI.mixins.Clickable
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Clickable from '../../mixins/clickable';
import { get as getGraphic } from '../../resources/graphics/';
import '../../resources/graphics/star';
import '../../resources/graphics/feedback';

// Snippet from https://stackoverflow.com/questions/2848462/count-bytes-in-textarea-using-javascript/12206089#12206089
function getUTF8Length(s) {
  let len = 0;
  let i;
  let code;
  for (i = 0; i < s.length; i++) {
    code = s.charCodeAt(i);
    if (code <= 0x7f) {
      len += 1;
    } else if (code <= 0x7ff) {
      len += 2;
    } else if (code >= 0xd800 && code <= 0xdfff) {
      // Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
      // (Assume next char is the other [valid] half and just skip it)
      len += 4; i++;
    } else if (code < 0xffff) {
      len += 3;
    } else {
      len += 4;
    }
  }
  return len;
}


registerComponent('layer-feedback-message-large-view', {
  mixins: [MessageViewMixin, Clickable],
  template: `
    <div class='layer-feedback-message-view-label'>
      <span layer-id='label'></span>
      <layer-date
        today-format='{"hour": "2-digit","minute": "2-digit"}'
        week-format='{"weekday": "long"}'
        default-format='{"month": "long", "day": "numeric"}'
        older-format='{"year": "numeric", "month": "long"}'
        layer-id='ratedAt'></layer-date>
    </div>
    <div class='layer-feedback-message-view-ratings' layer-id='ratings'></div>
    <textarea class='layer-feedback-message-view-input' layer-id='input' placeholder='Add a comment...'></textarea>
    <div class='layer-feedback-message-view-comment' layer-id='comment'></div>
    <layer-action-button layer-id='button' text='Send'></layer-action-button>
  `,
  style: `
  layer-feedback-message-large-view {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    overflow-y: auto;
  }
  layer-feedback-message-large-view .layer-feedback-message-view-input {
    flex-grow: 1;
  }
  layer-feedback-message-large-view:not(.layer-feedback-enabled) layer-action-button {
    display: none;
  }
  layer-feedback-message-large-view:not(.layer-feedback-enabled) .layer-feedback-message-view-input {
    display: none;
  }
  layer-feedback-message-large-view layer-date {
    display: none;
  }
  layer-feedback-message-large-view:not(.layer-feedback-enabled) layer-date {
    display: block;
  }
  layer-feedback-message-large-view.layer-feedback-enabled .layer-feedback-message-view-comment {
    display: none;
  }

  `,
  properties: {
    /**
     * Maximum byte limit on the length of the comment.
     *
     * Emoji and other high-byte characters will eat away at this limit quickly.
     *
     * Note that this is part of the Response Message and Response Summary and must, in combination with all other data,
     * be less than 2K in size.
     *
     * @property {Number} [maxByteLength=1500]
     */
    maxByteLength: {
      value: 1500,
    },

    /**
     * Property contains any `action.data` properties from whomever opened this large message view.
     *
     * Typically you'd be able to access this data directly from `model.action.data`; however, the action data
     * could also come from an Action Button's `data` property, so to properly view the action data associated with showing
     * the Large Message View, use this property.
     *
     * @property {Object} [openActionData=null]
     */
    openActionData: {},
  },
  methods: {

    /**
     * Return an SVG string for use in the titlebar
     *
     * @method getIcon
     * @returns {String}
     */
    getIcon() {
      return getGraphic('feedback')();
    },

    /**
     * Returns a title for use in the titlebar
     *
     * @method getTitle
     * @returns {String}
     */
    getTitle() {
      return this.model.title;
    },

    // Wire up event handlers when the widget is created
    onCreate() {
      this.addClickHandler('rate', this.nodes.ratings, this._onClick.bind(this));
      this.nodes.input.addEventListener('change', this._onInputChange.bind(this));
      this.nodes.input.addEventListener('input', this._onInputEvent.bind(this));
      this.addClickHandler('send', this.nodes.button, this.onSend.bind(this));
    },

    // Rerender initial state and any state changes
    // TODO: Shouldn't regenerate all stars, should generate stars in onRender and update classes here
    onRerender() {
      this.toggleClass('layer-feedback-enabled', this.model.isEditable());

      if (this.model.isRated) {
        // this.nodes.label.innerText = this.model.getSummary(this.model.summary, true);
        this.nodes.ratedAt.date = this.model.ratedAt;
        this.nodes.label.innerText = '';
      } else if (!this.model.isEditable()) {
        // this.nodes.label.innerText = this.model.getSummary(this.model.promptWait, true);
        this.nodes.label.innerText = this.model.promptWait;
      } else {
        // this.nodes.label.innerText = this.model.getSummary(this.model.prompt, true);
        this.nodes.label.innerText = this.model.prompt;
      }

      let text = '';
      for (let i = 1; i <= 5; i++) {
        text += `<span class=${i <= this.model.rating ? 'layer-feedback-selector-selected' : 'layer-feedback-selector-unselected'}>${getGraphic('star')()}</span>`;
      }
      this.nodes.ratings.innerHTML = text;
      this.nodes.input.disabled = !this.model.isEditable();
      this.nodes.input.placeholder = this.model.placeholder;
      this.nodes.input.value = this.model.comment;

      this.nodes.comment.innerHTML = this.model.comment.replace(/\n/g, '<br/>');
      this.nodes.button.disabled = !this.model.rating;
    },

    /**
     * When the user clicks on the View, find out which Star was clicked on (if any) and update the rating accordingly.
     *
     * @method _onClick
     * @private
     * @param {Event} evt
     */
    _onClick(evt) {
      if (!this.model.isEditable()) return;
      let target = evt.target;
      while (this.contains(target) && target.tagName !== 'SPAN') target = target.parentNode;
      if (target.tagName === 'SPAN') {
        const spans = Array.prototype.slice.call(this.nodes.ratings.childNodes);
        const index = spans.indexOf(target);
        if (index !== -1) {
          this.model.rating = index + 1;
          this.onRerender();
        }
      }
    },

    /**
     * Whenever there is an input event from the textarea, insure that the length doesn't excede maximum length.
     *
     * @param {KeyboardEvent} evt
     * @method _onInputEvent
     * @private
     */
    _onInputEvent(evt) {
      const maxByteLength = this.properties.maxByteLength;
      let length = getUTF8Length(evt.target.value);
      if (length > maxByteLength) {
        let s = evt.target.value;
        while (length > maxByteLength) {
          s = s.substring(0, s.length - 1);
          length = getUTF8Length(s);
        }
        evt.target.value = s;
      }
    },

    /**
     * Whenever the textarea changes value, update the model's comment field
     *
     * @method _onInputChange
     * @private
     * @param {Event} evt
     */
    _onInputChange(evt) {
      this.model.comment = this.nodes.input.value;
    },

    /**
     * When the user clicks the Send button, send the feedback and tell the container that we are done.
     *
     * @method onSend
     */
    onSend() {
      this.model.comment = this.nodes.input.value;
      this.model.sendFeedback();
      this.trigger('layer-container-done');
    },
  },
});
