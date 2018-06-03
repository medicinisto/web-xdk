/**
 * Detects urls and replaces them with anchor tags
 *
 * @class Layer.UI.handlers.text.Autolinker
 */
import IsUrl from '../../ui-utils/is-url';
import { register } from './text-handlers';

const testExpr1 = IsUrl();
const testExpr2 = /\b(mailto|tel):([\S]+)/g;

function generateAnchor(url) {
  let shortUrl = url.replace(/^\w+:\/*/, '');
  shortUrl = shortUrl.replace(/\?.*$/, '');
  shortUrl = shortUrl.replace(/\/$/, '');

  if (shortUrl.length > 40) {
    const firstSlash = shortUrl.indexOf('/', 15);
    const lastSlash = shortUrl.lastIndexOf('/');
    if (firstSlash !== lastSlash) {
      shortUrl = shortUrl.substring(0, firstSlash + 1) + '...' + shortUrl.substring(lastSlash);
    }
  }

  const queryStringIndex = shortUrl.indexOf('?');
  const pathStringIndex = shortUrl.indexOf('#');
  const substrIndex = Math.min.call(
    Math,
    queryStringIndex === -1 ? shortUrl.length : queryStringIndex,
    pathStringIndex === -1 ? shortUrl.length : pathStringIndex,
  );
  shortUrl = shortUrl.substring(0, substrIndex);
  return `<a href='${url}' target='_blank' class='layer-parsed-url'>${shortUrl}</a>`;
}

/**
 * The Layer Autolinker TextHandler replaces all links with anchor tags
 *
 * @class Layer.UI.handlers.text.Autolinker
 */
register({
  name: 'autolinker',
  order: 300,
  requiresEnable: true,
  handler(textData) {
    textData.text = textData.text.replace(testExpr1, generateAnchor);
    textData.text = textData.text.replace(testExpr2, generateAnchor);
  },
});
