/**
 * UI for a Large Video Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-video-message-view';
 * ```
 *
 * @class Layer.UI.messages.VideoMessageLargeView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import VideoModel from './layer-video-message-model';
import Clickable from '../../mixins/clickable';

registerComponent('layer-video-message-large-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
    layer-video-message-large-view {
      display: flex;
      flex-direction: column;
    }
    layer-video-message-large-view .layer-video-inner {
      overflow-y: auto;
    }
  `,
  /* eslint-disable */
  template: `
    <video layer-id="player" preload="auto" controls="controls"></video>
    <div class="layer-card-body">
      <div layer-id="title" class="layer-standard-card-container-title"></div>
      <div layer-id="description1" class="layer-standard-card-container-description"></div>
      <div layer-id="description2" class="layer-standard-card-container-description"></div>
      <div layer-id="footer1" class="layer-standard-card-container-footer"></div>
      <div layer-id="footer2" class="layer-standard-card-container-footer"></div>
      <div layer-id="footer3" class="layer-standard-card-container-footer"></div>
    </div>
  `,
  /* eslint-enable */
  properties: {

    /**
     * Specifiees whether the player should automatically play or not when this view is shown
     *
     * @property {Boolean} [autoplay=true]
     */
    autoplay: {
      value: true,
      type: Boolean,
    },
  },
  methods: {

    /**
     * Returns a title for use in a titlebar.
     *
     * @method getTitle
     * @return {String}
     */
    getTitle() {
      return VideoModel.LabelSingular;
    },

    /*
     * Height will be allocated once we sort out preview images; initialize it to false
     */
    onCreate() {
      this.isHeightAllocated = false;
    },

    /*
     * Setup the player and poster once properties are available.
     */
    onAfterCreate() {
      const player = this.nodes.player;

      player.autoplay = this.autoplay;

      // If the model indicates we left off somewhere when previously playing this,
      // resume playback once the data is loaded.
      player.addEventListener('loadeddata', () => {
        if (this.model.currentTime) {
          player.currentTime = this.model.currentTime;
        }
      });

      // Setup the player's source url
      this.model.getSourceUrl(url => (player.src = url));

      // Handle expiring urls
      this._handleExpiringUrls();

      // Setup the player's preview/file icon
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (player.poster = url));
      }

      this._resizeContent();
    },

    /**
     * Setup the message size based on the previewWidth/previewHeight.
     *
     * @method _resizeContent
     * @private
     */
    _resizeContent() {
      const width = this.getAvailableMessageWidth();
      if (width) {
        const sizes = this.getBestDimensions({
          contentWidth: this.model.width,
          contentHeight: this.model.height,
        });
        this.nodes.player.style.width = sizes.width + 'px';
        this.nodes.player.style.height = sizes.height + 'px';

        const styles = getComputedStyle(this.lastChild);
        const margins = parseInt(styles.getPropertyValue('margin-top'), 10) +
          parseInt(styles.getPropertyValue('margin-bottom'), 10);
        const requiredHeight = this.lastChild.clientHeight + this.lastChild.offsetTop + margins;

        this.trigger('layer-container-reduce-height', {
          height: requiredHeight,
        });
        this.isHeightAllocated = true;
      }
    },

    /*
     * resizeContent should already have triggered, but if onAfterCreate was called when the parent
     * was not yet added to the DOM, then it will need to be resolved here.
     */
    onAttach() {
      if (!this.isHeightAllocated) this._resizeContent();
    },

    /**
     * When this widget is removed from the DOM, cache the currentTime in the model so that whatever viewer picks it up next
     * can resume from where we left off.
     *
     * @method onDetach
     */
    onDetach() {
      if (this.nodes.player.currentTime < this.nodes.player.duration) {
        this.model.currentTime = this.nodes.player.currentTime;
      } else if (this.nodes.player.currentTime === this.nodes.player.duration) {
        this.model.currentTime = 0;
      }
    },

    /**
     * Render all of the metadata
     *
     * @method onRender
     */
    onRender() {
      const nodes = [
        this.nodes.title,
        this.nodes.description1,
        this.nodes.description2,
        this.nodes.footer1,
        this.nodes.footer2,
        this.nodes.footer3,
      ];

      nodes.forEach((node, index) => (node.innerHTML = this.model.getMetadataAtIndex(index)));
    },

    /**
     * If the URL expires, we should get a new url, and need to load it into the player.
     *
     * Message Part automatically calls to refresh this url before it expires, which triggers a model change event.
     *
     * We need to resume playback from wherever it is we left off...
     *
     * @method _handleExpiringUrls
     * @private
     */
    _handleExpiringUrls() {
      const player = this.nodes.player;
      this.model.on('message-type-model:change', () => {
        if (this.model.streamUrl && this.model.streamUrl !== player.src) {
          const wasPlaying = !player.paused;
          const resumeTime = player.currentTime;

          // Once seek has completed, resume playback
          const onSeeked = () => {
            player.removeEventListener('seeked', onSeeked);
            if (wasPlaying) player.play();
          };

          // Once data is loaded, set the resume time from where we left off
          const onLoaded = () => {
            player.removeEventListener('loadeddata', onLoaded);
            player.addEventListener('seeked', onSeeked);
            player.currentTime = resumeTime;
          };
          player.addEventListener('loadeddata', onLoaded);

          // Update the source and kick off the above events
          player.src = this.model.streamUrl;
        }
      });
    },
  },
});
