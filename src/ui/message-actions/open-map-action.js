/**
 * Simple action handler for the `open-map` action which looks for a street address, and if found,
 * uses that to open the map.  Else it looks for a latitude/longitude and opens a map with that.
 *
 * @class Layer.UI.MessageActions.OpenMapAction
 */

import { register } from './index';
import { showFullScreen } from '../ui-utils';
import { logger } from '../../utils';

const openMapHandler = ({ data, model }) => {
  // It sure would be nice to have Object.assign here...
  const mergedData = {
    street1: model.street1,
    street2: model.street2,
    city: model.city,
    administrativeArea: model.administrativeArea,
    postalCode: model.postalCode,
    country: model.country,
    latitude: model.latitude,
    longitude: model.longitude,
    zoom: model.zoom,
  };
  Object.keys(data).forEach(keyName => (mergedData[keyName] = data[keyName]));


  let url;
  if (mergedData.street1 && (mergedData.postalCode || mergedData.city)) {
    url = 'http://www.google.com/maps/?q=' +
      escape(mergedData.street1 + (mergedData.street2 ? ' ' + mergedData.street2 : '') +
      ` ${mergedData.city} ${mergedData.administrativeArea}, ${mergedData.postalCode} ${mergedData.country}`);
  } else if (mergedData.latitude && mergedData.longitude) {
    url = `https://www.google.com/maps/search/?api=1&query=${mergedData.latitude},${mergedData.longitude}&zoom=${mergedData.zoom}`;
  } else {
    logger.error('OPEN-MAP-ACTION: No latitude/longitude, nor street address for the "open-map" Message Action for model ', model);
  }
  if (url) showFullScreen(url);
};

register('open-map', openMapHandler);
