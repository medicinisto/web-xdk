/**
 * The Layer Emoji TextHandler replaces all :smile: and :-) with emoji images.
 *
 * Change {@link Layer.UI#settings} `useEmojiImages` to `false` to use native emoji characters.
 *
 * @class Layer.UI.handlers.text.Emoji
 */
import RemarkableParser from 'remarkable-emoji/setEmoji';
import Twemoji from 'twemoji';
import Settings from '../../../settings';
import { register } from './text-handlers';

const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g; // eslint-disable-line max-len

const replaceEmojis = (string, expr) => string.replace(regex, expr);

register({
  base: location.protocol + '://twemoji.maxcdn.com/',
  name: 'emoji',
  order: 400,
  requiresEnable: true,
  handler(textData) {
    let text = textData.text;

    if (Settings.useEmojiImages) {
      // See if its an all-emoji line by replacing all emojis with empty strings
      // and seeing if there's anything left when we're done.
      const allEmojiLine = !Twemoji.replace(text, () => '').match(/[\S\n]/);

      // Render the emoji images
      text = Twemoji.parse(text, {
        folder: 'svg',
        ext: '.svg',
        className: allEmojiLine ? 'layer-emoji layer-emoji-line' : 'layer-emoji',
      });
    }

    else {
      const allEmojiLine = !replaceEmojis(text, '').match(/[\S\n]/);
      if (allEmojiLine) {
        text = '<p class="layer-emoji-line">' + text.replace(/ \n /g, '<br/>') + '</p>';
      } else {
        text = replaceEmojis(text, str => `<span class='layer-emoji-char'>${str}</span>`);
      }
    }
    textData.text = text;
  },
});

function setupReplaceEmojis() {
  document.body.addEventListener('layer-compose-bar-processing-text', (evt) => {
    // Newlines are problematic for the parser; add spacing and then remove it when done.
    let text = evt.detail.text.replace(/\n/g, ' \n ');
    text = RemarkableParser(text);
    text = text.replace(/ \n /g, '\n');
    evt.detail.text = text;
  });
}

if (window.document) {
  if (window.document.body) {
    setupReplaceEmojis();
  } else {
    window.document.addEventListener('DOMContentLoaded', evt => setupReplaceEmojis());
  }
}
