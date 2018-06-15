/**
 * The Layer User List renders a pagable list of Layer.Core.Identity objects, and allows the user to select people to talk with.
 *
 * This is typically used for creating/updating Conversation participant lists, also usable for listing who
 * is a part of an existing Layer.Core.Conversation or Layer.Core.Channel.
 *
 * This Component can be added to your project directly in the HTML file:
 *
 * ```
 * <layer-identity-list></layer-identity-list>
 * ```
 *
 * Or via DOM Manipulation:
 *
 * ```javascript
 * var identitylist = document.createElement('layer-identity-list');
 * ```
 *
 * ## Common Properties
 *
 * * {@link #selectedIdentities}: Get/set the currently selected Identities in the List
 * * {@link #onIdentitySelected}: Set a function to be called when an Identity is selected
 * * {@link #onIdentityDeselected}: Set a function to be called when an Identity is deselected
 *
 * ```javascript
 * identityList.selectedIdentities = [identity3, identity6];
 * identityList.onIdentitySelected = identityList.onIdentityDeselected = function(evt) {
 *    log("The new selected users are: ", identityList.selectedIdentities.map(identity => identity.displayName).join(', '));
 * }
 * ```
 *
 * ## Events
 *
 * Events listed here come from either this component, or its subcomponents.
 *
 * * {@link #layer-identity-deselected}: User has clicked to unselect an Identity
 * * {@link #layer-identity-selected}: User has clicked to select an Identity
 *
 * ### Importing
 *
 * Not included with the standard build. To import pick one:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-identity-list';
 * import '@layerhq/web-xdk/ui/components/layer-identity-list/layer-identity-list';
 * ```
 *
 * ### Replaceable Content
 *
 * Note that replaceable content may be set via:
 *
 * * The `replaceableContent` property
 * * Any Ancestor UI Component's `replaceableContent` property
 * * DOM nodes with a `layer-replaceable-name` attribute placed within an Ancestor's UI Component
 *
 * The following named regions can be used:
 *
 * `emptyNode`: DOM nodes to show the user when there are no Identities
 * `endOfResultsNode`: DOM nodes to show the user when further paging will not load any more Identities
 * `loadIndicator`: DOM nodes to show the user that Identities are loading
 * `identityRowRightSide`: Add nodes to the right of each Identity Item in the List
 *
 * ```
 * identityList.replaceableContent = {
 *   identityRowRightSide: (identityItem) => {
 *     var button = document.createElement('button');
 *     button.value = 'Talk';
 *     button.addEventListener('click', (evt) => client.createConversation({participants: [identityItem.item]}));
 *     return button;
 *   },
 * };
 * ```
 *
 * @class Layer.UI.components.IdentityListPanel.List
 * @extends Layer.UI.Component
 * @mixin Layer.UI.mixins.List
 * @mixin Layer.UI.mixins.ListLoadIndicator
 * @mixin Layer.UI.mixins.HasQuery
 * @mixin Layer.UI.mixins.ListLoadIndicator
 * @mixin Layer.UI.mixins.SizeProperty
 * @mixin Layer.UI.mixins.EmptyList
 * @mixin Layer.UI.mixins.QueryEndIndicator
 */
import { client } from '../../../settings';
import Core from '../../../core/namespace';
import Util from '../../../utils';
import { registerComponent } from '../component';
import List from '../../mixins/list';
import HasQuery from '../../mixins/has-query';
import ListLoadIndicator from '../../mixins/list-load-indicator';
import EmptyList from '../../mixins/empty-list';
import QueryEndIndicator from '../../mixins/query-end-indicator';
import SizeProperty from '../../mixins/size-property';

