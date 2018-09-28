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
import { animatedScrollLeftTo, isInBackground } from '../../ui-utils';
import MessageViewMixin from '../message-view-mixin';
import Throttler from '../../mixins/throttler';
import Clickable from '../../mixins/clickable';
import { isMobile } from '../../../utils';
import Settings from '../../../settings';
import './layer-carousel-message-model';
import { getWhereClicked } from '../../ui-utils/analytics';
import { get as getGraphic } from '../../resources/graphics/';
import '../../resources/graphics/next-arrow';
import '../../resources/graphics/previous-arrow';

const { getClient } = Settings;

registerComponent('layer-carousel-message-view', {
  template: `
    <span layer-id='prev' class="layer-next-icon layer-previous-icon" >${getGraphic('previous-arrow')()}</span>
    <div class="layer-carousel-message-view-items" layer-id="items"></div>
    <span layer-id='next' class="layer-next-icon" >${getGraphic('next-arrow')()}</span>
  `,
  style: `
  layer-carousel-message-view {
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 100%;
    position: relative;
  }
  layer-carousel-message-view > .layer-next-icon {
    display: inline-block;
    z-index: 10;
    position: absolute;
    cursor: pointer;
  }

  layer-carousel-message-view.layer-carousel-end > .layer-next-icon:not(.layer-previous-icon) {
    display: none;
  }
  layer-carousel-message-view.layer-carousel-start > .layer-previous-icon {
    display: none;
  }
  .layer-carousel-message-view-items {
    white-space: nowrap;
    overflow-x: hidden;
  }
  .layer-carousel-message-view-items > layer-message-viewer {
    display: inline-block;
    white-space: initial;
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

    hideMessageItemRightAndLeftContent: {
      value: true,
    },

    /**
     * Tracks the last Carousel Item Index that the user has scrolled to.
     *
     * This tracks the left most fully visible item; if multiple items are visible, this only indicates
     * which one is left most and still fully visible.
     *
     * @property {Number} lastIndex
     */
    lastIndex: {
      value: 0,
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

      // Calculate a maximum allowed Carousel Item Width, add 30px
      // so that we can see the start of the next item in the carousel
      const maxCardWidth = this.getMaxMessageWidth() - 30;

      // Generate/reuse each Carousel Item
      this.model.items.forEach((item) => {
        let card;
        if (item.isDestroyed) return;

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
        const minWidth = Math.min(maxCardWidth, card.nodes.ui.minWidth);
        const maxWidth = (card.nodes.ui.maxWidth ? Math.min(maxCardWidth, card.nodes.ui.maxWidth) : maxCardWidth);
        if (maxWidth < minWidth || maxWidth < card.clientWidth) {
          card.style.maxWidth = card.style.minWidth = card.style.width = maxWidth + 'px';
          card.nodes.ui.maxWidth = card.nodes.ui.minWidth = maxWidth;
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
      const width = this.getFullAvailableMessageWidth();
      if (!width) return;
      this.messageViewer.style.maxWidth = (width - 2) + 'px';
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
        this.scrollToItem(scrollToNode);
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
          if (node.offsetLeft > minScrollLeft) {
            // We found one, so scroll to it, and update out "layer-carousel-start" class
            this.scrollToItem(node);
            found = true;
            break;
          }
        }

        // We did not find one, so just scroll to the prior item
        if (!found) {
          this.scrollToItem(nodes[firstVisibleIndex - 1]);
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
    _findFirstFullyVisibleItem(scrolledTo) {
      const root = this.nodes.items;
      if (scrolledTo === undefined) scrolledTo = root.scrollLeft;

      const nodes = root.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.offsetLeft >= root.offsetLeft + scrolledTo) return node;
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
          this.scrollToItem(root.lastChild);
        } else if (percentShown > 0.6) {

          // Revealing items to the right, but stopped with an item more than 60% visible on the left?
          // Scroll right so as to fully show that item.
          this.scrollToItem(firstPartialCard);
        } else {
          // Else just snap to the item immediately right of the partially visible item.
          this.scrollToItem(firstPartialCard.nextElementSibling);
        }
      }

      // Scrolling items to the right to reach the start of the carousel
      else {
        /* eslint-disable no-lonely-if */
        if (percentDistanceToEnd < 0.4) {
          // If close to the end (far right) while moving towards the start, snap to the last Carousel Item
          this.scrollToItem(root.lastChild);
        } else if (percentShown < 0.4) {
          // If less than 40% of the left-most partially visible item is showing snap to the item to the right of it
          this.scrollToItem(firstPartialCard.nextElementSibling);
        } else {
          // Snap to the left-most partially visible item.  Will also trigger if the left-most item
          // is fully visible but should not do anything... or only adjust it slightly
          this.scrollToItem(firstPartialCard);
        }
      }
      this.properties.touching = false;
    },

    scrollToItem(carouselItemNode) {
      const index = Array.prototype.indexOf.call(this.nodes.items.childNodes, carouselItemNode);
      this.scrollToIndex(index);
    },

    scrollToIndex(index) {
      const lastIndex = this.lastIndex;

      // Figure out where we are scrolling to; should position the item's left edge to the left edge of the Carousel...
      // but should not scroll past the end (if the item is one of the last, it may not make it as far left as the left edge of the Carousel)
      let scrollTo = this.nodes.items.childNodes[index].offsetLeft;
      const maxScroll = this.nodes.items.scrollWidth - this.nodes.items.clientWidth;
      if (scrollTo > maxScroll) scrollTo = maxScroll;

      // Figure out which carousel items were visible before we started this and which will be visible after
      const visibleItemsBefore = [];
      const visibleItemsAfter = [];

      const firstVisibleAfter = this._findFirstFullyVisibleItem(scrollTo);
      index = Array.prototype.indexOf.call(this.nodes.items.childNodes, firstVisibleAfter);

      const lastVisibleBefore = this._findLastFullyVisibleItem(this.nodes.items.childNodes[lastIndex].offsetLeft);
      const lastVisibleAfter = this._findLastFullyVisibleItem(this.nodes.items.childNodes[index].offsetLeft);

      const lastVisibleBeforeIndex =
        lastVisibleBefore ? Array.prototype.indexOf.call(this.nodes.items.childNodes, lastVisibleBefore) : lastIndex;
      const lastVisibleAfterIndex =
        lastVisibleAfter ? Array.prototype.indexOf.call(this.nodes.items.childNodes, lastVisibleAfter) : index;

      for (let i = lastIndex; i <= lastVisibleBeforeIndex; i++) visibleItemsBefore.push(this.nodes.items.childNodes[i]);
      for (let i = index; i <= lastVisibleAfterIndex; i++) visibleItemsAfter.push(this.nodes.items.childNodes[i]);

      // Scroll the view
      animatedScrollLeftTo(this.nodes.items, scrollTo, 200, this._updateScrollButtons.bind(this));


      // Update the CSS Classes based on where our view has scrolled to
      if (index) {
        this.classList.remove('layer-carousel-start');
      } else {
        // If we showed some item to the right then we can't be at the start anymore
        this.classList.add('layer-carousel-start');
      }

      if (lastVisibleAfterIndex === this.nodes.items.length - 1) {
        this.classList.add('layer-carousel-end');
      } else {
        this.classList.remove('layer-carousel-end');
      }

      // Generate analytics events
      if (lastIndex !== index) {
        getClient()._triggerAsync('analytics', {
          type: 'carousel-scrolled',
          size: this.messageViewer.size,
          where: getWhereClicked(this.messageViewer),
          message: this.model.message,
          model: this.model,
          newItems: visibleItemsAfter.map(item => ({ model: item.model, part: item.model.part })),
          oldItems: visibleItemsBefore.map(item => ({ model: item.model, part: item.model.part })),
          inBackground: isInBackground(),
        });
      }

      this.lastIndex = index;
    },
  },
});
