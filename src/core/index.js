/**
 * @class Layer.Core
 */
import Core from './namespace';
import './root';

import './mixins/message-capi';
import './mixins/client-capi-authentication';
import './mixins/client-websockets';
import './mixins/client-online-manager';
import './mixins/client-capi-requests';
import './mixins/client-typing-indicators';
import './mixins/client-cache-cleaner';
import './mixins/client-user';
import './mixins/client-telemetry';
import './mixins/client-queries';
import './mixins/client-identities';
import './mixins/client-conversations';
import './mixins/client-messages';
import './mixins/websocket-operations';
import './mixins/client-message-type-models';
import './mixins/client-channels';
import './mixins/client-members';
import './mixins/client-announcements';

import './client';
import './models/syncable';
import './models/conversation';
import './models/container';
import './models/message';
import './models/conversation-message';
import './models/announcement';
import './models/message-part';
import './models/content';
import './models/message-type-model';
import './models/channel';
import './models/channel-message';
import './models/membership';
import './models/identity';

import './queries/query';
import './queries/conversations-query';
import './queries/identities-query';
import './queries/messages-query';
import './queries/announcements-query';
import './queries/channels-query';
import './queries/members-query';
import './queries/query-builder';


import './layer-error';
import './layer-event';
import './sync-manager';
import './sync-event';
import './websockets/socket-manager';
import './websockets/request-manager';
import './websockets/change-manager';
import './online-state-manager';
import './typing-indicators/typing-indicators';
import './typing-indicators/typing-listener';
import './typing-indicators/typing-publisher';

module.exports = Core;
