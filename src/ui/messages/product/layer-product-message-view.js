/**
 * UI for a Product Message representing a Product Model
 *
 * The Product Message may also be combined with a Button Model to allow the user to perform
 * actions upon the Message. Some UIs may provide a full screen view that enables additional interactions.
 *
 * ### Importing
 *
 * Not included with the standard build. Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/product/layer-product-message-view';
 * ```
 *
 * @class Layer.UI.messages.ProductMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import { processText } from '../../handlers/text/text-handlers';
import './layer-product-message-model';

registerComponent('layer-product-message-view', {
  style: `
  layer-product-message-view {
    display: block;
  }
  layer-product-message-view > .layer-card-top {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  layer-product-message-view .layer-product-message-image {
    display: block;
  }
  layer-message-viewer.layer-product-message-view {
    cursor: pointer;
  }
  layer-product-message-view.layer-no-image .layer-card-top {
    display: none;
  }
  layer-product-message-view .layer-card-product-description:empty,
  layer-product-message-view .layer-card-product-choices:empty,
  layer-product-message-view .layer-card-product-name:empty,
  layer-product-message-view .layer-card-product-header:empty,
  layer-product-message-view .layer-card-product-price:empty {
    display: none;
  }
  `,
  template: `
    <div layer-id="UIContainer" class="layer-card-top">
      <div class="layer-product-message-image" layer-id="image" ></div>
    </div>
    <div class="layer-card-body-outer">
        <div class="layer-card-product-header" layer-id="brand" ></div>
        <div layer-id="name" class="layer-card-product-name"></div>

        <div layer-id="price" class="layer-card-product-price"></div>
        <div layer-id="choices" class="layer-card-product-choices"></div>
        <div layer-id="description" class="layer-card-product-description"></div>
    </div>
  `,
  mixins: [MessageViewMixin],

  properties: {
    maxWidth: {
      value: 500,
    },
    minWidth: {
      value: 350,
    },
  },
  methods: {

    /**
     * Assume that any property of the Product Model can change, and that any Model change should rerender
     * the entire Product View.
     *
     * @method onRerender
     */
    onRerender() {

      // Render the basic info fields
      this.nodes.name.innerHTML = processText(this.model.name);
      this.nodes.brand.innerHTML = processText(this.model.brand);
      this.nodes.price.innerHTML = processText(this.model.getFormattedPrice());
      this.nodes.description.innerHTML = processText(this.model.description);

      // Render the image (at some point we may want a way to see multiple images)
      // If no images, hide the image area
      this.nodes.image.style.backgroundImage = `url(${this.model.imageUrls[0]})`;
      this.toggleClass('layer-no-image', this.model.imageUrls.length === 0);

      const optionsParentNode = this.nodes.choices;

      // This currently only renders once, so changes to the options list will NOT render.
      // We will eventually need identify what needs to be added, what needs to be updated, etc...
      if (!optionsParentNode.firstChild) {
        this.model.options.forEach((optionsModel) => {
          optionsModel.action = { event: this.model.actionEvent, data: this.model.data || { url: this.model.url } };
          this.createElement('layer-message-viewer', {
            model: optionsModel,
            messageViewContainerTagName: false,
            cardBorderStyle: 'none',
            parentNode: this.nodes.choices,
          });
        });
      }
    },
  },
});
