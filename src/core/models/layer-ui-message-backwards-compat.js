/*
 * Adds backwards compatability for the plain/text and image messages from Layer UI/Atlas.
 *
 */

import Core from '../namespace';
import { generateUUID } from '../../utils';

function isPlainText(message) {
  const isCard = message.parts.filter(part => part.mime_type.match(/role=root/)).length;
  const textPlainPart = message.parts.filter(part => part.mime_type === 'text/plain')[0];
  return !isCard && textPlainPart;
}

function isImage(message) {
  const isCard = message.parts.filter(part => part.mime_type.match(/role=root/)).length;
  const source = message.parts.filter(part =>
    ['image/png', 'image/gif', 'image/jpeg'].indexOf(part.mime_type) !== -1)[0];
  return !isCard && source;
}

function convertToTextMessage(message) {
  const TextModel = Core.Client.getMessageTypeModelClass('TextModel');
  if (TextModel) {
    const textPlainPart = message.parts.filter(part => part.mime_type === 'text/plain')[0];
    textPlainPart.body = JSON.stringify({ text: textPlainPart.body });
    textPlainPart.mime_type = TextModel.MIMEType + '; role=root';
  }
}

function convertToImage(message) {
  const ImageModel = Core.Client.getMessageTypeModelClass('ImageModel');
  if (ImageModel) {
    const source = message.parts.filter(part =>
      ['image/png', 'image/gif', 'image/jpeg'].indexOf(part.mime_type) !== -1)[0];
    const preview = message.parts.filter(part => part.mime_type === 'image/jpeg+preview')[0];
    const metaPart = message.parts.filter(part => part.mime_type.toLowerCase() === 'application/json+imagesize')[0];
    const meta = metaPart ? JSON.parse(metaPart.body) : {};
    const uuid = generateUUID();
    const parts = [
      {
        id: message.id + '/parts/' + uuid,
        mime_type: ImageModel.MIMEType + ';role=root',
        body: JSON.stringify(meta),
      },
      source,
    ];

    source.mime_type += ';role=source;parent-node-id=' + uuid;

    if (preview) {
      parts.push(preview);
      preview.mime_type += ';role=preview;parent-node-id=' + uuid;
    }
    message.parts = parts;
  }
}

module.exports = function upgardeMessages(message) {
  if (isPlainText(message)) {
    convertToTextMessage(message);
  } else if (isImage(message)) {
    convertToImage(message);
  }
};
