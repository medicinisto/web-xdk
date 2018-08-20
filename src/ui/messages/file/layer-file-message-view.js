/**
 * UI for a File Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/file/layer-file-message-view';
 * ```
 *
 * @class Layer.UI.messages.FileMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import './layer-file-message-model';

registerComponent('layer-file-message-view', {
  mixins: [MessageViewMixin],

  // Adapated from github.com/picturepan2/fileicon.css
  style: `
  layer-file-message-view {
    display: block;
    width: 100%;
  }
`,

  properties: {
    /**
     * Use a Standard Display Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-standard-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-standard-message-view-container',
    },

    minWidth: {
      value: 192,
    },
    maxWidth: {
      value: 212,
    },
  },
  methods: {
    /**
     * Whenever this component is rendered/rerendered, update its CSS Class to reflect the file type.
     *
     * Adds "layer-file-mime-type" to the class.
     *
     * @method onRerender
     */
    onRerender() {
      this.classList.add('layer-file-' + this.model.mimeType.replace(/[/+]/g, '-'));
    },
  },
});
