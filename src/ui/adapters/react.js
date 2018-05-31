import { ComponentsHash } from '../component-services';
import { register } from './index';

/**
 * Call this function to initialize all of the react components needed to handle the Layer UI for Web widgets.
 *
 * Before using this, please note that Layer.UI.init() must be called prior to calling Layer.UI.adapters.react().
 *
 * Initialize with:
 *
 * ```
 * import React from 'react';
 * import ReactDom from 'react-dom';
 * import '@layerhq/web-xdk/ui/adapters/react';
 * const { ConversationView, ConversationList, UserList, Notifier } = Layer.UI.adapters.react(React, ReactDom);
 * ```
 *
 * Calling this will expose the following React Components:
 *
 * * ConversationView: A wrapper around a Layer.UI.components.ConversationView
 * * ConversationsList: A wrapper around a Layer.UI.components.ConversationListPanel
 * * IdentitiesList: A wrapper around a Layer.UI.components.IdentityListPanel
 * * Notifier: A wrapper around a Layer.UI.components.misc.Notifier
 * * SendButton: A wrapper around a Layer.UI.components.SendButton
 * * FileUploadButton: A wrapper around a Layer.UI.components.FileUploadButton
 *
 * You can then use:
 *
 * ```
 * render() {
 *    return <ConversationList
 *      composeButtons={SendButton, FileUploadButton}
 *      onConversationSelected={this.mySelectHandler}></ConversationList>
 * }
 * ```
 *
 * To insure that Layer.UI.init() is called before Layer.UI.adapters.react(), and each is only called once, we
 * recommend puttings this code in its own module:
 *
 * ```
 * import React, { Component, PropTypes } from 'react';
 * import ReactDom from 'react-dom';
 * import '@layerhq/web-xdk/ui/adapters/react';
 * import Layer from '@layerhq/web-xdk';
 *
 * Layer.init({
 *   appId: 'layer:///apps/staging/my-app-id'
 * });
 * const LayerUIWidgets = Layer.UI.adapters.react(React, ReactDom);
 * module.exports = LayerUIWidgets;
 * ```
 *
 * Now anywhere you need access to the LayerUIWidgets library can import this module and expect everything to
 * evaluate at the correct time, correct order, and only evaluate once.
 *
 * ### Importing
 *
 * Not included with the standard build. To import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/adapters/react';
 * ```
 *
 * @class Layer.UI.adapters.react
 * @singleton
 * @param {Object} React  Pass in the reactJS library
 * @param {Object} ReactDom  Pass in the ReactDom library
 * @return {Object} All the React Components that are imported (some listed below will not show unless application explicitly imports them)
 */
