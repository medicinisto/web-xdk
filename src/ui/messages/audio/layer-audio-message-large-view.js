/**
 * UI for a Large Audio Message
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/audio/layer-audio-message-view';
 * ```
 *
 * @class Layer.UI.messages.AudioMessageLargeView
 * @mixin Layer.UI.messages.MessageViewMixin
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import AudioModel from './layer-audio-message-model';
import Clickable from '../../mixins/clickable';
import { logger, hasLocalStorage, isIOS, isSafari } from '../../../utils';

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
    layer-audio-message-large-view .layer-audio-preview {
      display: inline-block;
      background-repeat: no-repeat;
    }
    layer-audio-message-large-view .layer-audio-controls {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    layer-audio-message-large-view .layer-audio-controls.layer-disabled .layer-audio-time-range,
    layer-audio-message-large-view .layer-audio-controls .layer-audio-time-range-disabled,
    layer-audio-message-large-view .layer-audio-controls.layer-disabled .layer-audio-volume-range,
    layer-audio-message-large-view .layer-audio-controls .layer-audio-volume-range-disabled {
      display: none;
    }
    layer-audio-message-large-view .layer-audio-controls.layer-disabled .layer-audio-time-range-disabled,
    layer-audio-message-large-view:not(.layer-is-ios) .layer-audio-controls.layer-disabled .layer-audio-volume-range-disabled {
      display: block;
    }
    layer-audio-message-large-view.layer-is-ios .layer-audio-volume-range-disabled,
    layer-audio-message-large-view.layer-is-ios .layer-audio-volume-range,
    layer-audio-message-large-view.layer-is-ios .layer-volume-button {
      display: none;
    }
  `,
  /* eslint-disable */
  template: `
    <div class='layer-vertical-spacer'></div>
    <div class="layer-audio-inner">
      <div layer-id="preview" class="layer-audio-preview"></div>
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
    <div class='layer-audio-controls' layer-id='controlPanel'>
      <input type="button" class="layer-play-pause-button" layer-id="playButton"/>
      <span layer-id="currentTime" class='layer-audio-current-time'></span><span class='layer-audio-separator'>/</span><span layer-id="duration" class='layer-audio-duration'></span>
      <input type="range" layer-id="timeRange" min="0" max="100" class="layer-audio-time-range" />
      <div class="layer-audio-time-range-disabled"></div>
      <input type="button" class="layer-audio-rewind-twenty" layer-id="jumpBack" />
      <input type="button" class="layer-audio-forward-twenty" layer-id="jumpForward" />
      <input type="button" class="layer-volume-button" layer-id="muteButton" />
      <input type="range" layer-id="volumeRange" min="0" max="100" class="layer-audio-volume-range" />
      <div class="layer-audio-volume-range-disabled"></div>
    </div>
  `,
  /* eslint-enable */
  properties: {

    /**
     * Maximum width allowed for a preview image in px.
     *
     * @property {Number} [maxPreviewWidth=250]
     */
    maxPreviewWidth: {
      value: 250,
    },

    /**
     * Maximum height allowed for a preview image in px.
     *
     * @property {Number} [maxPreviewHeight=250]
     */
    maxPreviewHeight: {
      value: 250,
    },

    /**
     * Specifiees whether the player should automatically play or not when this view is shown
     *
     * @property {Boolean} [autoplay=true]
     */
    autoplay: {
      value: true,
      type: Boolean,
    },

    /**
     * An `<audio />` node that is used to play the content but which is not inserted into the DOM
     *
     * @property {HTMLElement} audio
     */
    audio: {},

    /**
     * Get/Set whether the player is playing its content.
     *
     * You can toggle playback on/off with:
     * ```
     * view.playing = !view.playing;
     * ```
     *
     * @property {Boolean} playing
     */
    playing: {
      noGetterFromSetter: true,
      set(value) {
        if (value) {
          const result = this.properties.audio.play();
          if (typeof Promise !== 'undefined' && result instanceof Promise) {
            result.catch(this.onError.bind(this));
          }
          this.nodes.playButton.classList.remove('layer-audio-click-to-play');
          this.nodes.playButton.classList.add('layer-audio-click-to-pause');
        } else {
          this.properties.audio.pause();
          this.nodes.playButton.classList.add('layer-audio-click-to-play');
          this.nodes.playButton.classList.remove('layer-audio-click-to-pause');
        }
      },
      get() {
        return !this.properties.audio.paused;
      },
    },

    disabled: {
      value: true,
      set(value) {
        if (value) {
          this.nodes.controlPanel.classList.add('layer-disabled');
        } else {
          this.nodes.controlPanel.classList.remove('layer-disabled');
        }
        this.nodes.playButton.disabled = value;
        this.nodes.muteButton.disabled = value;
      },
    },
    duration: {
      get() {
        return (this.properties.audio.duration !== Infinity && this.properties.audio.duration ?
          this.properties.audio.duration : this.model.duration) || 0;
      },
    },
  },
  methods: {
    onCreate() {
      this.isHeightAllocated = false;
      if (isIOS) this.classList.add('layer-is-ios');
    },

    /**
     * Returns a title for use in a titlebar.
     *
     * @method getTitle
     * @return {String}
     */
    getTitle() {
      return AudioModel.LabelSingular;
    },

    // Setup the player and poster once properties are available.
    onAfterCreate() {
      this.addClickHandler('play-button', this.nodes.playButton, this.onPlayClick.bind(this));
      this.addClickHandler('mute-button', this.nodes.muteButton, this.onMuteClick.bind(this));
      this.addClickHandler('jump-forward', this.nodes.jumpForward, this.onJumpForwardClick.bind(this));
      this.addClickHandler('jump-back', this.nodes.jumpBack, this.onJumpBackClick.bind(this));

      this._setupAudio();

      this.nodes.timeRange.addEventListener('change', this.onProgressSliderChange.bind(this));
      this.nodes.timeRange.addEventListener('mousedown', this.onProgressSliderStart.bind(this));
      this.nodes.timeRange.addEventListener('touchstart', this.onProgressSliderStart.bind(this));
      this.nodes.timeRange.addEventListener('mouseup', this.onProgressSliderStop.bind(this));
      this.nodes.timeRange.addEventListener('touchend', this.onProgressSliderStop.bind(this));

      this.nodes.volumeRange.addEventListener('input', this.onVolumeSliderChange.bind(this));
      this.nodes.volumeRange.addEventListener('change', this.onVolumeSliderChange.bind(this)); // IE 11!

      this.nodes.playButton.classList.add('layer-audio-click-to-play');
      this.nodes.duration.innerHTML = this._getTime(this.duration);
      this.nodes.currentTime.innerHTML = this._getTime(0);
      if (hasLocalStorage && global.localStorage.getItem('LAYER-AUDIO-VOLUME')) {
        this.properties.audio.volume = global.localStorage.getItem('LAYER-AUDIO-VOLUME');
      }
      this.onVolumeChange();

      // Setup the player's preview/file icon
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.nodes.preview.style.backgroundImage = 'url(' + url + ')'));
      } else {
        this.classList.add('show-audio-file-icon');
      }
      this._resizeContent();
    },

    _setupAudio() {
      if (this.properties.audio) {
        this.properties.audio.src = '';
      }
      this.properties.audio = new Audio();
      this.properties.audio.preload = 'auto';
      this.properties.audio.loop = false;

      // If the model indicates we left off somewhere when previously playing this,
      // resume playback once the data is loaded.
      this.properties.audio.addEventListener('loadeddata', this.onLoadedData.bind(this));
      this.properties.audio.addEventListener('playing', this.onPlay.bind(this));
      this.properties.audio.addEventListener('pause', () => (this.playing = false));
      this.properties.audio.addEventListener('playing', () => (this.playing = true));
      this.properties.audio.addEventListener('ended', this._ended.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.updateProgress.bind(this));
      this.properties.audio.addEventListener('error', this.onError.bind(this));
      this.properties.audio.addEventListener('volumechange', this.onVolumeChange.bind(this));
      this.properties.audio.addEventListener('durationchange', this.onDurationChange.bind(this));
      this.properties.audio.addEventListener('seeking', () => this._isSeeking(true));
      this.properties.audio.addEventListener('seeked', () => this._isSeeking(false));


      // Setup the player's source url
      this.model.getSourceUrl(url => (this.properties.audio.src = url));
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
        if (this.model.preview || this.model.previewUrl) {
          const sizes = this.getBestDimensions({
            contentWidth: this.model.previewWidth,
            contentHeight: this.model.previewHeight,
            maxHeight: this.maxPreviewHeight,
            maxWidth: this.maxPreviewWidth,
          });

          this.nodes.preview.style.width = sizes.width + 'px';
          this.nodes.preview.style.height = (sizes.height || sizes.width) + 'px';
        }
        // If it needed to be allocated, its now allocated
        this.isHeightAllocated = true;
      }
    },

    getCurrentTime() {
      return this.properties.audio.currentTime;
    },
    setCurrentTime(value, updateAudio) {
      this.nodes.timeRange.value = value * 100 / this.duration;
      this.nodes.currentTime.innerHTML = this._getTime(this.properties.audio.currentTime);

      const audio = this.properties.audio;
      if (updateAudio && Math.abs(value - audio.currentTime) >= 1) {
        this.properties.playAfterSeek = this.playing;
        audio.pause();
        this.toggleClass('layer-audio-seeking', true);
        audio.currentTime = value;
      }
    },

    /**
     * Any time playback starts, insure that any other audio playing elsewhere has stopped.
     *
     * @method onPlay
     */
    onPlay() {
      this.updateProgress();
      this.properties.playing = true;

      const players = document.querySelectorAll('audio');
      for (let i = 0; i < players.length; i++) {
        if (players[i] !== this.properties.audio) players[i].pause();
      }
      const audioMessages = document.querySelectorAll('layer-audio-message-view');
      for (let i = 0; i < audioMessages.length; i++) {
        if (audioMessages[i] !== this) audioMessages[i].playing = false;
      }
    },

    // See parent method
    onAttach() {
      // resizeContent should already have triggered, but if onAfterCreate was called when the parent
      // was not yet added to the DOM, then it will need to be resolved here.
      if (!this.isHeightAllocated) this._resizeContent();
    },

    /**
     * When this widget is removed from the DOM, cache the currentTime in the model so that whatever viewer picks it up next
     * can resume from where we left off.
     *
     * @method onDetach
     */
    onDetach() {
      if (this.playing) {
        this.model.currentTime = this.getCurrentTime();
      }
      this.playing = false;
      this.properties.audio.src = '';
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
        this.nodes.description3,
        this.nodes.footer1,
        this.nodes.footer2,
      ];

      nodes.forEach((node, index) => (node.innerHTML = this.model.getMetadataAtIndex(index)));
    },

    /**
     * When the play button is clicked, toggle playback... and make sure that the Action Handler is not triggered.
     *
     * Insure that any other audio players have stopped
     *
     * You may add a mixin to customize this behavior.
     *
     * @method onPlayClick
     * @param {Event} evt
     * @protected
     */
    onPlayClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.playing = !this.playing;
    },


    onLoadedData() {
      if (this.model.currentTime) {
        this.setCurrentTime(this.model.currentTime, true);
      } else {
        this.nodes.timeRange.value = 0;
      }
      this.onDurationChange();
      if (this.properties.playing && this.properties.audio.paused) {
        this.properties.playing = false;
        this.playing = true;
      }
    },


    updateProgress() {
      if (this.properties.dragging) return;
      this.setCurrentTime(this.properties.audio.currentTime, false);
    },

    onDurationChange(evt) {
      this.disabled = false;
      this.nodes.duration.innerHTML = this._getTime(this.duration);
      this.setCurrentTime(this.properties.audio.currentTime, true);
      this.playing = this.autoplay;
    },

    onProgressSliderChange() {
      this.properties.audio.currentTime = Number(this.nodes.timeRange.value) * this.duration / 100;
      this.setCurrentTime(this.properties.audio.currentTime, true);
    },

    _ended() {
      this.playing = false;
      if (isSafari) {
        this.autoplay = false;
        this._setupAudio();
      } else if (!this.properties.stickToEnd) {
        this.setCurrentTime(0, true);
      } else {
        this.properties.stickToEnd = false;
      }
    },

    _getTime(time) {
      if (time === Infinity) time = 0;
      let str = '';

      let hrs = Math.floor(time / 3600);
      if (hrs) {
        hrs = '00';
        if (hrs < 10) hrs = '0' + hrs;
        str += hrs + ':';
      }

      const afterHours = time % 3600;
      let mins = Math.floor(afterHours / 60);
      if (!mins) mins = '00';
      else if (mins < 10) mins = '0' + mins;
      str += mins + ':';

      let secs = Math.round(afterHours % 60);
      if (!secs) secs = '00';
      else if (secs < 10) secs = '0' + secs;
      str += secs;
      return str;
    },

    onError(err) {
      logger.error('LAYER-AUDIO-MESSAGE-VIEW: Play failed: ', err);
      this.nodes.playButton.classList.add('layer-audio-click-to-play');
      this.nodes.playButton.classList.remove('layer-audio-click-to-pause');
      this.disabled = true;
    },

    onVolumeChange() {
      if (this.audio.volume) {
        this.nodes.muteButton.classList.add('layer-volume-enabled-button');
        this.nodes.muteButton.classList.remove('layer-volume-muted-button');
      } else {
        this.nodes.muteButton.classList.add('layer-volume-muted-button');
        this.nodes.muteButton.classList.remove('layer-volume-enabled-button');
      }
      this.nodes.volumeRange.value = this.audio.volume * 100;
    },

    onMuteClick() {
      if (this.audio.volume) {
        this.properties.lastVolume = this.audio.volume;
        this.audio.volume = 0;
      } else {
        this.audio.volume = this.properties.lastVolume || 1;
      }
      this.onVolumeChange();
    },

    onVolumeSliderChange() {
      this.audio.volume = this.nodes.volumeRange.value / 100;

      // Don't save a mute setting; must have at least some volume
      if (hasLocalStorage && this.audio.volume) global.localStorage.setItem('LAYER-AUDIO-VOLUME', this.audio.volume);
    },

    onJumpForwardClick() {
      const nextInc = this.audio.currentTime + 20;
      const nextValue = Math.min(this.duration, nextInc);
      if (nextValue === this.duration) {
        this.properties.stickToEnd = true;
        this.playing = false;
      }
      this.setCurrentTime(nextValue, true);
    },

    onJumpBackClick() {
      if (this.getCurrentTime() > 0) {
        this.setCurrentTime(Math.max(0, this.getCurrentTime() - 20), true);
      }
    },

    onProgressSliderStart() {
      this.properties.dragging = true;
    },
    onProgressSliderStop() {
      this.properties.dragging = false;
    },

    _isSeeking(value) {
      this.nodes.playButton.disabled = value;
      this.toggleClass('layer-audio-seeking', value);
      if (!value && this.properties.playAfterSeek) {
        this.properties.playing = false; // force the setter to fire when we set play to true (hacky)
        this.playing = true;
        this.properties.playAfterSeek = false;
      }
    },
  },
});

