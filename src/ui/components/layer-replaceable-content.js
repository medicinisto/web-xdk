/**
 * The Layer Replaceable Content widget allows for content to be inserted into widgets.
 *
 * TODO: Should be able to access mainComponent's originalChildNodes and find matching children.  However,
 * this really frells with React when you take a React generated node and grab it, so need to be able to clone it with all events.
 *
 * Which also doesn't work with React. So... for now we keep things simple.
 * See Layer.UI.component.replaceableContent for more detail on where this is used.
 *
 * ### Importing
 *
 * This is imported by default. If creating a custom build use:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-replaceable-content';
 * ```
 *
 * @class Layer.UI.components.ReplaceableContent
 * @extends Layer.UI.Component
 */
import { registerComponent } from './component';

registerComponent('layer-replaceable-content', {
  template: '<div class="layer-replaceable-inner" layer-id="content"></div>',
  style: `
    layer-replaceable-content {
      display: flex;
      flex-direction: row;
    }
    .layer-replaceable-inner {
      display: flex;
      flex-direction: row;
    }
    .layer-replaceable-content-empty {
      display: none;
    }
  `,
  properties: {
    /**
     * Each ReplaceableContent has a name by which it is found and provided with new contents
     *
     * @property {String} name
     */
    name: {},
  },
  methods: {

    /**
     * Gather an array of all ancestors of the current UI Component in the DOM tree.
     *
     * Result includes self.
     *
     * @method _gatherParentComponents
     * @private
     * @returns [Layer.UI.Component[]]
     */
    _gatherParentComponents() {
      let node = this;
      const parents = [node];
      while (node.parentComponent) {
        node = node.parentComponent;
        parents.unshift(node);
      }
      return parents;
    },

    /**
     * Lifecycle method for triggering finding/generating and inserting app-specified content into this widget's DOM structure.
     *
     * Called by Layer.UI.Component._onAfterCreate as part of creating every Component; but only really implemented by this component.
     *
     * @method _onProcessReplaceableContent
     * @private
     */
    _onProcessReplaceableContent() {
      if (!this.name) throw new Error('Unnamed replaceable content detected');

      let processed = false;

      // Gather the ancestor nodes each of which could contain a suitable replaceableContent property or attribute
      const parents = this._gatherParentComponents();

      // Identify the top level component
      const mainComponent = parents[0];

      // Identify any nodes inserted into the top level component's DOM structure via:
      // <some-top-level-component><div class='some-default-stuff>some default stuff</div></some-top-level-component>
      // Note that these nodes are removed by Layer.UI.Component during initialization and cached in originalChildNodes
      const originalNodes = mainComponent.properties.originalChildNodes || [];

      // If a generator was provided via the `replaceableContent` property of any parent, use it
      const { nodeOrGenerator, parent } = this._findNodeOrNodeGenerator(parents);

      // Either use the nodeOrGenerator and insert suitable DOM nodes...
      if (nodeOrGenerator) {
        this._insertContent(parent, nodeOrGenerator);
        processed = true;
      } else if (nodeOrGenerator === null) {
        // Only if its undefined is it not processed; null can be used to indicate that Nothing goes there
        // and that no other processing (i.e. restoring original child nodes) should be done
        processed = true;
      }

      // Or... Check the top level component's originalChildNodes (we ignore originalChildNodes of other parents)
      // to see if any of them contain a layer-replaceable-content attribute
      // that matches our name and use it instead.
      else {
        for (let i = 0; i < originalNodes.length; i++) {
          const matchingNode = this._searchAttributesForLayerReplaceableName(mainComponent, originalNodes[i]);
          if (matchingNode) {
            this._insertContent(mainComponent, matchingNode);
            processed = true;
            break;
          }
        }
      }

      // If this Replaceable Content Component had some child nodes, and no content was found elsewhere,
      // insert the originalChildNodes back into the DOM (removed by Layer.UI.Component.createdCallback)
      if (!processed && this.properties.originalChildNodes) this._restoreOriginalChildNodes();
      if (!this.nodes.content.firstChild) this.classList.add('layer-replaceable-content-empty');
    },

    /**
     * Find the DOM Node or Node Generator from any parent components, favoring top level components over lesser parent nodes.
     *
     * Apps providing a replaceableContent property may provide a DOM node or a Function that generates a DOM node.
     *
     * @method _findNodeOrNodeGenerator
     * @param {Layer.UI.Component[]} parents
     * @private
     */
    _findNodeOrNodeGenerator(parents) {
      for (let parentIndex = 0; parentIndex < parents.length; parentIndex++) {
        const parent = parents[parentIndex];
        if (parent.replaceableContent) {
          const nodeOrGenerator = parent.replaceableContent[this.name];
          // A null value should be accepted as a way to override any existing values. However, undefined just means its not been set.
          // (or has been incorrectly set...)
          if (nodeOrGenerator !== undefined) {
            return { nodeOrGenerator, parent };
          }
        }
      }
      return {};
    },

    /**
     * Search the originalChildNodes for any with `layer-replaceable-name` or `data-replaceable-name` attributes whose value matches our name.
     *
     * Returns an HTMLElement that is either the input originalChildNode or any of its descendents.
     *
     * @method _searchAttributesForLayerReplaceableName
     * @private
     * @param {Layer.UI.Component} mainComponent
     * @param {HTMLElement} originalChildNode
     * @returns {HTMLElement}
     */
    _searchAttributesForLayerReplaceableName(mainComponent, originalChildNode) {
      let name = originalChildNode.getAttribute('layer-replaceable-name') ||
        originalChildNode.getAttribute('data-replaceable-name');
      if (name === this.name) {
        return originalChildNode;
      } else {
        return this._findNodesWithin(originalChildNode, (node, isComponent) => {
          name = node.getAttribute('layer-replaceable-name') || node.getAttribute('data-replaceable-name');
          if (name === this.name) return node;
        });
      }
    },

    /**
     * The originalChildNodes of this Replaceable Content Component can be restored.
     *
     * These were removed by Layer.UI.Component.createdCallback, but since there are no replaceableContents to replace them with,
     * allow them to be restored.
     *
     * TODO: Find a way to prevent their removal until they really need to be removed; this can mean overriding a Layer.UI.Component
     * method that removes these nodes for any other UI Component, but which is overridden for this Component.
     *
     * @method _restoreOriginalChildNodes
     * @private
     */
    _restoreOriginalChildNodes() {
      // Add the original nodes back in
      this.properties.originalChildNodes.forEach(item => this.nodes.content.appendChild(item));
      // Remove this stale array
      delete this.properties.originalChildNodes;

      // Make sure that any nodes with a layer-id are properly linked in the parent component
      // Note that onReplaceableContentAdded() will not get called to add these the way it is
      // called for any replaceable content that is inserted
      this._findNodesWithin(this, (node, isComponent) => {
        const layerId = node.getAttribute && node.getAttribute('layer-id');
        if (layerId) this.parentComponent.nodes[layerId] = node;

        // If its a UI Component and not some generic DOM node, setup the originalChildNode's parentComponent pointer as well
        if (isComponent) {
          if (!node.properties) node.properties = {};
          node.properties.parentComponent = this.parentComponent;
        }
      });
    },

    /**
     * Take the given content and insert it into the DOM.
     *
     * The content may be either a function that returns a DOM node, or it could just be a DOM node.
     * This flexability helps developers just write the code...
     *
     * @method _insertContent
     * @param {Layer.UI.Component} parent
     * @param {HTMLElement | Function} nodeOrGenerator
     * @param {HTMLElement} nodeOrGenerator.return
     * @private
     */
    _insertContent(parent, nodeOrGenerator) {

      const oldChild = this.nodes.content;
      let newNode = this._getGeneratedNode(parent, nodeOrGenerator);

      if (newNode) {
        const alreadyInWidget = this.contains(newNode);
        if (!alreadyInWidget) this.removeChild(oldChild);

        // we need a wrapper div; if we are provided with one, great, otherwise create one
        if (!alreadyInWidget && (newNode.tagName !== 'DIV' || !newNode.firstChild)) {
          const tmpNode = document.createElement('div');
          tmpNode.appendChild(newNode);
          newNode = tmpNode;
        }
        if (!newNode.classList.contains('layer-replaceable-inner')) newNode.classList.add('layer-replaceable-inner');

        // Add the newNode to our instance and our DOM
        this.nodes.content = newNode;
        if (!alreadyInWidget) {
          this.appendChild(newNode);
        }

        // Notify the parent that new content has been added; this will allow
        // the content to be added to the parent's `this.nodes` structure
        this.parentComponent.onReplaceableContentAdded(this.name, newNode);
      }
    },

    /**
     * Get the node to be added regardless of whether its from a Function or an HTMLElement
     *
     * @method _getGeneratedNode
     * @param {Layer.UI.Component} parent              The Component that the replaceable content was set from; function is called with it as context
     * @param {HTMLElement | Function} nodeOrGenerator
     * @param {HTMLElement} nodeOrGenerator.return
     * @returns {HTMLElement}
     * @private
     */
    _getGeneratedNode(parent, nodeOrGenerator) {
      let result = nodeOrGenerator;
      let node;
      if (typeof nodeOrGenerator === 'function') {
        result = nodeOrGenerator.call(parent, this.parentComponent, this);
      }

      if (typeof result === 'string') {
        node = document.createElement('div');
        node.classList.add('layer-replaceable-inner');
        node.innerHTML = result;
        if (typeof CustomElements !== 'undefined') CustomElements.upgradeAll(node);
      } else {
        node = result;
      }

      this._findNodesWithin(node, (currentNode, isComponent) => {
        if (isComponent) {
          currentNode.properties.parentComponent = this.parentComponent;
          currentNode._onAfterCreate();
        }
      });
      return node;
    },
  },
});

