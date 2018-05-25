/**
 * UI for a Text Message
 *
 * ### Importing
 *
 * Included with the standard build. For custom build, Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/text/layer-text-message-view';
 * ```
 *
 * @class Layer.UI.messages.TextMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import { processText } from '../../handlers/text/text-handlers';
import './layer-text-message-model';

registerComponent('layer-text-message-view', {
  style: `layer-text-message-view {
    display: block;
  }
  .layer-root-viewer.layer-text-message-view > * > .layer-card-top {
    display: block;
  }
  `,
  mixins: [MessageViewMixin],
  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    minWidth: {
      noGetterFromSetter: true,
      get() {
        return this.parentComponent.isShowingMetadata ? this.properties.minWidth : 0;
      },
    },
    maxWidth: {
      value: 384,
      noGetterFromSetter: true,
      get() {
        return this.parentComponent.isShowingMetadata ? this.properties.maxWidth : 1280;
      },
    },
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-standard-message-view-container',
    },
  },
  methods: {
    onRerender() {
      this.innerHTML = processText(this.model.text);
    },
    _setupContainerClass() {
      if (this.parentComponent.isShowingMetadata) this.parentComponent.style.maxWidth = this.maxWidth + 'px';
    },
  },
});
