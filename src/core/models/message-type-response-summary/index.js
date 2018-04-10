/*
 * A class for registering Response Summary classes, and selecting the right Response Summary class
 * for a given MIME Type.
 *
 * ```
 * import { register } from './index';
 * register(responseSummaryMimeType, responseSummaryClassDefinition);
 * ```
 *
 * ```
 * import { get } from './index';
 * var ClassDef = get(part.mimeType);
 * var responseSummary = new ClassDef();
 * ```
 */
const versions = {};
function register(mimeType, classDef) {
  versions[mimeType] = classDef;
}
function get(mimeType) {
  return versions[mimeType];
}

module.exports = { register, get };
