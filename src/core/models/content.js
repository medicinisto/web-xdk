/**
 * The Content class represents Rich Content.
 *
 * Note that instances of this class will automatically be
 * generated for developers based on whether their message parts
 * require it.
 *
 * That means for the most part, you should never need to
 * instantiate one of these directly.
 *
 *      var content = new Layer.Core.Content({
 *          id: 'layer:///content/8c839735-5f95-439a-a867-30903c0133f2'
 *      });
 *
 * @class  Layer.Core.Content
 * @private
 * @extends Layer.Core.Root
 * @author Michael Kantor
 */
import { client } from '../../settings';
import Core from '../namespace';
import Root from '../root';
import { xhr } from '../../utils';
import { getNativeSupport } from '../../utils/native-support';

const Blob = getNativeSupport('Blob');

class Content extends Root {

  /**
   * Constructor
   *
   * @method constructor
   * @param  {Object} options
   * @param  {string} options.id - Identifier for the content
   * @param  {string} [options.downloadUrl=null] - Url to download the content from
   * @param  {Date} [options.expiration] - Expiration date for the url
   * @param  {string} [options.refreshUrl] - Url to access to get a new downloadUrl after it has expired
   *
   * @return {Layer.Core.Content}
   */
  constructor(options) {
    if (typeof options === 'string') {
      options = { id: options };
    }
    super(options);
  }

  /**
   * Loads the data from google's cloud storage.
   *
   * Data is provided via callback.
   *
   * Note that typically one should use Layer.Core.MessagePart.fetchContent() rather than Layer.Core.Content.loadContent()
   *
   * @method loadContent
   * @param {string} mimeType - Mime type for the Blob
   * @param {Function} callback
   * @param {Blob} callback.data - A Blob instance representing the data downloaded.  If Blob object is not available, then may use other format.
   */
  loadContent(mimeType, callback) {
    xhr({
      url: this.downloadUrl,
      responseType: 'arraybuffer',
    }, (result) => {
      if (result.success) {
        const blob = new Blob([result.data], { type: mimeType });
        callback(null, blob);
      } else {
        callback(result.data, null);
      }
    });
  }

  /**
   * Refreshes the URL, which updates the URL and resets the expiration time for the URL
   *
   * @method refreshContent
   * @param {Function} [callback]
   */
  refreshContent(callback) {
    client.xhr({
      url: this.refreshUrl,
      method: 'GET',
      sync: false,
    }, (result) => {
      const { data } = result;
      this.expiration = new Date(data.expiration);
      this.downloadUrl = data.download_url;
      if (callback) callback(this.downloadUrl);
    });
  }

  /**
   * Is the download url expired or about to expire?
   * We can't be sure of the state of the device's internal clock,
   * so if its within 10 minutes of expiring, just treat it as expired.
   *
   * @method isExpired
   * @returns {Boolean}
   */
  isExpired() {
    if (!this.expiration) return false;
    const expirationLeeway = 10 * 60 * 1000;
    return (this.expiration.getTime() - expirationLeeway < Date.now());
  }

  /**
   * Creates a MessagePart from a server representation of the part
   *
   * @method _createFromServer
   * @private
   * @static
   * @param  {Object} part - Server representation of a part
   */
  static _createFromServer(part) {
    return new Content({
      id: part.id,
      downloadUrl: part.download_url,
      expiration: new Date(part.expiration),
      refreshUrl: part.refresh_url,
    });
  }
}

/**
 * Server generated identifier
 * @property {string}
 */
Content.prototype.id = '';

/**
 * Server generated url for downloading the content
 * @property {string}
 */
Content.prototype.downloadUrl = '';

/**
 * Url for refreshing the downloadUrl after it has expired
 * @property {string}
 */
Content.prototype.refreshUrl = '';

/**
 * Size of the content.
 *
 * @property {number}
 */
Content.prototype.size = 0;

/**
 * Expiration date for the downloadUrl
 * @property {Date}
 */
Content.prototype.expiration = null;

Root.initClass.apply(Content, [Content, 'Content', Core]);
module.exports = Content;
