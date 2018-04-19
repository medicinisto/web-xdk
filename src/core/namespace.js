// Expose a shared namespace where components can register themselves.
module.exports = {
  mixins: {
    Client: [],
    Message: [],
    Conversation: [],
    Identity: [],
    MessageTypeModel: [],
  },
  Websockets: {},
  MessageTypeModels: {},
};
