/**
 * @inheritdoc Layer.Core.Message
 *
 * @class Layer.Core.Message.ChannelMessage
 * @extends Layer.Core.Message
 * @ignore
 */
import Settings from '../../settings';
import Core from '../namespace';
import Root from '../root';
import Message from './message';
import { RECEIPT_STATE } from '../../constants';
import { logger } from '../../utils';
import { ErrorDictionary } from '../layer-error';

const { getClient } = Settings;

export default class ChannelMessage extends Message {
  constructor(options) {
    if (options.channel) options.conversationId = options.channel.id;
    super(options);

    this.isInitializing = false;
    if (options && options.fromServer) {
      getClient()._addMessage(this);
    } else {
      this.parts.forEach((part) => { part._message = this; });
    }
  }

  /**
   * Get the Layer.Core.Channel associated with this Layer.Core.Message.ChannelMessage.
   *
   * @method getConversation
   * @param {Boolean} load       Pass in true if the Layer.Core.Channel should be loaded if not found locally
   * @return {Layer.Core.Channel}
   */
  getConversation(load) {
    if (this.conversationId) {
      return getClient().getChannel(this.conversationId, load);
    }
    return null;
  }

  /**
   * Send a Read or Delivery Receipt to the server; not supported yet.
   *
   * @method sendReceipt
   * @param {string} [type=Layer.Constants.RECEIPT_STATE.READ] - One of Layer.Constants.RECEIPT_STATE.READ or Layer.Constants.RECEIPT_STATE.DELIVERY
   * @return {Layer.Core.Message.ChannelMessage} this
   */
  sendReceipt(type = RECEIPT_STATE.READ) {
    logger.warn('Message: Receipts not supported for Channel Messages yet');
    return this;
  }

  /**
   * Delete the Message from the server.
   *
   * ```
   * message.delete();
   * ```
   *
   * @method delete
   */
  delete() {
    if (this.isDestroyed) throw new Error(ErrorDictionary.isDestroyed);

    const id = this.id;
    this._xhr({
      url: '',
      method: 'DELETE',
    }, (result) => {
      if (!result.success &&
          (!result.data || (result.data.id !== 'not_found' && result.data.id !== 'authentication_required'))) {
        Message.load(id);
      }
    });

    this._deleted();
    this.destroy();
  }

  /**
   * On loading this one item from the server, after _populateFromServer has been called, due final setup.
   *
   * @method _loaded
   * @private
   * @param {Object} data  Data from server
   */
  _loaded(data) {
    this.conversationId = data.channel.id;
    getClient()._addMessage(this);
  }


  /**
   * Creates a message from the server's representation of a message.
   *
   * Similar to _populateFromServer, however, this method takes a
   * message description and returns a new message instance using _populateFromServer
   * to setup the values.
   *
   * @method _createFromServer
   * @protected
   * @static
   * @param  {Object} message - Server's representation of the message
   * @return {Layer.Core.Message.ChannelMessage}
   */
  static _createFromServer(message) {
    const fromWebsocket = message.fromWebsocket;
    let conversationId;
    if (message.channel) {
      conversationId = message.channel.id;
    } else {
      conversationId = message.conversationId;
    }

    return new ChannelMessage({
      conversationId,
      fromServer: message,
      _fromDB: message._fromDB,
      _notify: fromWebsocket && message.is_unread && message.sender.user_id !== getClient().user.userId,
    });
  }
}

/*
 * True if this Message has been read by this user.
 *
 * You can change isRead programatically
 *
 *      m.isRead = true;
 *
 * This will automatically notify the server that the message was read by your user.
 * @property {Boolean}
 */
ChannelMessage.prototype.isRead = false;

ChannelMessage.inObjectIgnore = Message.inObjectIgnore;
ChannelMessage._supportedEvents = [].concat(Message._supportedEvents);
Root.initClass.apply(ChannelMessage, [ChannelMessage, 'ChannelMessage', Core.Message]);
