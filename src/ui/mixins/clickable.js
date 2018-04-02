/**
 * Handler that manages click vs tap event handling.
 *
 * Goals:
 *
 * 1. Subscribe for tap events which are typically faster and more responsive than click events
 * 2. Subscribe for click events as our users may have a mouse
 * 3. Avoid triggering events twice due to the firing of both events
 *
 * @class Layer.UI.mixins.Clickable
 * @protected
 */
import mixins from './index';
import { isIOS } from '../../utils';
import { registerComponent } from '../components/component';

mixins.Clickable = module.exports = {
  methods: {
    onCreate: {
      mode: registerComponent.MODES.BEFORE,
      value() {
        this.properties._clickableState = {};
      },
    },

    /**
     * Remove a Click Handler from the target.
     *
     * Does not check the function to insure it matches, it simply uses the unique name event subscription.
     *
     * ```
     * widget.removeClickHandler('listen-for-click', widget);
     * widget.removeClickHandler('listen-for-click-on-child', widget.nodes.child);
     * ```
     *
     * @method removeClickHandler
     * @param {String} name         Unique name given to the event listener
     * @param {HTMLElement} target  Node that is being watched
     */
    removeClickHandler(name, target) {
      const state = this.properties._clickableState[name];
      if (state) {
        target.removeEventListener('click', state.onFire);
        target.removeEventListener('touchstart', state.onTouchStart);
        target.removeEventListener('touchmove', state.onTouchMove);
        target.removeEventListener('touchend', state.onTouchEnd);
      }
    },

    /**
     * Adds a named event handler to listen for tap and click events on the specified node.
     *
     * For use in building UI Custom Components, not for apps that use the Component.
     *
     * Its assumed that the target node is either this entire UI Component or a subcomponent of this component.
     *
     * The name is any custom unique string.
     *
     * You do not need to maintain a pointer to the function to later remove the event handler.
     *
     * ```
     * widget.addClickHandler('listen-for-click', widget, this.myFn.bind(this));
     * widget.addClickHandler('listen-for-click-on-child', widget.nodes.child, this.myFn.bind(this));
     * ```
     *
     * @method addClickHandler
     * @protected
     * @param {String} name         Any unique string
     * @param {HTMLElement} target  Target of events to listen for
     * @param {Function} fn         Handler to call when the event occurs
     * @param {Boolean} [allowDuplicateEvents=false]  evt.preventDefault is called after a touch event to prevent a click event from also firing. This can mess with other behaviors; so may need to be disabled in some cases.
     */
    addClickHandler(name, target, fn, allowDuplicateEvents = false) {
      if (!this.properties._clickableState[name]) this.properties._clickableState[name] = {};
      const state = this.properties._clickableState[name];
      state.fn = fn;
      state.onTouchStart = this._onTouchStart.bind(this, name);
      state.onTouchMove = this._onTouchMove.bind(this, name);
      state.onTouchEnd = this._onTouchEnd.bind(this, name);
      state.onFire = this._fireClickHandler.bind(this, name);
      state.allowDuplicateEvents = allowDuplicateEvents;

      target.addEventListener('touchstart', state.onTouchStart);
      target.addEventListener('touchmove', state.onTouchMove);
      target.addEventListener('touchend', state.onTouchEnd);
      if (!isIOS) target.addEventListener('click', state.onFire);
    },

    _fireClickHandler(name, evt) {
      const state = this.properties._clickableState[name];

      // Without this test, we block links from opening and probably buttons from clicking and inputs from focusing
      // This is frankly kind of hazardous and we will either need to have a way to add more nodes here or we'll
      // need to rip this out entirely (or allow customers to)
      const clickableTargets = ['A', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'];
      if (!state.allowDuplicateEvents && clickableTargets.indexOf(evt.target.tagName) === -1) {
        // if tap event, prevent the click handler from firing causing a double event occurance
        evt.preventDefault();
      }
      state.fn(evt);
    },

    _onTouchStart(name, evt) {

      const state = this.properties._clickableState[name];
      state.moved = 0;
      state.start = Date.now();
      state.x = evt.touches[0].screenX;
      state.y = evt.touches[0].screenY;
    },

    _onTouchMove(name, evt) {
      const state = this.properties._clickableState[name];
      const distance = Math.abs(evt.touches[0].screenX - state.x) + Math.abs(evt.touches[0].screenY - state.y);
      state.moved = state.moved + distance;
      state.x = evt.touches[0].screenX;
      state.y = evt.touches[0].screenY;

    },

    _onTouchEnd(name, evt) {
      const state = this.properties._clickableState[name];
      // Tap must take less than 3 seconds or its not really a selection event.
      if (state.moved < 15 && Date.now() - state.start < 3000) this._fireClickHandler(name, evt);
      delete state.moved;
      delete state.x;
      delete state.y;
      delete state.start;
    },
  },
};
