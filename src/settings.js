/**
 * @class Layer.UI
 */

/**
 * The settings object stores a hash of configurable properties to change widget Behaviors.
 *
 * The settings object is typically set using Layer.init():
 *
 * ```
 * Layer.init({
 *   appId: appId,
 *   messageGroupTimeSpan: 100000
 * });
 * ```
 *
 * Below are the available settings and their defintions.
 *
 * @property {Object} settings
 *
 * @property {String} settings.appId                    Passed into the `Layer.init({ appId })` in order to initialize the Client
 *
 * @property {Layer.Core.Client} [settings.Client]      Exposes the Client to all UI Components; set automatically by the `Layer.init({ appId })` call
 *
 * @property {Number} [settings.messageGroupTimeSpan=1,800,000]   Messages are grouped based on sender,
 *    as well as time between when Messages are sent
 *    How much time must pass before messages are no longer in the same group? Measured in miliseconds.
 *
 * @property {Boolean} [settings.disableTabAsWhiteSpace=false]   By default hitting TAB in the Composer adds space.
 *    Disable this for tab to go to next component.
 *
 * @property {Number} [settings.markReadDelay=2500]    Delay before marking a Message as read.
 *    This property configures the number of miliseconds to wait after a message becomes visible
 *    before its marked as read.  A value too small means it was visible but the user may not
 *    have actually had time to read it as it scrolls quickly past.
 *
 *    The above code will prevent the `layer-avatar` widget
 *    from being initialized, and allow you to provide your own definition for this html tag.  Your definition
 *    must be registered using the WebComponents `document.registerElement` call.  Call `registerElement` after loading layerUI
 *    because layerUI contains the WebComponents polyfills.
 *
 * @property {Object} [settings.defaultHandler]    The default message renderer for messages not matching any other handler
 * @property {String[]} [settings.textHandlers=['autolinker', 'emoji', 'newline']] Specify which text handlers you want
 *    Note that any custom handlers you add do not need to be in the settings, they can be called after calling `init()` using `Layer.UI.handlers.text.register`.
 * @property {Number} [settings.destroyAfterDetachDelay=10000] How long to wait after a Component is removed from the document before destroying it.
 *   Note that a common use case is to remove it, and then insert it elsewhere. This causes a remove, and this delay helps insure that the insertion
 *   happens and we can test for this and prevent destroying.
 * @property {Boolean} [settings.useEmojiImages=true]    Currently images are used for Emojis so that all users see the same
 *   graphics no matter what platoform they are on. Also insures that platforms lacking emoji support can still render
 *   emojis.  If your customers are all on platforms that support rendering of emojis you may disable this.
 * @property {String} [settings.googleMapsKey=]   The google maps key to use with Location Messages.
 */

module.exports = {
  appId: '',
  __client: null,
  get client() {
    return module.exports.__client;
  },
  set client(client) {
    module.exports.__client = client;
  },
  messageGroupTimeSpan: 1000 * 60 * 30,
  disableTabAsWhiteSpace: false,
  markReadDelay: 2500,
  defaultHandler: {
    tagName: 'layer-message-unknown',
  },
  textHandlers: ['autolinker', 'newline', 'emoji'],
  destroyAfterDetachDelay: 10000,
  useEmojiImages: true,
  googleMapsKey: '',
};

