/**
 * UI for a Receipt Message representing a Receipt for a Purchase.
 *
 * The Receipt Message may also be combined with a Button Model to act as an invoice
 * or request confirmation of a planned purchase.
 *
 * ### Importing
 *
 * Not included with the standard build. Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/receipt/layer-receipt-message-view';
 * ```
 *
 * @class Layer.UI.messages.ReceiptMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import './layer-receipt-message-product-view';
import './layer-receipt-message-model';
import Constants from '../../constants';

registerComponent('layer-receipt-message-view', {
  template: `
  <div class="layer-receipt-for-products" layer-id="products"></div>
  <div class='layer-receipt-details'>
    <div class='layer-paid-with layer-receipt-detail-item'>
      <label>Paid with</label>
      <div class="layer-receipt-paid-with layer-receipt-card-description" layer-id='paidWith'></div>
    </div>
    <div class='layer-address layer-receipt-detail-item'>
      <label>Ship to</label>
      <layer-message-viewer layer-id='shipTo' hide-map='true'></layer-message-viewer>
    </div>
    <div class='layer-receipt-summary layer-receipt-detail-item'>
      <label>Total</label>
      <span class='layer-receipt-price' layer-id='total'></span>
    </div>
  </div>
  `,
  style: `layer-receipt-message-view {
    display: block;
  }
  layer-message-viewer.layer-receipt-message-view {
    padding-bottom: 0px;
  }
  layer-receipt-message-view.layer-receipt-no-payment .layer-paid-with {
    display: none;
  }
  layer-receipt-message-view .layer-receipt-detail-item layer-message-viewer {
    display: block;
  }
  `,
  mixins: [MessageViewMixin],
  properties: {

    // Use the Titled Message Container
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-titled-message-view-container',
    },
    widthType: {
      value: Constants.WIDTH.FULL,
    },
  },
  methods: {

    /**
     * Provide the Titled Message Container with an Icon CSS Class
     *
     * @method getIconClass
     * @returns {String}
     * @protected
     */
    getIconClass() {
      return 'layer-receipt-message-view-icon';
    },

    /**
     * Provides the Titled Message Container with title text
     *
     * @method getTitle
     * @returns {String}
     * @protected
     */
    getTitle() {
      return this.model.title || 'Order Confirmation';
    },

    /**
     * Don't really know what data is and is not changeable in a Receipt Model, so just rerender everything on any change event.
     *
     * @method onRerender
     */
    onRerender() {
      // Clear the Product List
      this.nodes.products.innerHTML = '';

      // Generate the Product List
      this.model.items.forEach((item) => {
        this.createElement('layer-receipt-message-product-view', {
          item,
          parentNode: this.nodes.products,
        });
      });

      // Generate the Shipping Address
      if (this.model.shippingAddress) {
        const shipTo = this.nodes.shipTo;
        this.model.shippingAddress.showAddress = true;
        shipTo.model = this.model.shippingAddress;
        shipTo.cardBorderStyle = 'none';
        shipTo._onAfterCreate();
        shipTo.nodes.ui.hideMap = true;
      }

      // Setup the Totals and Paid With sections
      this.nodes.total.innerHTML = Number(this.model.summary.totalCost)
        .toLocaleString(navigator.language, {
          currency: this.model.currency,
          style: 'currency',
        });
      this.nodes.paidWith.innerHTML = this.model.paymentMethod || 'Unknown';

      // If there is no paymentMethod, slap on a "no-payment" css class
      this.toggleClass('layer-receipt-no-payment', !this.model.paymentMethod);
    },
  },
});

