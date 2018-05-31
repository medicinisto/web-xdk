// Expose a shared namespace where components can register themselves.
module.exports = {
  mixins: {
    Client: [],
    Message: [],
    Announcement: [],
    Conversation: [],
    Identity: [],
    MessageTypeModel: [],
    MessagePart: [],
  },
  Websockets: {},
  MessageTypeModels: {},
};
