/**
 * UI for a Carousel Message.
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/carousel/layer-carousel-message-view';
 * ```
 *
 * @class Layer.UI.messages.CarouselView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import { animatedScrollLeftTo } from '../../ui-utils';
import Constants from '../../constants';
import MessageViewMixin from '../message-view-mixin';
import Throttler from '../../mixins/throttler';
import Clickable from '../../mixins/clickable';
import { isMobile } from '../../../utils';
import './layer-carousel-message-model';

registerComponent('layer-carousel-message-view', {
  template: `
    <span layer-id='prev' class="layer-next-icon layer-previous-icon" ></span>
    <div class="layer-carousel-message-view-items" layer-id="items"></div>
    <span layer-id='next' class="layer-next-icon" ></span>
  `,
  style: `
  layer-carousel-message-view {
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 100%;
    position: relative;
  }
  layer-carousel-message-view .layer-next-icon {
    display: inline-block;
    z-index: 10;
    position: absolute;
    cursor: pointer;
  }

  layer-carousel-message-view.layer-carousel-end .layer-next-icon:not(.layer-previous-icon) {
    display: none;
  }
  layer-carousel-message-view.layer-carousel-start .layer-previous-icon {
    display: none;
  }
  .layer-carousel-message-view-items {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow-x: hidden;
  }
  .layer-carousel-message-view-items:after {
    content: "";
    flex: 0 0 5px;
  }
  layer-carousel-message-view.layer-is-mobile .layer-next-icon {
    display: none;
  }
  `,

  mixins: [MessageViewMixin, Throttler, Clickable],

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {

    /**
     * Use a Titled Display Container to render this UI if there is a title; not supported on mobile devices
     *
     * @experimental
     * @property {String} [messageViewContainerTagName=layer-titled-message-view-container]
     */
    messageViewContainerTagName: {
      noGetterFromSetter: true,
      get() {
        return this.model.title ? 'layer-titled-message-view-container' : null;
      },
    },

    // See parent class
    widthType: {
      value: Constants.WIDTH.FLEX,
    },

    hideMessageItemRightAndLeftContent: {
      value: true,
    },
  },
  methods: {

    /**
     * @experimental
     */
    getIconClass() {
      return '';
    },

    /**
     * @experimental
     */
    getTitle() {
      return this.model.title;
    },

    /**
     * When component is destroyed (lifecycle method) release any event handlers
     *
     * @method onDestroy
     */
    onDestroy() {
      window.removeEventListener('resize', this.properties.onResize);
    },

    /**
     * On creating this component, wire up all the event handlers and initial property values.
     *
     * * Wire up click-next/click-prev buttons for scrolling through carousel items.
     * * Wire up touch events for touch scrolling the carousel
     * * Wire up the window.resize event to resize the carousel
     *
     * @method onCreate
     */
    onCreate() {
      this.addClickHandler('click-next', this.nodes.next, this._scrollForward.bind(this));
      this.addClickHandler('click-prev', this.nodes.prev, this._scrollBackward.bind(this));
      this.properties.startX = this.properties.startY = null;
      this.properties.touching = false;
      this.properties.dx = 0;
      this.addEventListener('touchstart', this._touchStart.bind(this));
      this.addEventListener('touchend', this._touchEnd.bind(this));
      this.addEventListener('touchmove', this._touchMove.bind(this));

      this.properties.onResize = this._onResize.bind(this);
      window.addEventListener('resize', this.properties.onResize);

      if (global.navigator && isMobile) this.classList.add('layer-is-mobile');
    },


    /**
     * Whenever there is a change of state in the model, or during intitializtion, rerender each carousel item.
     *
     * There are not currently any relevant states.
     *
     * @method onRerender
     */
    onRerender() {
      if (!this.properties._internalState.onAttachCalled) return;
      this._adjustCarouselWidth();

      // Cache all of the items so we can resuse them
      const itemUIs = Array.prototype.slice.call(this.nodes.items.childNodes);

      // Clear the DOM
      this.nodes.items.innerHTML = '';

      // Calculate a maximum allowed Carousel Item Width
      const maxCardWidth = this._getMaxMessageWidth();

      // Generate/reuse each Carousel Item
      this.model.items.forEach((item) => {
        let card;

        // See if we've already generated the Carousel Item UI and add it back into the DOM if so.
        for (let i = 0; i < itemUIs.length; i++) {
          if (itemUIs[i].model === item) {
            card = itemUIs[i];
            this.nodes.items.appendChild(card);
            break;
          }
        }

        // Generate the Carousel Item UI Component if not cached
        if (!card) {
          card = this.createElement('layer-message-viewer', {
            // message: this.model.message,
            // rootPart: item.part,
            model: item,
            parentNode: this.nodes.items,
          });
        }

        // Apply some appropiate widths based on the cards preferences and behaviors and our Maximum
        // Carousel Item Width calculated above.
        const preferedMinWidth = card.nodes.ui.preferredMinWidth;
        const preferedMaxWidth = Math.min(maxCardWidth, card.nodes.ui.preferredMaxWidth);
        switch (card.widthType) {
          case Constants.WIDTH.FULL:
            card.style.width = card.style.minWidth = preferedMaxWidth + 'px';
            break;
          case Constants.WIDTH.FLEX:
            if (preferedMaxWidth < preferedMinWidth) {
              card.style.maxWidth = card.style.minWidth = card.style.width = preferedMaxWidth + 'px';
            } else {
              card.style.maxWidth = card.style.minWidth = card.style.width = preferedMinWidth + 'px';
            }
            break;
        }
      });

      // Rerender the scroll buttons after rendering of the carousel has settled
      setTimeout(this._updateScrollButtons.bind(this), 10);
    },

    /**
     * After being added to the DOM structure (lifecycle method), rerender.
     *
     * Component gets key sizing information once its on the DOM.
     *
     * @method onAttach
     */
    onAttach() {
      setTimeout(this._updateScrollButtons.bind(this), 10);
      this.onRerender();
    },

    /**
     * Call Layer.UI.messages.CarouselView._adjustCarouselWidth any time the window resizes.
     *
     * @method _onResize
     * @private
     */
    _onResize() {
      this._throttler(() => {
        this._adjustCarouselWidth();
        this._updateScrollButtons();
      });
    },

    /**
     * Any time the width changes (or might have changed) recalculate the Carousel's width.
     *
     * @method _adjustCarouselWidth
     * @private
     */
    _adjustCarouselWidth() {
      const parent = this.parentComponent.parentNode;
      if (!parent || !parent.clientWidth) return 0;
      const carouselWidth = parent.clientWidth ? Math.floor(parent.clientWidth - 2) : 0;
      if (carouselWidth) this.messageViewer.style.maxWidth = carouselWidth + 'px';
    },

    /**
     * Get the maximum allowed width for individual (generic) Carousel Items.
     *
     * Individual Carousel Items may have their own preferences, but they should not excede this value.
     *
     * @method _getMaxMessageWidth
     * @returns {Number}
     * @private
     */
    _getMaxMessageWidth() {
      const parent = this.parentComponent.parentNode;
      if (!parent || !parent.clientWidth) return 350;
      let width = parent.clientWidth;
      if (width > 600) width = width * 0.6;
      else width = width * 0.8;
      return Math.floor(width);
    },

    /**
     * Update whether the Scroll Back and Scroll Forwards buttons are visible.
     *
     * Bases decision on available width, and current scroll state.
     *
     * @method _updateScrollButtons
     * @private
     */
    _updateScrollButtons() {
      const root = this.nodes.items;
      if (!root.childNodes.length) return;
      this.toggleClass('layer-carousel-start', root.scrollLeft <= root.firstElementChild.offsetLeft);

      const lastVisible = this._findLastFullyVisibleItem() || this._findFirstPartiallyVisibleItem();
      const children = this.nodes.items.childNodes;
      this.toggleClass('layer-carousel-end', lastVisible === children[children.length - 1]);
    },

    /**
     * Scroll to the next set of carousel items in response to clicking the next/prev buttons.
     *
     * @method _scrollForward
     * @param {Event} evt
     * @private
     */
    _scrollForward(evt) {
      // Click events that cause scrolling should not trigger any other events
      evt.preventDefault();
      evt.stopPropagation();

      const root = this.nodes.items;
      const nodes = root.childNodes;

      // The last visible item on the right edge of the carousel is either the last fully visible item,
      // or if there is no fully visible last item then that means no item is fully visible so just grab
      // the first partially visible item on the left.
      const lastVisible = this._findLastFullyVisibleItem() || this._findFirstPartiallyVisibleItem();
      const lastVisibleIndex = Array.prototype.indexOf.call(root.childNodes, lastVisible);

      // If there are more items to the right of Carousel Item we are treating as "last visible",
      // scroll them into view.
      // 1. If there was a last fully visible item, then grab the next item and make it the left most
      //    item which should show it an perhaps more beyond it
      // 2. If there wasn't a fully visible item, then just take the first partially visible on the left
      //    and scroll to show the item right after it
      if (lastVisible && lastVisibleIndex !== -1 && lastVisibleIndex < root.childNodes.length - 1) {
        const scrollToNode = nodes[lastVisibleIndex + 1];
        const scrollTo = scrollToNode.offsetLeft;
        animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));

        // If we showed some item to the right then we can't be at the start anymore
        this.classList.remove('layer-carousel-start');
      }
    },

    /**
     * Scroll to the previous set of carousel items in response to clicking the next/prev buttons.
     *
     * @method _scrollBackward
     * @param {Event} evt
     * @private
     */
    _scrollBackward(evt) {
      // Click events that cause scrolling should not trigger any other events
      evt.preventDefault();
      evt.stopPropagation();

      const root = this.nodes.items;
      const nodes = root.childNodes;

      // Whatever happens, we're no longer at the end if the user is clicking to go to the start.
      // Note that the user should not be able to click to go towards the start if its already visible
      this.classList.remove('layer-carousel-end');

      // Get the first fully visible item
      // TODO: Do we need to handle case where there is not a fully visible item found?
      const firstVisible = this._findFirstFullyVisibleItem();
      const firstVisibleIndex = Array.prototype.indexOf.call(nodes, firstVisible);

      // If we aren't already at the left most item, process the scroll request
      if (firstVisibleIndex > 0) {

        // Starting with one item left of the first fully visible item from the left,
        // look for the right amount to scroll.
        // Ideally first fully visible item on the left will end scrolled off the right edge,
        // but we must insure that the item immediately to its left is NOT scrolled off the edge
        // When this is done, the item to the left should therefore be the rightMostCard.
        const rightMostCard = nodes[firstVisibleIndex - 1];

        // Our scrollLeft property must not go below a value that would shift the rightMostCard off the right edge
        const minScrollLeft = rightMostCard.offsetLeft - root.clientWidth + rightMostCard.clientWidth + 10;

        // Iterate over nodes to find one that can be flush with our left edge without exceding our minScrollLeft
        let found = false;
        for (let i = 0; i <= firstVisibleIndex - 1; i++) {
          const node = nodes[i];
          const scrollTo = node.offsetLeft;
          if (scrollTo > minScrollLeft) {
            // We found one, so scroll to it, and update out "layer-carousel-start" class
            animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));
            this.toggleClass('layer-carousel-start', scrollTo <= nodes[0].offsetLeft);
            found = true;
            break;
          }
        }

        // We did not find one, so just scroll to the prior item
        if (!found) {
          const scrollTo = nodes[firstVisibleIndex - 1].offsetLeft;
          animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));
          this.toggleClass('layer-carousel-start', scrollTo <= nodes[0].offsetLeft);
        }
      }
    },

    /**
     * Find the last (rightmost) fully visible carousel item.
     *
     * @method _findLastFullyVisibleItem
     * @param {Number} optionalScroll    Optionally start looking from the specified offset
     * @private
     * @returns {Layer.UI.handlers.message.MessageViewer}
     */
    _findLastFullyVisibleItem(optionalScroll) {
      const root = this.nodes.items;
      if (!optionalScroll) optionalScroll = root.scrollLeft;
      const nodes = root.childNodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if ((node.offsetLeft + node.clientWidth) <= (root.offsetLeft + root.clientWidth + optionalScroll) &&
            node.offsetLeft >= root.offsetLeft + optionalScroll) return node;
      }
    },

    /**
     * Find the first (leftmost) fully visible carousel item.
     *
     * @method _findFirstFullyVisibleItem
     * @private
     * @returns {Layer.UI.handlers.message.MessageViewer}
     */
    _findFirstFullyVisibleItem() {
      const root = this.nodes.items;
      const nodes = root.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.offsetLeft >= root.offsetLeft + root.scrollLeft) return node;
      }
    },

    /**
     * Find the first (leftmost) partially visible carousel item.
     *
     * @method _findFirstPartiallyVisibleItem
     * @private
     * @returns {Layer.UI.handlers.message.MessageViewer}
     */
    _findFirstPartiallyVisibleItem() {
      const root = this.nodes.items;
      const nodes = root.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.offsetLeft + node.clientWidth >= root.offsetLeft + root.scrollLeft) return node;
      }
    },

    /**
     * User has touched the carousel and is presumably about to drag it to scroll it.
     *
     * Initialize the scrolling values with the given touch start point.
     *
     * @method _touchStart
     * @private
     * @param {Event} evt
     */
    _touchStart(evt) {
      this.properties.touching = true;
      const touch = evt.touches ? evt.touches[0] : evt;
      this.properties.dx = 0;
      this.properties.startScrollX = this.nodes.items.scrollLeft;
      this.properties.startX = touch.pageX;
      this.properties.startY = touch.pageY;
      // this.width = this.$element.width()
    },

    /**
     * User has moved their finger across the Carousel.
     *
     * Update the scroll position based on the offset from the touchstart.
     *
     * @method _touchMove
     * @private
     * @param {Event} evt
     */
    _touchMove(evt) {
      if (!this.properties.touching) return;
      const touch = evt.touches ? evt.touches[0] : evt;
      const dx = touch.pageX - this.properties.startX;
      const dy = touch.pageY - this.properties.startY;
      if (Math.abs(dx) < Math.abs(dy)) return; // vertical scroll

      evt.preventDefault(); // prevent vertical scroll of document.body
      evt.stopPropagation();

      const scrollLeft = -dx;
      this.nodes.items.scrollLeft = this.properties.startScrollX + scrollLeft;

      // If the user is dragging a carousel, and our composer has focus, blur it
      // so that the on-screen keyboard goes away and the carousel items are fully visible
      if (document.activeElement.tagName === 'TEXTAREA') document.activeElement.blur();
    },

    /**
     * User has finished moving their finger across the Carousel.
     *
     * Attempt to scroll to create a snap-to-item effect where the carousel scrolls forwards
     * or backwards as needed to stop at an appropiate place.
     *
     * @method _touchMove
     * @private
     * @param {Event} evt
     */
    _touchEnd(evt) {
      if (!this.properties.touching) return;
      const root = this.nodes.items;

      const touch = evt.changedTouches ? evt.changedTouches[0] : evt;

      // If finger ended on a larger X than it started, then it moved right
      // If finger moved right, we are decreasing our scrollLeft value
      const fingerDirection = touch.pageX - this.properties.startX > 0 ? 'right' : 'left';

      const firstPartialCard = this._findFirstPartiallyVisibleItem();
      const cardWidth = firstPartialCard.clientWidth;
      const visibleItemWidth = firstPartialCard.offsetLeft + firstPartialCard.clientWidth - root.scrollLeft;
      const percentShown = visibleItemWidth / cardWidth;
      const distanceToEnd = root.scrollWidth - root.scrollLeft - root.clientWidth;
      const percentDistanceToEnd = distanceToEnd / cardWidth;

      // Items scroll to the left to reveal the right most items at the end of the carousel
      if (fingerDirection === 'left') {
        if (percentDistanceToEnd < 0.6) {
          // Revealing items to the right, but only a fraction of a card width from the end, so just scroll to the last (right-most) Carousel Item
          animatedScrollLeftTo(root, root.lastChild.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else if (percentShown > 0.6) {

          // Revealing items to the right, but stopped with an item more than 60% visible on the left?
          // Scroll right so as to fully show that item.
          animatedScrollLeftTo(root, firstPartialCard.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else {
          // Else just snap to the item immediately right of the partially visible item.
          animatedScrollLeftTo(root, firstPartialCard.nextElementSibling.offsetLeft,
            200, this._updateScrollButtons.bind(this));
        }
      }

      // Scrolling items to the right to reach the start of the carousel
      else {
        /* eslint-disable no-lonely-if */
        if (percentDistanceToEnd < 0.4) {
          // If close to the end (far right) while moving towards the start, snap to the last Carousel Item
          animatedScrollLeftTo(root, root.lastChild.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else if (percentShown < 0.4) {
          // If less than 40% of the left-most partially visible item is showing snap to the item to the right of it
          animatedScrollLeftTo(root, firstPartialCard.nextElementSibling.offsetLeft,
            200, this._updateScrollButtons.bind(this));
        } else {
          // Snap to the left-most partially visible item.  Will also trigger if the left-most item
          // is fully visible but should not do anything... or only adjust it slightly
          animatedScrollLeftTo(root, firstPartialCard.offsetLeft, 200, this._updateScrollButtons.bind(this));
        }
      }
      this.properties.touching = false;
    },
  },
});
