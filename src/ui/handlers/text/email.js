/**
 * Detects urls and replaces them with anchor tags
 *
 * @class Layer.UI.handlers.text.Email
 */
import { register } from './text-handlers';

// Copied from http://emailregex.com/
/* eslint-disable max-len, no-useless-escape */
const testExpr = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
/* eslint-enable max-len, no-useless-escape */

function mailto(email, ...args) {
  const original = args.pop();
  const result = `mailto:${email}`;
  if (original.indexOf(result) === -1) {
    return result;
  } else {
    return email;
  }
}

/**
 * The Layer Email TextHandler replaces all email addresses with links
 *
 * @class Layer.UI.handlers.text.Email
 */
register({
  name: 'email',
  order: 290,
  requiresEnable: true,
  handler(textData) {
    textData.text = textData.text.replace(testExpr, mailto);
  },
});