let libraryResult;
function initReact(React, ReactDom) {
  if (libraryResult) return libraryResult;
  libraryResult = {};

  // Gather all UI Components flagged as Main Components; other components don't require special React Components for direct use.
  Object.keys(ComponentsHash)
    .forEach(componentName => defineComponent(componentName));

  function defineComponent(componentName) {
    const component = ComponentsHash[componentName];

    // Get the camel case Component name
    const className = (componentName.substring(0, 1).toUpperCase() +
      componentName.substring(1)
        .replace(/-(.)/g, (str, value) => value.toUpperCase()))
      .replace(/^Layer/, '');

    libraryResult[className] = class extends React.Component {

      constructor(props) {
        super(props);

        if (this.props.replaceableContent && !this.replaceableContent) {
          this.replaceableContent = {};
          Object.keys(this.props.replaceableContent).forEach((nodeName) => {
            const value = this.props.replaceableContent[nodeName];
            if (typeof value === 'function' && !value.replaceableIsSetup) {
              this.replaceableContent[nodeName] = (widget, parent) => {
                let result = value(widget);
                if (result) {
                  if (typeof result === 'string') {
                    return result;
                  } else if (!(result instanceof HTMLElement)) {

                    // React does bad stuff if you give it a component without children to ReactDom.render()
                    if (!result.props.children) {
                      result = React.createElement('div', null, result);
                    }

                    // Render it
                    const tmpNode = parent || document.createElement('div');
                    widget.addEventListener('layer-widget-destroyed', () => ReactDom.unmountComponentAtNode(tmpNode));
                    return ReactDom.render(result, tmpNode);
                  } else {
                    return result;
                  }
                }
              };
            } else {
              this.replaceableContent[nodeName] = value;
            }
          });
        }
      }

      /**
       * On mounting, copy in all properties, and optionally setup a Query.
       *
       * Delay added to prevent Webcomponents property setters from being blown away in safari and firefox
       *
       * @method componentDidMount
       */
      componentDidMount() {
        this.node.componentDidMount = true;
        // Get the properties/attributes that match those used in this.props
        const props = component.properties.filter(property =>
          property.propertyName in this.props || property.attributeName in this.props);

        // Set the webcomponent properties
        props.forEach((propDef) => {
          let value = propDef.propertyName in this.props ?
            this.props[propDef.propertyName] : this.props[propDef.attributeName];
          if (propDef.propertyName === 'replaceableContent' && this.replaceableContent) value = this.replaceableContent;
          if (propDef.type === HTMLElement && value) {
            value = this.handleReactDom(propDef, value);
          }
          if (!this.node.properties) this.node.properties = {};
          if (!this.node.properties._internalState) {
            this.node.properties[propDef.propertyName] = value;
          } else {
            this.node[propDef.propertyName] = value;
          }
        });

        // Browsers running the polyfil may not yet have initialized the component at this point.
        // Force them to be initialized so that by the time the parent component's didComponentMount
        // is called, this will be an initialized widget.
        if (!this.node._onAfterCreate) {
          const evt = document.createEvent('CustomEvent');
          evt.initCustomEvent('HTMLImportsLoaded', true, true, null);
          document.dispatchEvent(evt);
        }

        // The webcomponents polyfil is unable to initilize a component thats in
        // a DocumentFragment so it must follow a more typical lifecycle
        if (this.node._onAfterCreate) this.node._onAfterCreate();

        this._setupStandardProps();
      }

      /**
       * Copy all properties into the dom node, but never let React recreate this widget.
       *
       * @method shouldComponentUpdate
       */
      shouldComponentUpdate(nextProps) {
        // Get the properties/attributes that match those used in this.props
        const props = component.properties.filter(property =>
          nextProps[property.propertyName] !== undefined || nextProps[property.attributeName] !== undefined);

        // Set the webcomponent properties if they have changed
        props.forEach((propDef) => {
          const name = propDef.propertyName in this.props ? propDef.propertyName : propDef.attributeName;
          let value = nextProps[name];
          if (propDef.propertyName === 'replaceableContent' && this.replaceableContent) value = this.replaceableContent;
          if (propDef.type === HTMLElement && value) {
            value = this.handleReactDom(propDef, value);
          }

          if (value !== this.props[name]) {
            this.node[propDef.propertyName] = value;
          }
        }, this);

        this._setupStandardProps();
        return false;
      }

      _setupStandardProps() {
        // CSS Styles
        Object.keys(this.props.style || {})
          .forEach(styleName => (this.node.style[styleName] = this.props.style[styleName]));

        // CSS Classes
        if (this.props.className) {
          const classNames = this.props.className.split(/\s+/);
          (this._addedClassNames || []).forEach((classNameInner) => {
            if (classNames.indexOf(classNameInner) === -1) this.node.classList.remove(classNameInner);
          });

          classNames.forEach(classNameInner => this.node.classList.add(classNameInner));
          this._addedClassNames = [].concat(classNames);
        }
      }

      /**
       * If the property type is HTMLElement, assume the value is a function that generates React Components, or it IS a React Component that need to be wrapped in an HTMLElement and set as the property value.
       *
       * @method handleReactDom
       * @param {Object} propDef
       * @param {Function|Object} value
       */
      handleReactDom(propDef, value) {
        if (!this.layerUIGeneratedNodes) this.layerUIGeneratedNodes = {};

        if (Array.isArray(value)) {
          const array = [];
          if (!this.layerUIGeneratedNodes[propDef.propertyName]) {
            this.layerUIGeneratedNodes[propDef.propertyName] = array;
          }
          array.length = value.length;
          value.forEach((item, index) => {
            if (item.tagName) {
              array[index] = item;
            } else {
              const node = array[index] || document.createElement('div');
              ReactDom.render(typeof item === 'function' ? React.createElement(item) : item, node);
              array[index] = node;
            }
          });
        } else if (value.tagName === undefined) {
          if (!this.layerUIGeneratedNodes[propDef.propertyName]) {
            this.layerUIGeneratedNodes[propDef.propertyName] = document.createElement('div');
          }
          ReactDom.render(value, this.layerUIGeneratedNodes[propDef.propertyName]);
        }
        return this.layerUIGeneratedNodes[propDef.propertyName];
      }


      /**
       * Render method should only be called once and creates the React element with the webcomponent.
       *
       * @method render
       */
      render() {
        return React.createElement(componentName, {
          ref: (node) => { this.node = node; },
          id: this.props.id,
          children: this.props.children,
        });
      }
    };
  }
  return libraryResult;
}

module.exports = initReact;
register('react', initReact);
