/**
 * UI for an Audio Message
 *
 * > TODO: Progress Bars
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-view';
 * ```
 *
 * @class Layer.UI.messages.AudioMessageView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import Constants from '../../constants';
import './layer-audio-message-model';
import Clickable from '../../mixins/clickable';

registerComponent('layer-audio-message-large-view', {
  mixins: [MessageViewMixin, Clickable],

  style: `
    layer-audio-message-large-view {
      display: flex;
      flex-direction: column;
    }
    layer-audio-message-large-view audio {
      width: 100%;
    }
    layer-audio-message-large-view .layer-audio-inner {
      overflow-y: auto;
    }
    layer-audio-message-large-view .layer-audio-poster {
      display: inline-block;
    }
  `,
  template: `
    <div class='layer-vertical-spacer'></div>
    <div class="layer-audio-inner">
      <div layer-id="poster" class="layer-audio-poster"></div>
      <div layer-id="fileIcon" class="layer-file-audio"></div>
      <div class="layer-card-body">
        <div layer-id="title" class="layer-standard-card-container-title"></div>
        <div layer-id="description1" class="layer-standard-card-container-description"></div>
        <div layer-id="description2" class="layer-standard-card-container-description"></div>
        <div layer-id="description3" class="layer-standard-card-container-description"></div>
        <div layer-id="footer1" class="layer-standard-card-container-footer"></div>
        <div layer-id="footer2" class="layer-standard-card-container-footer"></div>
      </div>
    </div>
    <div class='layer-vertical-spacer'></div>
    <audio layer-id="player" preload="auto" controls="controls"></audio>
  `,

  properties: {
    // See parent class
    widthType: {
      value: Constants.WIDTH.FLEX,
    },
    maxWidth: {
      value: 250,
    },
    maxHeight: {
      value: 250,
    },
    autoplay: {
      value: true,
      type: Boolean,
    },
  },
  methods: {
    getTitle() {
      return 'Audio Message';
    },
    onAfterCreate() {
      this.nodes.player.autoplay = this.autoplay;

      this.nodes.player.addEventListener('play', () => (this.properties.playing = true));
      this.nodes.player.addEventListener('pause', () => (this.properties.playing = false));

      this.nodes.player.addEventListener('loadeddata', () => {
        if (this.model.currentTime) {
          this.nodes.player.currentTime = this.model.currentTime;
        }
      });
      this.model.getSourceUrl(url => (this.nodes.player.src = url));

      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.nodes.poster.style.backgroundImage = 'url(' + url + ')'));
      } else {
        this.classList.add('show-audio-file-icon');
      }
    },
    onAttach() {
      if (this.model.preview || this.model.previewUrl) {
        const sizes = this._getBestDimensions();
        this.nodes.poster.style.width = sizes.width + 'px';
        this.nodes.poster.style.height = sizes.height + 'px';
      }
    },

    onDetach() {
      if (this.properties.playing) {
        this.model.currentTime = this.nodes.player.currentTime;
      }
    },

    /**
     *
     * @method onRerender
     */
    onRerender() {
      this.nodes.title.innerHTML = this.model.getTitle();
      this.nodes.description1.innerHTML = this.model.artist;
      this.nodes.description2.innerHTML = this.model.album;
      this.nodes.description3.innerHTML = this.model.genre;
      if (this.model.duration) this.nodes.footer1.innerHTML = this.model.getDuration();
      if (this.model.size) this.nodes.footer2.innerHTML = this.model.getSize();
    },

    _getBestDimensions() {
      let height = this.model.previewHeight;
      let width = this.model.previewWidth;

      const maxWidthAvailable = this.parentNode.clientWidth;
      const maxWidth = Math.min(this.maxWidth, maxWidthAvailable);
      let ratio;

      if (width && height) {
        ratio = width / height;
      } else {
        ratio = 1;
      }

      if (width > maxWidth) {
        width = maxWidth;
        height = width / ratio;
      }
      if (height > this.maxHeight) {
        height = this.maxHeight;
        width = height * ratio;
      }

      return { width, height };
    },
  },
});
