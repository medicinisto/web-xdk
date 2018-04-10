/*
 *
 * @class
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Constants from '../../constants';

registerComponent('layer-message-type-list-view', {
  template: '',
  style: `
  layer-message-type-list-view {
    display: flex;
    flex-direction: column;
  }
  layer-message-type-list-view > layer-message-viewer {
    margin: 2px;
    max-width: 100% !important;
  }
  `,

  mixins: [MessageViewMixin],

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    messageViewContainerTagName: {
      value: null,
    },
    widthType: {
      value: Constants.WIDTH.FLEX,
    },
    cardBorderStyle: {
      value: 'none',
    },
  },
  methods: {
    onRerender() {
      if (!this.properties._internalState.onAttachCalled) return;

      // console.log("CAROUSEL onRERENDER");
      // TODO: Assign items ids so we don't need to blow away and then recreate them
      this.innerHTML = '';
      this.model.items.forEach((item) => {
        // console.log('GENERATE: ' + item.id + '    ' + item.title);
        const ui = this.createElement('layer-message-viewer', {
          message: this.model.message,
          rootPart: item.part,
          model: item,
          parentNode: this,
        });
        ui.classList.add('layer-root-viewer');
      });
    },
  },
});