registerComponent('layer-identity-list', {
  mixins: [List, HasQuery, ListLoadIndicator, SizeProperty, EmptyList, QueryEndIndicator],
  template: `
    <div class='layer-list-meta' layer-id='listMeta'>
      <div class='layer-empty-list' layer-id='emptyNode'></div>
      <div class='layer-meta-toggle'>
        <!-- Rendered when the list is empty -->
        <layer-replaceable-content layer-id='emptyNode' class='layer-empty-list' name='emptyNode'>
          No Users yet
        </layer-replaceable-content>

        <!-- Rendered when there are no more results to page to -->
        <layer-replaceable-content
          layer-id='endOfResultsNode'
          class='layer-end-of-results-indicator'
          name='endOfResultsNode'>
        </layer-replaceable-content>

        <!-- Rendered when waiting for server data -->
        <layer-replaceable-content layer-id='loadIndicator' class='layer-load-indicator' name='loadIndicator'>
          <layer-loading-indicator></layer-loading-indicator>
        </layer-replaceable-content>
      </div>
    </div>
  `,

  style: `
    layer-identity-list {
      overflow-y: auto;
      display: block;
    }
    layer-identity-list:not(.layer-loading-data) .layer-load-indicator,
    layer-identity-list:not(.layer-end-of-results) .layer-end-of-results-indicator {
      display: none;
    }
  `,

  /**
   * The user has clicked to select an Identity in the Identities List.
   *
   * ```javascript
   *    identityList.onIdentitySelected = function(evt) {
   *      var identityAdded = evt.detail.item;
   *      var selectedIdentities = evt.target.selectedIdentities;
   *
   *      // Note that identityAdded is not yet in selectedIdentities so that you may prevent it from being added using:
   *      evt.preventDefault();
   *    };
   * ```
   *
   *  OR
   *
   * ```javascript
   *    document.body.addEventListener('layer-identity-selected', function(evt) {
   *      var identityAdded = evt.detail.item;
   *      var selectedIdentities = evt.target.selectedIdentities;
   *
   *      // Note that identityAdded is not yet in selectedIdentities so that you may prevent it from being added using:
   *      evt.preventDefault();
   *    });
   * ```
   *
   * @event layer-identity-selected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity} evt.detail.item
   */

  /**
   * @inheritdoc #event-layer-identity-selected
   *
   * @property {Function} onIdentitySelected
   * @property {Event} evt
   * @property {Object} evt.detail
   * @property {Layer.Core.Identity} evt.detail.item
   */

  /**
   * The user has clicked to deselect a identity in the identities list.
   *
   *    identityList.onIdentityDeselected = function(evt) {
   *      var identityRemoved = evt.detail.item;
   *      var selectedIdentities = evt.target.selectedIdentities;
   *
   *      // Note that identityRemoved is not yet removed from selectedIdentities so that you may prevent it from being removed using:
   *      evt.preventDefault();
   *    };
   *
   *  OR
   *
   *    document.body.addEventListener('layer-identity-deselected', function(evt) {
   *      var identityRemoved = evt.detail.item;
   *      var selectedIdentities = evt.target.selectedIdentities;
   *
   *      // Note that identityRemoved is not yet removed from selectedIdentities so that you may prevent it from being removed using:
   *      evt.preventDefault();
   *    });
   *
   * @event layer-identity-deselected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity} evt.detail.item
   */

  /**
   * @inheritdoc #event-layer-identity-deselected
   *
   * @property {Function} onIdentityDeselected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {Layer.Core.Identity} evt.detail.item
   */


  /**
   * The user has clicked to deselect a identity in the identities list, and your app wants to immediately see
   * the complete list of selected identities.
   *
   * @{link #event#layer-identity-selected} asks you to confirm before the selection changes, thus you do not
   * have the complete list of selected identities. Therefore use this event to get the complete list:
   *
   *    identityList.onIdentitySelectionComplete = function(evt) {
   *      var selectedIdentities = evt.target.selectedIdentities;
   *    };
   *
   *  OR
   *
   *    document.body.addEventListener('layer-identity-selection-complete', function(evt) {
   *      var selectedIdentities = evt.target.selectedIdentities;
   *    });
   *
   * @event layer-identity-selection-complete
   * @param {Event} evt
   */

  /**
   * @inheritdoc #event-layer-identity-selection-complete
   *
   * @property {Function} onIdentityDeselected
   * @param {Event} evt
   */
  events: ['layer-identity-selected', 'layer-identity-deselected', 'layer-identity-selection-complete'],
  properties: {

    /**
     * Array of Layer.Core.Identity objects representing the identities who should be rendered as Selected.
     *
     * This property can be used both get and set the selected identities; however, if setting you should not be manipulating
     * the existing array, but rather setting a new array:
     *
     * Do NOT do this:
     *
     * ```javascript
     * list.selectedIdentities.push(identity1); // DO NOT DO THIS
     * ```
     *
     * Instead, Please do this:
     *
     * ```javascript
     * var newList = list.selectedIdentities.concat([]);
     * newList.push(identity1);
     * list.selectedIdentities = newList;
     * ```
     *
     * You can clear the list with
     *
     * ```javascript
     * list.selectedIdentities = [];
     * ```
     *
     * @property {Layer.Core.Identity[]} [selectedIdentities=[]]
     */
    selectedIdentities: {
      set(value) {
        if (!value) value = [];
        if (!Array.isArray(value)) return;

        this.properties.selectedIdentities = value.map((identity) => {
          if (!(identity instanceof Core.Identity)) return client.getIdentity(identity.id);
          return identity;
        });
        this._renderSelection();
      },
      get() {
        if (!Array.isArray(this.properties.selectedIdentities)) this.properties.selectedIdentities = [];
        return this.properties.selectedIdentities;
      },
    },

    /**
     * Provide property to override the function used to render a name for each Identity Item.
     *
     * Note that changing this function will not rerender the list; it should be set on initializing the component.
     *
     * ```javascript
     * identitiesList.nameRenderer = function(identity) {
     *    return 'Dark Lord ' + identity.firstName
     * };
     * ```
     *
     * @property {Function} [nameRenderer=null]
     */
    nameRenderer: {
      type: Function,
    },

    /**
     * Provide property manage the metadata section of the Large Identity Item (requires the {@link #size} property to be `large`).
     *
     * Note that changing this will not rerender the list.
     *
     * ```javascript
     * identityList.metadataRenderer = function(identity) {
     *    return identity.metadata.department;
     * };
     * ```
     *
     * @property {Function} [metadataRenderer=null]
     * @property {Layer.Core.Identity} metadataRenderer.identity
     * @property {String} metadataRenderer.return
     */
    metadataRenderer: {
      type: Function,
    },

    // See Layer.UI.mixins.SizeProperty.size
    size: {
      value: 'medium',
      propagateToChildren: true,
    },

    // See Layer.UI.mixins.SizeProperty.supportedSizes
    supportedSizes: {
      value: ['tiny', 'small', 'medium', 'large'],
    },

    /**
     * The model to generate a Query for if a Query is not provided.
     *
     * @readonly
     * @private
     * @property {String} [_queryModel=Layer.Core.Query.Identity]
     */
    _queryModel: {
      value: Core.Query.Identity,
    },

    /**
     * Provide a hash of DOM generation functions to insert custom content into.
     *
     * The Identity List supports the following Content Areas:
     *
     * * identityRowRightSide: Nodes that appear to the right of each Identity Item; defaults to rendering a checkbox
     * * loadIndicator: Node for rendering the fact that Identities are loading
     * * emptyNode: Node for rendering the fact that there are no Identities for this user
     * * endOfReultsNode: Node for rendering that we have scrolled to the end of the Identities from the server
     *
     * @property {Object} replaceableContent
     */
    replaceableContent: {
      value: {
        identityRowRightSide(widget) {
          const div = document.createElement('div');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.setAttribute('layer-id', 'checkbox');
          div.appendChild(checkbox);
          return div;
        },
      },
    },
  },
  methods: {

    // Lifecycle method
    onCreate() {
      if (!this.id) this.id = Util.generateUUID();

      this.addEventListener('layer-identity-item-selected', this._handleIdentitySelect.bind(this));
      this.addEventListener('layer-identity-item-deselected', this._handleIdentityDeselect.bind(this));
    },

    /**
     * Handle a user Selection event triggered by a Layer.UI.components.IdentityListPanel.Item.
     *
     * Adds the Identity to {@link #selectedIdentities}.
     *
     * @method _handleIdentitySelect
     * @private
     * @param {Event} evt
     */
    _handleIdentitySelect(evt) {
      evt.stopPropagation();
      const identity = evt.detail.item;
      const index = this.selectedIdentities.indexOf(identity);

      // If the item is not in our selectedIdentities array, add it
      if (index === -1) {
        // If app calls prevent default, then don't add the identity to our selectedIdentities list, just call preventDefault on the original event.
        if (this.trigger('layer-identity-selected', { item: identity })) {
          this.selectedIdentities.push(identity);
          this.trigger('layer-identity-selection-complete');
        } else {
          evt.preventDefault();
        }
      }
    },


    /**
     * Handle a user Deselection event triggered by a Layer.UI.components.IdentityListPanel.Item.
     *
     * Removes the identity from {@link #selectedIdentities}.
     *
     * @method _handleIdentityDeselect
     * @private
     * @param {Event} evt
     */
    _handleIdentityDeselect(evt) {
      evt.stopPropagation();
      const identity = evt.detail.item;
      const index = this.selectedIdentities.indexOf(identity);

      // If the item is in our selectedIdentities array, remove it
      if (index !== -1) {
        // If app calls prevent default, then don't remove the identity, just call preventDefault on the original event.
        if (this.trigger('layer-identity-deselected', { item: identity })) {
          this.selectedIdentities.splice(index, 1);
          this.trigger('layer-identity-selection-complete');
        } else {
          evt.preventDefault();
        }
      }
    },

    /**
     * Append a Layer.UI.components.IdentityListPanel.Item to the Document Fragment
     *
     * @method _generateItem
     * @param {Layer.Core.Identity} identity
     * @private
     */
    _generateItem(identity) {
      const identityWidget = document.createElement('layer-identity-item');
      identityWidget.item = identity;
      identityWidget.id = this._getItemId(identity.id);
      identityWidget.nameRenderer = this.nameRenderer;
      identityWidget.metadataRenderer = this.metadataRenderer;
      identityWidget.isSelected = this.selectedIdentities.indexOf(identity) !== -1;
      identityWidget._runFilter(this.filter);
      return identityWidget;
    },

    /**
     * Call this on any Query change events.
     *
     * This updates the selectedIdentities after doing standard query update
     *
     * @method onRerender
     * @private
     * @param {Event} evt
     */
    onRerender(evt = {}) {
      switch (evt.type) {
        // If its a remove event, find the user and remove its widget.
        case 'remove': {
          const removalIndex = this.selectedIdentities.indexOf(evt.target);
          if (removalIndex !== -1) this.selectedIdentities.splice(removalIndex, 1);
          break;
        }

        // If its a reset event, all data is gone, rerender everything.
        case 'reset':
          this.selectedIdentities = [];
          break;
      }
    },

    /**
     * Update the selected property of all Identity Items based on the selectedIdentities property.
     *
     * @method _renderSelection
     * @private
     */
    _renderSelection() {
      const selectedNodes = this.querySelectorAllArray('.layer-identity-item-selected').map(node => node.parentNode);
      const selectedIds = this.selectedIdentities.map(identity => '#' + this._getItemId(identity.id));
      const nodesToSelect = this.selectedIdentities.length ? this.querySelectorAllArray(selectedIds.join(', ')) : [];
      selectedNodes.forEach((node) => {
        if (nodesToSelect.indexOf(node) === -1) node.isSelected = false;
      });
      nodesToSelect.forEach((node) => {
        if (selectedNodes.indexOf(node) === -1) node.isSelected = true;
      });
    },
  },
});

