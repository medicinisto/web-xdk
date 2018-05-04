/**
 * UI for a Location Message
 *
 * You must set your Google Maps API key in `window.googleMapsAPIKey`
 *
 * ### Importing
 *
 * Not included with the standard build. Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/location/layer-location-message-view';
 * ```
 *
 * @class Layer.UI.messages.LocationMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Constants from '../../constants';
import './layer-location-message-model';
import { defer, logger } from '../../../utils';
import { googleMapsKey } from '../../../settings';

registerComponent('layer-location-message-view', {
  mixins: [MessageViewMixin],
  template: '<img layer-id="img" />',
  style: `
  layer-message-viewer.layer-location-message-view {
    cursor: pointer;
  }
  layer-message-viewer.layer-location-message-view:not(.layer-location-message-view-address-only) {
    max-width: 640px;
  }
  .layer-location-message-view-address-only layer-location-message-view {
    display: none;
  }
  layer-location-message-view img {
    display: block;
  }
  layer-message-viewer.layer-location-message-view .layer-location-message-show-street-address
  .layer-standard-card-container-description p.layer-line-wrapping-paragraphs + p.layer-line-wrapping-paragraphs {
    margin-top: 0px;
  }
  `,
  properties: {
    height: {
      value: 250,
    },

    /**
     * Set to `true` to tell the Component to hide the map.
     *
     * @property {Boolean} [hideMap=false]
     */
    hideMap: {
      value: false,
      type: Boolean,
      set(value) {
        this.messageViewer.toggleClass('layer-location-message-view-address-only', value);
        this._setupContainerClasses();
      },
    },

    // See parent class
    widthType: {
      value: Constants.WIDTH.FULL,
    },

    preferredMaxWidth: {
      value: 640,
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

    // See parent class for definition
    onAttach() {
      // Once added to the DOM structure, we should be able to determine an optimal width for the map.
      if (!this.hideMap) this._updateImageSrc();
    },

    /**
     * Deterimne the image dimensions and fetch them from google maps service by setting an `<img src />` property.
     *
     * @method
     * @private
     */
    _updateImageSrc() {
      if (this.parentNode && this.parentNode.clientWidth) {
        defer(() => {
          let marker;
          if (this.model.latitude) {
            marker = `${this.model.latitude},${this.model.longitude}`;
          } else {
            marker = escape(this.model.street1 + (this.model.street2 ? ` ${this.model.street2}` : '') +
              ` ${this.model.city} ${this.model.administrativeArea}, ${this.model.postalCode} ${this.model.country}`);
          }
          if (!googleMapsKey) logger.error('No googleMapsKey found in settings; pass into Layer.init()');
          this.nodes.img.src = location.protocol + '//maps.googleapis.com/maps/api/staticmap?' +
            `size=${this.parentNode.clientWidth}x${this.height}&language=${navigator.language.toLowerCase()}` +
            `&key=${googleMapsKey}&zoom=${this.model.zoom}&markers=${marker}`;
        });
      }
    },

    // See parent class definition
    onRerender() {
      this._updateImageSrc();
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
      if (this.hideMap) {
        const arrow = document.createElement('div');
        arrow.classList.add('layer-next-icon');
        this.parentComponent.customControls = arrow;
      }

      this.parentComponent.toggleClass('layer-no-core-ui', this.hideMap);
      this.parentComponent.toggleClass('layer-location-message-show-street-address',
        this.model.street1 && !this.model.description);
    },
  },
});
