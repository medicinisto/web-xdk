/**
 * Register graphical resources for use by the system.
 *
 * Graphics can be registered by shape name and/or by role:
 *
 * ```
 * const mySvgFunc = () => `<svg.....`;
 * register({ svg: mySvgFunc, role: 'file-upload' });
 * ```
 *
 * You may replace any graphic by its role, thus providing your own `file-upload` SVG image.
 *
 * Access graphics using:
 *
 * ```
 * const svg = get('file-upload')();
 * ```
 *
 * Why return a Function? Its assumed that some graphics will need to be customizable on the fly, using methods it exposes;
 * so for consistency, ALL resources need to provide a function.
 *
 * @class Layer.UI.Resources.Graphics
 * @static
 */
const byRole = {};

/**
 * Register a graphic for use by the system.
 *
 * @method register
 * @param {Object} options
 * @param {Function} option.svg
 * @param {String} options.svg.return
 * @param {String} options.role
 */
export function register({ svg, role }) {
  if (role) byRole[role] = svg;
}

/**
 * Get a graphic by its role name.
 *
 * @method get
 * @param {String} role
 * @returns {Function} svgFunc
 * @returns {String} svgFunc.return
 */
export function get(role) {
  if (role && byRole[role]) return byRole[role];
  return null;
}

export function getDom(role) {
  const getter = get(role);
  if (getter) {
    return () => {
      const div = document.createElement('div');
      div.innerHTML = getter();
      return div.firstChild;
    };
  }
  return null;
}
