/**
 * UI for a Status Message
 *
 * A Status Message is any message rendered as though it does not come from any given user, and instead
 * shown as a centered informational message that doesn't look like a message sent by anyone.
 *
 * ### Importing
 *
 * Not included with the standard build. Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/status/layer-status-message-view';
 * ```
 *
 * @class Layer.UI.messages.StatusMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Constants from '../../constants';
import { processText } from '../../handlers/text/text-handlers';
import './layer-status-message-model';

registerComponent('layer-status-message-view', {
  style: `layer-status-message-view {
    display: block;
  }
  .layer-root-viewer.layer-status-message-view > * > .layer-card-top {
    display: block;
  }
  layer-status-message-view p {
    text-align: center;
  }
  `,
  mixins: [MessageViewMixin],
  properties: {
    messageViewContainerTagName: {
      value: '',
    },
  },
  methods: {
    onRerender() {
      this.innerHTML = processText(this.model.text);
    },
  },
});
