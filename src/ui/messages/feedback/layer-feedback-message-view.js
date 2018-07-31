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
import './layer-feedback-message-large-view';
import { get as getGraphic } from '../../resources/graphics/';
import '../../resources/graphics/star';
import '../../resources/graphics/feedback';


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
    /**
     * Use a Titled Display Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-titled-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-titled-message-view-container',
    },

    // Add this class to <layer-feedback-message-view />
    cssClassList: {
      value: ['layer-feedback-message-view-ratings'],
    },

    /**
     * Fixed width at 300px
     *
     * @property {Number} [minWidth=300]
     */
    minWidth: {
      value: 300,
    },

    /**
     * Fixed width at 300px
     *
     * @property {Number} [maxWidth=300]
     */
    maxWidth: {
      value: 300,
    },
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

    // On creating the widget, wire up its event handlers
    onCreate() {
      this.addClickHandler('pre-rating', this, this._onClick.bind(this));
    },

    // Whenever we rerender, update the ratings that are selected/deselected
    // TODO: Probably more efficient to have `onRender` render the stars, and `onRerender` update styling on the stars
    onRerender() {
      const rating = this.model.rating || 0;
      this.messageViewer.toggleClass('layer-feedback-enabled', this.model.isEditable());
      let text = '';
      for (let i = 1; i <= 5; i++) {
        text += `<span class="${i <= rating ? 'layer-feedback-selector-selected' : 'layer-feedback-selector-unselected'}">${getGraphic('star')()}</span>`;
      }
      this.innerHTML = text;
    },

    /**
     * When the user clicks on the View, find out which Star was clicked on (if any) and update the rating accordingly.
     *
     * Note that the event will bubble up and cause the Message Viewer Action to be triggered (typically shows the Large Feedback message)
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
        const spans = Array.prototype.slice.call(this.childNodes);
        const index = spans.indexOf(target);
        if (index !== -1) {
          this.model.rating = index + 1;
        }
      }
    },
  },
});
