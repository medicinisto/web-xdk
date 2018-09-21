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
import { get as getGraphic } from '../../resources/graphics/';
import '../../resources/graphics/receipt';

registerComponent('layer-receipt-message-large-view', {
  template: `
  <div class="layer-receipt-for-products" layer-id="products"></div>
  <div class='layer-receipt-details'>
    <div class='layer-paid-with layer-receipt-detail-item'>
      <label>Paid with</label>
      <div class="layer-receipt-paid-with layer-receipt-card-description" layer-id='paidWith'></div>
    </div>
    <div class='layer-shipping-address layer-receipt-detail-item'>
      <label>Ship to</label>
      <layer-message-viewer layer-id='shipTo'></layer-message-viewer>
    </div>
    <div class='layer-billing-address layer-receipt-detail-item'>
      <label>Bill to</label>
      <layer-message-viewer layer-id='billTo' hide-map='true'></layer-message-viewer>
    </div>

    <div class='layer-receipt-detail-item layer-receipt-subtotals'>
      <div class='layer-subtotal'>
        <label>Subtotal</label>
        <div class="layer-receipt-subtotal layer-receipt-card-description" layer-id='subtotal'></div>
      </div>

      <div class='layer-shipping'>
        <label>Shipping</label>
        <div class="layer-receipt-shipping layer-receipt-card-description" layer-id='shipping'></div>
      </div>

      <div class='layer-taxes'>
        <label>Taxes</label>
        <div class="layer-receipt-taxes layer-receipt-card-description" layer-id='taxes'></div>
      </div>
    </div>

    <div class='layer-receipt-summary layer-receipt-detail-item'>
      <label>Total</label>
      <div class='layer-receipt-price' layer-id='total'></div>
    </div>
  </div>
  `,
  style: `layer-receipt-message-large-view {
    display: block;
    overflow-y: auto;
  }
  layer-message-viewer.layer-receipt-message-large-view {
    padding-bottom: 0px;
  }
  layer-receipt-message-large-view.layer-receipt-no-payment .layer-paid-with {
    display: none;
  }
  layer-receipt-message-large-view .layer-receipt-detail-item layer-message-viewer {
    display: block;
  }
  `,
  mixins: [MessageViewMixin],
  properties: {

  },
  methods: {

    /**
     * Provide the Titled Message Container with an Icon CSS Class
     *
     * @method getIcon
     * @returns {String}
     * @protected
     */
    getIcon() {
      return getGraphic('receipt')();
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

      if (this.model.billingAddress) {
        const billTo = this.nodes.billTo;
        this.model.billingAddress.showAddress = true;
        billTo.model = this.model.billingAddress;
        billTo.cardBorderStyle = 'none';
        billTo._onAfterCreate();
        billTo.nodes.ui.hideMap = true;
      }

      // Setup the Totals and Paid With sections
      this.nodes.subtotal.innerHTML = Number(this.model.summary.subtotal)
        .toLocaleString(navigator.language, {
          currency: this.model.currency,
          style: 'currency',
        });

        this.nodes.shipping.innerHTML = Number(this.model.summary.shippingCost)
        .toLocaleString(navigator.language, {
          currency: this.model.currency,
          style: 'currency',
        });

        this.nodes.taxes.innerHTML = Number(this.model.summary.totalTax)
        .toLocaleString(navigator.language, {
          currency: this.model.currency,
          style: 'currency',
        });
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

