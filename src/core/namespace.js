// Expose a shared namespace where components can register themselves.
export default {
  mixins: {
    Client: [],
    Message: [],
    Announcement: [],
    Conversation: [],
    Identity: [],
    MessageTypeModel: [],
    MessagePart: [],
    ResponseSummaryModel: [],
  },
  Websockets: {},
  MessageTypeModels: {},
};
