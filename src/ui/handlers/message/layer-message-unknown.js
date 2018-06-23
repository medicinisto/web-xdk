/**
 * The Unknown MessageHandler renders unhandled content with a placeholder politely
 * suggesting that a developer should probably handle it.
 *
 * @class Layer.UI.handlers.message.Unknown
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageHandler from '../../mixins/message-handler';

registerComponent('layer-message-unknown', {
  mixins: [MessageHandler],
  methods: {
    /**
     * Render a message that is both polite and mildly annoying.
     *
     * @method onRender
     * @private
     */
    onRender() {
      const mimeTypes = this.message.mapParts(part => part.mimeType)
        .join(', ');
      this.innerHTML = `Message with MIME Types ${mimeTypes} has been received but has no renderer`;
    },
  },
});

// Do not register this handler
