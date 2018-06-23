/**
 * Static properties here only needed if your directly using
 * the Layer.Core.TypingIndicators.TypingPublisher (not needed if
 * you are using the Layer.Core.TypingIndicators.TypingListener).
 *
 *      typingPublisher.setState(Layer.Core.TypingIndicators.STARTED);
 *
 * @class  Layer.Core.TypingIndicators
 * @static
 */
import Core from '../namespace';

module.exports = Core.TypingIndicators = {
  /**
   * Typing has started/resumed
   * @property {String} [STARTED=started]
   * @static
   */
  STARTED: 'started',

  /**
   * Typing has paused
   * @property {String} [PAUSED=paused]
   * @static
   */
  PAUSED: 'paused',

  /**
   * Typing has finished
   * @property {String} [FINISHED=finished]
   * @static
   */
  FINISHED: 'finished',
};
