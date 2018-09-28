/**
 * UI for a Link Message
 *
 * ### Importing
 *
 * Included with the standard build. For custom build, Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/link/layer-link-message-view';
 * ```
 *
 * @class Layer.UI.messages.LinkMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */

import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Clickable from '../../mixins/clickable';
import { get as getGraphic } from '../../resources/graphics/';
import '../../resources/graphics/next-arrow';

import './layer-link-message-model';

registerComponent('layer-link-message-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
  layer-message-viewer.layer-link-message-view layer-standard-message-view-container {
    cursor: pointer;
    display: block;
  }
  layer-message-viewer.layer-link-message-view .layer-card-top {
    align-items: stretch
  }
  layer-link-message-view.layer-link-message-no-image .layer-link-message-view-image  {
    display: none;
  }
  layer-link-message-view .layer-link-message-view-image {
    width: 100%;
    display: block;
  }
  layer-message-viewer.layer-link-message-view:not(.layer-standard-message-view-no-metadata) layer-link-message-view a {
    display: none;
  }

  layer-message-viewer.layer-link-message-view  .layer-standard-card-container-footer a,
  layer-message-viewer.layer-link-message-view  .layer-standard-card-container-footer a:visited,
  layer-message-viewer.layer-link-message-view  .layer-standard-card-container-footer a:hover {
    color: inherit;
    text-decoration: none;
  `,

  template: '<div layer-id="image" class="layer-link-message-view-image"></div><a target="_blank" layer-id="link"></a>',
  properties: {
    minWidth: {
      noGetterFromSetter: true,
      get() {
        if (this.isPlainLink()) {
          return 0;
        } else {
          return this.properties.minWidth;
        }
      },
    },
    maxWidth: {
      value: 384,
      noGetterFromSetter: true,
      get() {
        if (this.isPlainLink()) {
          return 1280;
        } else {
          return this.properties.maxWidth;
        }
      },
    },

    /**
     * Use a Standard Display Container to render this UI.
     *
     * @property {String} [messageViewContainerTagName=layer-standard-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-standard-message-view-container',
    },
  },
  methods: {
    onCreate() {
      this.addClickHandler('message-click', this.nodes.link, this._linkClicked.bind(this));
    },

    /**
     * Whenever a the model changes or is created, rerender basic properties.
     *
     * @method onRerender
     */
    onRerender() {
      this.nodes.image.style.backgroundImage = this.model.imageUrl ? `url(${this.model.imageUrl})` : '';
      this.toggleClass('layer-link-message-no-image', !(this.model.imageUrl));
      this.nodes.link.src = this.model.url;
      this.nodes.link.innerHTML = this.model.url;
    },

    /**
     * As part of the Message UI lifecycle, this is called to update the `<layer-standard-message-view-container />` CSS classes.
     *
     * Adds an optional "Next Arrow" to the metadata, and optionally hides itself.
     *
     * @method _setupContainerClasses
     * @protected
     */
    _setupContainerClasses() {
      const useArrow = !this.isPlainLink() && !this.model.imageUrl;

      if (useArrow) {
        const arrow = document.createElement('div');
        arrow.classList.add('layer-next-icon');
        arrow.innerHTML = getGraphic('next-arrow')();
        this.parentComponent.customControls = arrow;
      }

      this.parentComponent.classList[!useArrow ? 'remove' : 'add']('layer-no-core-ui');

      if (this.parentComponent.isShowingMetadata) this.parentComponent.style.maxWidth = this.maxWidth + 'px';
    },

    isPlainLink() {
      return !this.model.imageUrl && !this.parentComponent.isShowingMetadata;
    },

    _linkClicked() {
      this.messageViewer._runAction();
    },
  },
});

