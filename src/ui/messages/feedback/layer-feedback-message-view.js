/**
 * Feedback message allows a user to request a rating and comment from another user.
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-feedback-message-view';
 * ```
 *
 *
 * @class Layer.UI.messages.FeedbackMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @mixin Layer.UI.mixins.Clickable
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import { registerStatusModel } from '../../ui-utils/';
import FeedbackModel from './layer-feedback-message-model';
import MessageViewMixin from '../message-view-mixin';
import Clickable from '../../mixins/clickable';
import './layer-feedback-message-expanded-view';

registerComponent('layer-feedback-message-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
  layer-feedback-message-view {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  `,
  properties: {
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-titled-message-view-container',
    },
    widthType: {
      value: 'flex-width',
    },
    cssClassList: {
      value: ['layer-feedback-message-view-ratings'],
    },
  },
  methods: {

    getIconClass() {
      return 'layer-feedback-message-view-icon';
    },
    getTitle() {
      return this.model.title;
    },

    onCreate() {
      this.addClickHandler('pre-rating', this, this._onClick.bind(this));
    },

    onRerender() {
      const rating = this.model.rating || 0;
      this.messageViewer.toggleClass('layer-feedback-enabled', this.model.isEditable());
      let text = '';
      for (let i = 1; i <= 5; i++) {
        text += '<span>' + ((i <= rating) ? '\u2605' : '\u2606') + '</span>';
      }
      this.innerHTML = text;
    },

    _onClick(evt) {
      if (!this.model.isEditable()) return;
      let target = evt.target;
      if (target.tagName !== 'SPAN') target = target.parentNode;
      if (target.tagName === 'SPAN') {
        const spans = Array.prototype.slice.call(this.childNodes);
        const index = spans.indexOf(target);
        if (index !== -1) {
          this.model.rating = index + 1;
        }
      }
    },
  },
});

registerStatusModel(FeedbackModel.MIMEType);
