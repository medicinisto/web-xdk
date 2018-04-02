/**
 * A helper mixin for Lists that render alternate text in the event that the list is Empty.
 *
 * TODO: Investigate whether this property should be passed along, triggering setters,
 * vs having the data retrieved from a single module and add change listeners.
 *
 * @class Layer.UI.mixins.StateManager
 */
import mixins from './index';

mixins.Throttler = module.exports = {
  properties: {
    /**
     * This state property enables your application to  expose application state to the widget.
     *
     * A flux app for example, might pass its state and actions into this property in order
     * to make it available to all widgets of the DOM subtree.
     *
     * ```
     * widget.state = {
     *   reduxState: {
     *      a: this.props.a,
     *      b: this.props.b
     *   },
     *   reduxActions: {
     *      action1: this.props.actions.action1,
     *      action2: this.props.actions.action2
     *   }
     * };
     * ```
     *
     * Which can then be accessed from within any widget using:
     *
     * ```
     * this.state.reduxActions.action1();
     * ```
     *
     * Note that state properties are propagated during the `onAfterCreate` event, and as such, may not yet be set in `onCreate`
     * nor in `onAfterCreate`.  Subcomponents may not see the state until after the first `onRender` call.
     *
     * TODO: Prevent subcomponent `onRender` from calling without `state`; must handle case where `state` property is unused.
     *
     * @property {Object} state
     */
    state: {
      propagateToChildren: true,
      set(newState) {
        if (this.onRenderState) this.onRenderState();
      },
    },
    /**
     * MIXIN HOOK: onRenderState is called whenever a new state object is assigned.
     *
     * This is for use sharing a state object across your entire app,
     * or an entire set of UI components.
     *
     * @method onRenderState
     */
  },
};
