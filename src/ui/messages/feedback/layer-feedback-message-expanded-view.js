/**
 * Expanded view for the Feedback Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-view';
 * ```
 *
 * @class Layer.UI.messages.FeedbackMessageExpandedView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @mixin Layer.UI.mixins.Clickable
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Clickable from '../../mixins/clickable';

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


registerComponent('layer-feedback-message-expanded-view', {
  mixins: [MessageViewMixin, Clickable],
  template: `
    <div class='layer-feedback-message-view-label' layer-id='label'></div>
    <div class='layer-feedback-message-view-ratings' layer-id='ratings'></div>
    <textarea class='layer-feedback-message-view-input' layer-id='input' placeholder='Add a comment...'></textarea>
    <div class='layer-feedback-message-view-comment' layer-id='comment'></div>
    <layer-action-button layer-id='button' text='Send'></layer-action-button>
  `,
  style: `
  layer-feedback-message-expanded-view {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    overflow-y: auto;
  }
  layer-feedback-message-expanded-view .layer-feedback-message-view-input {
    flex-grow: 1;
  }
  layer-feedback-message-expanded-view:not(.layer-feedback-enabled) layer-action-button {
    display: none;
  }
  layer-feedback-message-expanded-view:not(.layer-feedback-enabled) .layer-feedback-message-view-input {
    display: none;
  }
  layer-feedback-message-expanded-view.layer-feedback-enabled .layer-feedback-message-view-comment {
    display: none;
  }
  `,
  properties: {
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-dialog-message-view-container',
    },
    widthType: {
      value: 'flex-width',
    },
    maxByteLength: {
      value: 1500,
    },
    openActionData: {},
  },
  methods: {

    getIconClass() {
      return 'layer-feedback-message-view-icon';
    },
    getTitle() {
      return this.model.title;
    },

    onCreate() {
      this.addClickHandler('rate', this.nodes.ratings, this._onClick.bind(this));
      this.nodes.input.addEventListener('change', this._onInputChange.bind(this));
      this.nodes.input.addEventListener('input', this._onInputEvent.bind(this));
      this.addClickHandler('send', this.nodes.button, this.onSend.bind(this));
    },

    onRerender() {
      this.toggleClass('layer-feedback-enabled', this.model.isEditable());

      if (this.model.sentAt) {
        this.nodes.label.innerText = this.model.getSummary(this.model.summary, true);
      } else if (!this.model.isEditable()) {
        this.nodes.label.innerText = this.model.getSummary(this.model.promptWait, true);
      } else {
        this.nodes.label.innerText = this.model.getSummary(this.model.prompt, true);
      }

      let text = '';
      for (let i = 1; i <= 5; i++) {
        text += '<span>' + ((i <= this.model.rating) ? '\u2605' : '\u2606') + '</span>';
      }
      this.nodes.ratings.innerHTML = text;
      this.nodes.input.disabled = !this.model.isEditable();
      this.nodes.input.placeholder = this.model.placeholder;
      this.nodes.input.value = this.model.comment;

      this.nodes.comment.innerHTML = this.model.comment.replace(/\n/g, '<br/>');
      this.nodes.button.disabled = !this.model.isEditable() || !this.model.rating;
    },

    _onClick(evt) {
      if (!this.model.isEditable()) return;
      let target = evt.target;
      if (target.tagName !== 'SPAN') target = target.parentNode;
      if (target.tagName === 'SPAN') {
        const spans = Array.prototype.slice.call(this.nodes.ratings.childNodes);
        const index = spans.indexOf(target);
        if (index !== -1) {
          this.model.rating = index + 1;
          this.onRerender();
        }
      }
    },
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
    _onInputChange(evt) {
      this.model.comment = this.nodes.input.value;
    },
    onSend() {
      this.model.comment = this.nodes.input.value;
      this.model.sendFeedback();
      this.messageViewer.destroy();
    },
  },
});
