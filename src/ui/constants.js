/**
 * UI Constants
 *
 * @class Layer.UI.Constants
 * @static
 */
module.exports = {
  /**
   * FOCUS.{NEVER | ALWAYS | DESKTOP_ONLY } is used by the Conversation View to determine how to autofocus on the text input
   *
   * @property {Number} FOCUS
   *
   * TODO: Add some typescript directives to allow these to be a Typescript ENUM
   */
  FOCUS: {
    NEVER: 0,
    ALWAYS: 1,
    DESKTOP_ONLY: 2,
  },

  /**
   * Constans for setting the Conversation List sort
   *
   * * `Layer.UI.Constants.CONVERSATIONS_SORT.LAST_MESSAGE`: Sort by last message
   * * `Layer.UI.Constants.CONVERSATIONS_SORT.CREATED_AT`: Sort by Conversation creation time
   *
   * @property {Number} CONVERSATIONS_SORT
   */
  CONVERSATIONS_SORT: {
    LAST_MESSAGE: 1,
    CREATED_AT: 2,
  },
};
