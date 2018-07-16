/**
 * Adds Message handling to the Layer.Core.Client.
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import Announcements from '../models/announcement';
import AnnouncementsQuery from '../queries/announcements-query';
import Core from '../namespace';

const ClientAnnouncement = {
  methods: {
    _createAnnouncementFromServer(obj) {
      return Announcements._createFromServer(obj);
    },
    _createAnnouncementsQuery(options) {
      return new AnnouncementsQuery(options);
    },
  },
};
export default ClientAnnouncement;
Core.mixins.Client.push(ClientAnnouncement);
