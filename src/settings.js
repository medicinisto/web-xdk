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
 * `appId` is the only required setting that an app must provide.
 *
 * @class Layer.Settings
 */

/**
 * The appId that was passed into the `Layer.init({ appId })`
 *
 * @property {String} appId
 */


/**
 * Accessor for getting the singleton Client; set automatically by the `Layer.init({ appId })` call
 *
 * ```
 * Layer.client.createConversation({participant: ['layer:///identities/frodo-the-dodo']});
 * ```
 *
 * @property {Layer.Core.Client} [Client]
 */

/**
 * Messages are grouped based on sender, as well as the duration set here.
 *
 * This value specifies how much time must pass before messages are no longer in the same group.
 * Measured in miliseconds.
 *
 * @property {Number} [messageGroupTimeSpan=1,800,000]
 */

/**
 * Number of miliseconds delay must pass before a subsequent challenge is issued.
 *
 * This value is here to insure apps don't get challenge requests while they are
 * still processing the last challenge event.
 *
 * @property {Number} [timeBetweenReauths=30 seconds]
 */

/**
 * Time to be offline after which, rather than trying to catch up on missed events, all queries are reset and refired.
 *
 * This can cause some disruption in a UI where the user has paged through messages... all that data will be reset.  The server imposes limits on how far back it can go in catching users up on missed data.
 *
 * @property {Number} [resetAfterOfflineDuration=30 hours]
 */

/**
* By default hitting TAB in the Composer adds space; disable this for tab to go to next component.
 *
 * @property {Boolean} [disableTabAsWhiteSpace=false]
 */

/**
 * Delay before marking a Message as read.
 *
 * This property configures the number of miliseconds to wait after a message becomes visible
 * before its marked as read.  A value too small means it was visible but the user may not
 * have actually had time to read it as it scrolls quickly past.
 *
 * @property {Number} [markReadDelay=2500]
 */

/**
 * The default message renderer for messages not matching any other handler.
 *
 * Specify your own UI Component's Tag Name to have that Message Handler used instead.
 *
 * ```
 * Layer.init({
 *   defaultHandler: {
 *      tagName: 'my-custom-unknown-message-handler',
 *    }
 * });
 * ```
 *
 * @property {Object} [defaultHandler]
 * @property {String} [defaultHandler.tagName=layer-message-unknown]
 */

/**
 * Specify which text handlers you want used.
 *
 * Note that any custom handlers you add do not need to be in the settings, they can be called
 * after calling `init()` using `Layer.UI.handlers.text.register` and will be used automatically.
 *
 * ```
 * Layer.init({
 *   textHandlers: ['newline']
 * });
 * ```
 *
 * @property {String[]} [textHandlers=['email', 'autolinker', 'newline', 'emoji']]
 */

/**
 * Wait this long after a Component is removed from the document before destroying it.
 *
 * Note that a common use case is to remove it, and then insert it elsewhere. This causes a
 * remove, and this delay helps insure that the insertion happens without instantly destroying the component as its being inserted elsewhere.
 *
 * @property {Number} [destroyAfterDetachDelay=10000]
 */

/**
 * Use Emoji images instead of OS-specific Emoji Characters.
 *
 * By default, images are used for Emojis so that all users see the same
 * graphics no matter what platform they are on. This also insures that platforms lacking emoji support (or lacking specific emojis) can still render
 * emojis.  If your customers are all on platforms that support rendering of emojis and support the same set of emojis, you may disable this.
 *
 * ```
 * Layer.init({
 *   useEmojiImages: false
 * });
 * ```
 *
 * @property {Boolean} [useEmojiImages=true]
 */

/**
 * The google maps key to use with Location Messages.
 *
 * ```
 * Layer.init({
 *   googleMapsKey: "my-key"
 * });
 * ```
 *
 * @property {String} [googleMapsKey=]
 */


/**
 * The MIME Types that are recognized as supported audio files
 *
 * @property {String[]} [audioMIMETypes=['audio/mp3', 'audio/mpeg']]
 */

/**
 * The MIME Types that are recognized as supported video files
 *
 * @property {String[]} [videoMIMETypes=['video/mp4']]
 */

/**
 * The MIME Types that are recognized as supported image files
 *
 * @property {String[]} [imageMIMETypes=['image/gif', 'image/png', 'image/jpeg', 'image/svg']]
 */


/**
 * The widths that the Conversation View must be for it to transition to the rendering associated with a new class of size
 *
 * ```
 * Layer.init({
 *   conversationViewWidths: {
 *     small: 480,
 *     medium: 480,
 *     large: 880
 *   }
 * });
 * ```
 *
 * @property {Object} [conversationViewWidths={small: 320, medium: 480, large: 640}]
 * @property {Number} [conversationViewWidths.small=320] If width is less than this, use `layer-conversation-view-width-tiny` css class
 * @property {Number} [conversationViewWidths.medium=480] If width is less than this, use `layer-conversation-view-width-small` css class
 * @property {Number} [conversationViewWidths.large=640] If width is less than this, use `layer-conversation-view-width-medium` css class
 */

/**
 * Number of items to store in the logs
 *
 * Sets the cache size (number of lines) for logs generated by the XDK; for use in
 * limiting memory usage while still enabling the `Layer.client.sendLogs()` call to gather log data
 *
 * @property {Number} [logSize=150]
 */

let currentClient;

export default {
  appId: '',
  timeBetweenReauths: 30 * 1000,
  resetAfterOfflineDuration: 1000 * 60 * 60 * 30,
  getClient() {
    return currentClient;
  },
  setClient(client) {
    currentClient = client;
  },
  messageGroupTimeSpan: 1000 * 60 * 30,
  disableTabAsWhiteSpace: false,
  markReadDelay: 2500,
  defaultHandler: {
    tagName: 'layer-message-unknown',
  },
  textHandlers: ['email', 'autolinker', 'newline', 'emoji'],
  destroyAfterDetachDelay: 10000,
  useEmojiImages: true,
  googleMapsKey: '',
  audioMIMETypes: ['audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'],
  videoMIMETypes: ['video/mp4', 'video/3gpp'],
  imageMIMETypes: ['image/gif', 'image/png', 'image/jpeg', 'image/svg'],
  conversationViewWidths: {
    small: 320,
    medium: 480,
    large: 640,
  },
  logSize: 150,
};

