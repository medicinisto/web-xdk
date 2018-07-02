/**
 * @class Layer.UI
 * @typescript extendclass
 */


/**
 * Hash of components defined using Layer.UI.Component.
 *
 * @property {Object} ComponentsHash
 * @private
 */
const ComponentsHash = {};
module.exports.ComponentsHash = ComponentsHash;


/**
 * Register your template for use by an existing Component.
 *
 * Assumes that the specified Component has already been defined using Layer.UI.Component.
 *
 * This can be used to associate a template with the Component, or to overwrite the default template
 * with your custom template.
 *
 * Consider this `avatar.html` file:
 *
 * ```
 *
 * <template>
 *    <style>....</style>
 *    <img></img>
 * </template>
 * < script >
 *    // Register the template in this *.html file to be the layer-avatar template.
 *    window.Layer.UI.registerTemplate('layer-avatar')
 * </script>
 *
 * ```
 *
 * The call to layerUI.registerTemplate will find the template tag in avatar.html, and associate it with `layer-avatar`.
 *
 * NOTE: the above code assumes that `layerUI` has been attached to `window`; accessing `layerUI` from a template file may otherwise pose challenges.
 *
 * One can also register a template that wasn't created in a standalone template file such as `avatar.html`:
 *
 * * One could create a template using `document.createElement('template')`
 * * One could create a template by putting `<template id='my-avatar'>` within your index.html
 *
 * For these cases, you would need to pass a pointer to that template into `registerTemplate`:
 *
 * ```
 * var template = document.createElement('template');
 * template.innerHTML = '<img></img>';
 * layerUI.registerTemplate('layer-avatar', template);
 *
 * // OR
 * layerUI.registerTemplate('layer-avatar', document.getElementById('my-avatar');
 * ```
 *
 * Note that any styles you write for your template will require the tag-name to be a part of your CSS rules.
 * For those familiar with Shadow Dom and how it simplifies your CSS, we are **not** using Shadow Dom; these CSS
 * rules can affect everything on your page.
 *
 * @method registerTemplate
 * @static
 * @param {String} className                The tag name for the widget your setting the template for; 'layer-avatar'
 * @param {HTMLTemplateElement} [template]  Template node to register.  If none provided, will check the ownerDocument for a template.
 */
module.exports.registerTemplate = function registerTemplate(className, template) {
  if (!template) template = document._currentScript.ownerDocument.querySelector('template');

  // Since we aren't doing shadowDOM, and we don't want to insert the template <style/> tag a thousand times
  // for repeated components, remove the style from the template, and instead cache the styles in
  const styleMatches = template.innerHTML.match(/<style>([\s\S]*?)<\/style>/);
  const styles = styleMatches && styleMatches[1];
  if (styles) {
    template.innerHTML = template.innerHTML.replace(/<style>[\s\S]*?<\/style>/, '');
  }

  // Write template and style as static properties of the Component.
  ComponentsHash[className].template = template;
  ComponentsHash[className].style = styles;
  template.setAttribute('layer-template-registered', 'true');
};

/**
 * Register this template by passing in a string representation of the template.
 *
 * This is comparable to layerUI.registerTemplate except that
 *
 * 1. Instead of taking as input an HTMLTemplateElement, it instead takes a string containing the HTML for the template.
 * 2. Styles should have been removed from the string before calling this; failure to do so will cause the style to be added to your document
 * once per instanceo of this element.  Having 100 of the same style blocks can be a nuisance.
 *
 * @method buildAndRegisterTemplate
 * @static
 * @protected
 * @param {String} className          The tag name for the widget your setting the template for; 'layer-avatar'
 * @param {String} templateStr        Template string to register.
 */
module.exports.buildAndRegisterTemplate = function buildTemplate(className, templateStr) {

  // Generate a template node
  const template = document.createElement('template');
  template.innerHTML = templateStr.trim();

  // Write it as a static property of the Component
  ComponentsHash[className].template = template;
  template.setAttribute('layer-template-registered', 'true');
};

/**
 * Add the style for the template by passing in a string representation of the CSS rules.
 *
 * You do NOT need to call this if using layerUI.registerTemplate.
 *
 * This is comparable to layerUI.registerTemplate except that It only handles styles, not the template itself.
 *
 * @method buildStyle
 * @static
 * @protected
 * @param {String} className           The tag name for the widget your setting the template for; 'layer-avatar'
 * @param {String} styleStr            Style string to associate with this component.  Specifically, expects the output of `Function.toString()`
 */
module.exports.buildStyle = function buildStyles(className, styleStr) {
  ComponentsHash[className].style = styleStr;
};
