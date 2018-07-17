/**
 * Location Message Model is used to represent a Location Message.
 *
 * A Location Message represents an Address or lat/lon and can be used to show a map,
 * or just an address.
 *
 * For a Model that uses lat/lon:
 *
 * ```
 * LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel')
 * model = new LocationModel({
 *     latitude: 37.7734858,
 *     longitude: -122.3916087,
 *     heading: 23.45,
 *     altitude: 35.67,
 *     title: "Here I am.  Right there on the dot. I'm stuck on the dot.  Please free me.",
 *     description: "Dot prisoner 455 has attempted to escape.  Send in the puncutation and make a very strong point about dot prisoner escapes",
 *     accuracy: 0.8,
 *     createdAt: new Date(),
 * });
 * model.send({ conversation });
 * ```
 *
 * For a model that uses an address:
 *
 * ```
 * LocationModel = Layer.Core.Client.getMessageTypeModelClass('LocationModel');
 * model = new LocationModel({
 *   city: 'San Francisco',
 *   title: 'Layer Inc',
 *   postalCode: '94107',
 *   administrativeArea: 'CA',
 *   street1: '655 4th st'
 * });
 * model.send({ conversation });
 * ```
 *
 * Note that the description property can be ignored if the `showAddress` is set to `true`,
 * in which case the Address is shown instead.
 *
 * ### Importing
 *
 * Not included with the standard build. Import with either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/location/layer-location-message-view';
 * import '@layerhq/web-xdk/ui/messages/location/layer-location-message-model';
 * ```
 *
 * @class Layer.UI.messages.LocationMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Core from '../../../core/namespace';

const { MessagePart, MessageTypeModel, Root } = Core;

export default class LocationModel extends MessageTypeModel {

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Location Message.
   *
   * @method generateParts
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   * @typescript public
   * @private
   */
  generateParts(callback) {
    const body = this.initBodyWithMetadata(['latitude', 'longitude', 'heading', 'accuracy', 'createdAt',
      'altitude', 'description', 'title', 'city', 'country', 'postalCode', 'administrativeArea', 'street1', 'street2']);

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    callback([this.part]);
  }

  /**
   * Get a description for the Layer.UI.messages.StandardMessageViewContainer.
   *
   * Description will either be the description property or the Street Address.
   *
   * @method getDescription
   * @returns {String}
   */
  getDescription() {
    if (this.description && this.showAddress !== true) {
      return this.description;
    } else if (this.street1 || this.city || this.postalCode) {
      return this.street1 + (this.street2 ? '\n' + this.street2 : '') +
        `\n${this.city} ${this.administrativeArea}${this.postalCode ? ', ' + this.postalCode : ''}`;
    }
  }
}

/**
 * Latitude for this location.
 *
 * @property {Number} latitude
 */
LocationModel.prototype.latitude = 0;

/**
 * Longitude for this location.
 *
 * @property {Number} longitude
 */
LocationModel.prototype.longitude = 0;

/**
 * Zoom level from 1 - 18; defaults to 16
 *
 * Note that this uses Google Maps definition of Zoom which may not be available on all devices.
 *
 * https://developers.google.com/maps/documentation/javascript/reference
 *
 * @property {Number} [zoom=16]
 */
LocationModel.prototype.zoom = 16;

/**
 * Heading; currently not used.
 *
 * @property {Number} heading
 */
LocationModel.prototype.heading = null;

/**
 * Altitude of the location.
 *
 * @property {Number} altitude
 */
LocationModel.prototype.altitude = null;

/**
 * Title for the Layer.UI.messages.StandardMessageViewContainer
 *
 * @property {String} title
 */
LocationModel.prototype.title = '';

/**
 * How accurate is the location; not currently used.
 *
 * @property {Number} accuracy
 */
LocationModel.prototype.accuracy = null;

/**
 * Timestamp was this Location data taken.
 *
 * @property {String} createdAt    ISO Date string (`new Date().toISOString()`)
 */
LocationModel.prototype.createdAt = null;

/**
 * Description for the Layer.UI.messages.StandardMessageViewContainer
 *
 * @property {String} description
 */
LocationModel.prototype.description = '';

/**
 * City for this location.
 *
 * @property {String} city
 */
LocationModel.prototype.city = '';

/**
 * Country for this location.
 *
 * @property {String} country
 */
LocationModel.prototype.country = '';

/**
 * Zipcode/postalcode for this location
 *
 * @property {String} postalCode
 */
LocationModel.prototype.postalCode = '';

/**
 * Administrative Area/State of this location
 *
 * @property {String} administrativeArea
 */
LocationModel.prototype.administrativeArea = '';

/**
 * Street address for this location
 *
 * @property {String} street1
 */
LocationModel.prototype.street1 = '';

/**
 * Additional street address for this location
 *
 * @property {String} street2
 */
LocationModel.prototype.street2 = '';

/**
 * Should the address be shown instead of the Description by the Layer.UI.messages.StandardMessageViewContainer?
 *
 * 3 state:
 *
 * * `true`: show the address
 * * `false`: show the description
 * * `null`: permit default behavior
 *
 * Set by Parent Card via API and NOT set via model.
 *
 * @property {Boolean} showAddress
 */
LocationModel.prototype.showAddress = null;

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Location]
 */
LocationModel.LabelSingular = 'Location';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Locations]
 */
LocationModel.LabelPlural = 'Locations';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=]
 */
LocationModel.SummaryTemplate = '';

/**
 * The default action when selecting this Message is to trigger an `open-map` action to show
 * details referenced by the address model.
 *
 * @static
 * @property {String} [defaultAction=open-map]
 */
LocationModel.defaultAction = 'open-map';

/**
 * The MIME Type recognized by and used by the Location Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.location+json]
 */
LocationModel.MIMEType = 'application/vnd.layer.location+json';

/**
 * The UI Component to render the Location Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-location-message-view]
 */
LocationModel.messageRenderer = 'layer-location-message-view';

// Finish setting up the Class
Root.initClass.apply(LocationModel, [LocationModel, 'LocationModel']);

// Register the Card Model Class with the Client
Core.Client.registerMessageTypeModelClass(LocationModel, 'LocationModel');
