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
 * @mixin Layer.UI.mixins.WidthTracker
 */
import { registerComponent } from '../../components/component';
import MessageViewMixin from '../message-view-mixin';
import AudioModel from './layer-audio-message-model';
import Clickable from '../../mixins/clickable';
import WidthTracker from '../../mixins/width-tracker';
import { logger, hasLocalStorage, isIOS } from '../../../utils';

registerComponent('layer-audio-message-large-view', {
  mixins: [MessageViewMixin, Clickable, WidthTracker],

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
    layer-audio-message-large-view:not(.layer-is-ios) .layer-audio-controls.layer-disabled
    .layer-audio-volume-range-disabled {
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
     * Specifies whether the player should automatically play or not when this view is shown
     *
     * @property {Boolean} [autoplay=true]
     */
    autoplay: {
      value: true,
      type: Boolean,
    },

    /**
     * A javascript `Audio` object that is used to play the content without being in the DOM
     *
     * @property {Audio} audio
     */
    audio: {},

    /**
     * Get/Set whether the player is playing its content (setting this calls `play()` or `pause()`).
     *
     * You can toggle playback on/off with:
     *
     * ```
     * view.playing = !view.playing;
     * ```
     *
     * @property {Boolean} playing
     */
    playing: {
      noGetterFromSetter: true,
      set(value) {
        // Play the audio
        if (value) {
          const result = this.properties.audio.play();
          if (typeof Promise !== 'undefined' && result instanceof Promise) {
            result.catch(this.onError.bind(this));
          }
        }

        // Pause the audio
        else if (!this.properties.audio.paused) {
          this.properties.audio.pause();
        }

        // Update our css classes/state
        this.toggleClass('layer-audio-playing', value);
      },
      get() {
        return !this.properties.audio.paused;
      },
    },

    /**
     * Disable the Audio Message (i.e. its Audio Controls).
     *
     * Typically this is done because the content can not at this time be played.
     *
     * You can toggle disabled state with
     *
     * ```
     * view.disabled = !view.disabled;
     * ```
     *
     * @property {Boolean} disabled
     */
    disabled: {
      value: true,
      set(value) {
        this.nodes.controlPanel.classList[value ? 'add' : 'remove']('layer-disabled'); // if only IE 11 had a proper toggle method
        this.nodes.playButton.disabled = value;
        this.nodes.jumpForward.disabled = value;
        this.nodes.jumpBack.disabled = value;
        this.nodes.muteButton.disabled = value;
      },
    },

    /**
     * Retrieves the duration of the audio file, favoring the audio file itself but using the model value if thats no good.
     *
     * Measured in seconds; this is *not* an Integer.
     *
     * @property {Number} duration
     * @readonly
     */
    duration: {
      get() {
        return (this.properties.audio.duration !== Infinity && this.properties.audio.duration ?
          this.properties.audio.duration : this.model.duration) || 0;
      },
    },

    // Customize the WidthTracker Mixin
    widthMediumStart: {
      value: 380,
    },

    // Customize the WidthTracker Mixin
    widthLargeStart: {
      value: 480,
    },

    /**
     * Temporary state indicates that when starting a seek, we should start playback once the seek is completed.
     *
     * @property {Boolean} playAfterSeek
     */
    playAfterSeek: {},

    /**
     * Indicates if our player has reached the end, as defined by receipt of an "ended" event.
     *
     * @property {Boolean} isEnded
     */
    isEnded: {},

    /**
     * Indicates if this is the first time that playback has been requested.
     *
     * If the user rewinds to the start, it won't autoplay the way it does when the viewer first shows and autoplays.
     *
     * @property {Boolean} firstPlayed
     */
    firstPlayed: {},

    /**
     * The user is currently dragging the progress slider.
     *
     * @property {Boolean} dragging
     */
    dragging: {},
  },
  methods: {
    onCreate() {
      // Height isn't allocated; only really matters if this large message were to appear in a Message List (not yet supported)
      this.isHeightAllocated = false;
      if (isIOS) this.classList.add('layer-is-ios');

      // Setup our widgets/event handlers
      this._setupButtons();
      this._setupSliders();
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
      // Setup our Audio Player
      this._setupAudio();

      // Initialize duration from the model, and currentTime.
      this.nodes.duration.innerHTML = this._getTime(this.duration);
      this.nodes.currentTime.innerHTML = this._getTime(0);

      // Setup the player's preview/file icon
      if (this.model.preview || this.model.previewUrl) {
        this.model.getPreviewUrl(url => (this.nodes.preview.style.backgroundImage = 'url(' + url + ')'));
      } else {
        this.classList.add('show-audio-file-icon');
      }
      this._resizeContent();
    },

    /**
     * Wire up the click handlers for all of the buttons
     *
     * @method _setupButtons
     * @private
     */
    _setupButtons() {
      this.addClickHandler('play-button', this.nodes.playButton, this.onPlayClick.bind(this));
      this.addClickHandler('mute-button', this.nodes.muteButton, this.onMuteClick.bind(this));
      this.addClickHandler('jump-forward', this.nodes.jumpForward, this.onJumpForwardClick.bind(this));
      this.addClickHandler('jump-back', this.nodes.jumpBack, this.onJumpBackClick.bind(this));
    },

    /**
     * Wire up the event handlers for all of the sliders
     *
     * @method _setupSliders
     * @private
     */
    _setupSliders() {
      this.nodes.timeRange.addEventListener('change', this.onProgressSliderChange.bind(this));
      this.nodes.timeRange.addEventListener('mousedown', this.onProgressSliderStart.bind(this));
      this.nodes.timeRange.addEventListener('touchstart', this.onProgressSliderStart.bind(this));
      this.nodes.timeRange.addEventListener('mouseup', this.onProgressSliderStop.bind(this));
      this.nodes.timeRange.addEventListener('touchend', this.onProgressSliderStop.bind(this));
      this.nodes.volumeRange.addEventListener('input', this.onVolumeSliderChange.bind(this));
      this.nodes.volumeRange.addEventListener('change', this.onVolumeSliderChange.bind(this)); // IE 11!
    },

    /**
     * Create an Audio Player and wire up its events and source
     *
     * @method _setupAudio
     * @private
     */
    _setupAudio() {
      this.properties.audio = new Audio();
      this.properties.audio.preload = 'auto';
      this.properties.audio.loop = false;

      // If the model indicates we left off somewhere when previously playing this,
      // resume playback once the data is loaded.
      this.properties.audio.addEventListener('loadeddata', this.onLoadedData.bind(this));
      this.properties.audio.addEventListener('playing', this.onPlay.bind(this));
      this.properties.audio.addEventListener('pause', this.onPause.bind(this));
      this.properties.audio.addEventListener('playing', () => (this.playing = true));
      this.properties.audio.addEventListener('ended', this.onEnded.bind(this));
      this.properties.audio.addEventListener('timeupdate', this.updateProgress.bind(this));
      this.properties.audio.addEventListener('error', this.onError.bind(this));
      this.properties.audio.addEventListener('volumechange', this.onVolumeChange.bind(this));
      this.properties.audio.addEventListener('durationchange', this.onDurationChange.bind(this));
      this.properties.audio.addEventListener('seeking', this.onSeeking.bind(this));
      this.properties.audio.addEventListener('seeked', this.onSeekingDone.bind(this));
      this.properties.audio.addEventListener('canplay', this.onCanPlay.bind(this));

      // Initialize the volume setting to our last cached value
      if (hasLocalStorage && global.localStorage.getItem('LAYER-AUDIO-VOLUME')) {
        this.properties.audio.volume = global.localStorage.getItem('LAYER-AUDIO-VOLUME');
      }

      // Render the volume setting setup by the browser or our cached value above
      this.onVolumeChange();

      // Setup the player's source url
      this.model.getSourceUrl(url => (this.properties.audio.src = url));

      // Handle expiring urls
      this._handleExpiringUrls();
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

    /**
     * Shortcut for getting the player's current time in seconds (non-integer)
     *
     * @method getCurrentTime
     * @return {Number}
     */
    getCurrentTime() {
      return this.properties.audio.currentTime;
    },

    /**
     * Sets current time, and renders it with all UI Controls; optionally sets the Audio player to that position as well.
     *
     * Will resume playback once it is able if this was called with:
     *
     * * Playing already in progress
     * * this.properties.playAfterSeek set to true
     *
     * *Note*: This method will ignore attempts to set time to less than a second away from its current position.
     *
     * ```
     * view.setCurrentTime(50, true); // render us at 50 seconds and set the audio player to 50 seconds
     * view.setCurrentTime(50, false); // render us at 50 seconds but do not touch the audio player
     * ```
     *
     * One would not set the audio player's position if changes to its position is what caused `setCurrentTime` to be called.
     *
     * @method setCurrentTime
     * @param {Number} currentTime   A number (does not have to be an Integer) representing the number of seconds into the audio clip to skip to
     * @param {Boolean} [updateAudio=false]  If true, this sets not just our UI but sets the Audio Player's position
     */
    setCurrentTime(currentTime, updateAudio) {
      this.properties.isEnded = false;
      this.nodes.timeRange.value = currentTime * 100 / this.duration;
      this.nodes.currentTime.innerHTML = this._getTime(this.properties.audio.currentTime);

      const audio = this.properties.audio;
      if (updateAudio && Math.abs(currentTime - audio.currentTime) >= 1) {
        this.properties.playAfterSeek = this.properties.playAfterSeek || this.playing;
        audio.pause();
        this.toggleClass('layer-audio-seeking', true);
        audio.currentTime = currentTime;
      }
    },

    /**
     * User clicked the play/pause button; play or pause the playback.
     *
     * If Audio is at the end, reset it to the start and set playAfterSeek so it starts playing once it is reset
     *
     * @method onPlayClick
     */
    onPlayClick() {
      if (this.properties.isEnded && this.getCurrentTime() !== 0) {
        this.properties.playAfterSeek = true;
        this.setCurrentTime(0, true);
      } else {
        this.playing = !this.playing;
      }
    },

    /**
     * Playback has reached the end of the stream (ended event received).
     *
     * @method onEnded
     * @protected
     */
    onEnded() {
      this.playing = false;
      this.properties.isEnded = true;
    },

    /**
     * Any time playback starts (playing event received), insure that any other audio playing elsewhere has stopped.
     *
     * @method onPlay
     * @protected
     */
    onPlay() {
      this.updateProgress();
      this.properties.playing = true;

      const players = document.querySelectorAll('audio');
      for (let i = 0; i < players.length; i++) {
        if (players[i] !== this.properties.audio) players[i].pause();
      }
      const audioMessages = document.querySelectorAll('layer-audio-message-view layer-audio-message-large-view');
      for (let i = 0; i < audioMessages.length; i++) {
        if (audioMessages[i] !== this) audioMessages[i].playing = false;
      }
    },

    /**
     * Any time playback pauses (paused event received) either call onEnded, or update rendering associated with playing to `false`
     */
    onPause() {
      if (this.properties.audio.duration === this.properties.audio.currentTime) {
        this.onEnded();
      } else {
        this.playing = false;
      }
    },

    /*
     * Resize content on attaching this to the document, if needed; onAfterCreate already tried to do this.
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
      if (this.playing) {
        this.playing = false;
        this.model.currentTime = this.getCurrentTime();
      }

      // A way to clean up any resources the player is consuming
      this.properties.audio.src = '';
    },

    /**
     * Render all of the model's metadata
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
     * When the first frame of the media has finished loading, we can finish initializing and start playing.
     *
     * > *Note:*
     * >
     * > There is some ambiguity over when to use `dataloaded` event and when to use `durationchange` event,
     * > and some rethinking/refactoring around this is a good idea.
     *
     * @method onLoadedData
     * @protected
     */
    onLoadedData() {
      if (this.model.currentTime) {
        // Resume playback from cached position value
        this.setCurrentTime(this.model.currentTime, true);
      } else {
        // Simply insure that the timerange is set to 0 (currentTime will default to 0 and seeking won't happen so don't call setCurrentTime)
        this.nodes.timeRange.value = 0;
      }

      // Setup duration and insure that _setupFirstPlay is called
      this.onDurationChange();
    },

    /**
     * When enough metadata has loaded from the server for us to know the duration of the audio clip, this event triggers.
     *
     * Update our duration component, and call _setupFirstPlay.
     *
     * @method onDurationChange
     * @protected
     */
    onDurationChange() {
      this.nodes.duration.innerHTML = this._getTime(this.duration);
      this.setCurrentTime(this.properties.audio.currentTime, true);
      this._setupFirstPlay();
    },

    /**
     * Whenever playback gives us a progress event, update our progress bar.
     *
     * Note that if the user is currently dragging the progress bar, it should not be updated.
     *
     * @method updateProgress
     * @protected
     */
    updateProgress() {
      if (this.properties.dragging) return;
      this.setCurrentTime(this.properties.audio.currentTime, false);
    },

    /**
     * If this is the first time that this audio is being played by this viewer, do some setup.
     *
     * * Set playing to true (if autoplay is true)
     * * Set autoplay to false so that any future interactions won't automatically cause playback to resume
     *
     * @method _setupFirstPlay
     * @private
     */
    _setupFirstPlay() {
      if (!this.properties.firstPlayed) {
        this.properties.firstPlayed = true;
        this.playing = this.autoplay;
        this.autoplay = false;
      }
    },

    /**
     * On receiving a `canplay` event, enable the UI controls
     *
     * @method onCanPlay
     * @protected
     */
    onCanPlay() {
      this.disabled = false;
    },

    /**
     * When the user moves the progress slider, update the current playback time.
     *
     * @method onProgressSliderChange
     */
    onProgressSliderChange() {
      this.setCurrentTime(Number(this.nodes.timeRange.value) * this.duration / 100, true);
    },

    /**
     * Get a renderable version of duration or currentTime.
     *
     * Note that Safari will have a value of `Infinity` if the audio file was loaded from a server
     * that does not contain a proper "duration" header.
     *
     * @method _getTime
     * @private
     * @param {Number} time
     */
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

    /**
     * There are a few types of errors this handles:
     *
     * * Errors where the call to `play()` at some point calls this error handler (may be well after playback began); in this case, treat it as an `onEnded()` event
     * * Loading the audio file from the server failed; treat this as an invalid audio source and disable the audio player
     * *
     *
     * @method onError
     * @param {Error} err
     * @protected
     */
    onError(err) {
      if (this._internalState.onDetachCalled) return;

      // Do this before trying to refresh a sourceUrl because we may have connectivity issues and that might be the cause of the error
      this.classList.remove('layer-audio-playing');

      this.disabled = true;

      // If the source url has expired, then these would not be equal, and calling getSourceUrl will trigger our model change event we setup above
      this.model.getSourceUrl((url) => {
        if (url && url !== this.properties.audio.src) {
          this.classList.add('layer-audio-playing');
          this.disabled = false;
        }

        // An error can be thrown on an audio stream that was succesful and valid; if it was, then firstPlayed would be true and its probably just the stream ending.
        else if (this.properties.firstPlayed) {
          this.disabled = false;
          return this.onEnded();
        }

        // The audio file is probably invalid
        else {
          logger.error('LAYER-AUDIO-MESSAGE-VIEW: Play failed: ', err);
        }
      });
    },

    /**
     * When the player emits a volume change event, update our volume controls
     *
     * @method onVolumeChange
     * @protected
     */
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

    /**
     * When the user clicks on the Mute/Unmute button update our volume settings and controls.
     *
     * @method onMuteClick
     * @protected
     */
    onMuteClick() {
      if (this.audio.volume) {
        this.properties.lastVolume = this.audio.volume;
        this.audio.volume = 0;
      } else {
        this.audio.volume = this.properties.lastVolume || 1;
      }
      this.onVolumeChange();
    },

    /**
     * When the user moves the volume slider, update our volume and volume settings.
     *
     * Note: Changing volume will trigger a `volumechange` event from the audio player, this will
     * cause {@link #onVolumeChange} to be called and will update the mute button state.
     *
     * @method onVolumeSliderChange
     * @protected
     */
    onVolumeSliderChange() {
      this.audio.volume = this.nodes.volumeRange.value / 100;

      // Don't save a mute setting; must have at least some volume
      if (hasLocalStorage && this.audio.volume) global.localStorage.setItem('LAYER-AUDIO-VOLUME', this.audio.volume);
    },

    /**
     * The user has clicked the jump forward button to move forwards by 20 seconds.
     *
     * * Sets playAfterSeek so that playback will resume after the next `seeked` event is received
     *
     * @method onJumpForwardClick
     */
    onJumpForwardClick() {
      const nextInc = this.audio.currentTime + 20;
      const nextValue = Math.min(this.duration, nextInc);
      this.properties.playAfterSeek = true;
      this.setCurrentTime(nextValue, true);
    },

    /**
     * The user has clicked the jump backwards button to move back by 20 seconds.
     *
     * * Sets playAfterSeek so that playback will resume after the next `seeked` event is received
     *
     * @method onJumpBackClick
     */
    onJumpBackClick() {
      if (this.getCurrentTime() > 0) {
        this.properties.playAfterSeek = true; // playback may be halted if we are at the end; clicking jump back should resume playback
        this.setCurrentTime(Math.max(0, this.getCurrentTime() - 20), true);
      }
    },

    /**
     * If a touch/mouse event starts, flag the progress slider as "dragging" so that we don't programatically manipulate it until dragging is done.
     *
     * @method onProgressSliderStart
     */
    onProgressSliderStart() {
      this.properties.dragging = true;
    },

    /**
     * When a touch/mouse event ends, clear the `dragging` flag.
     *
     * @method onProgressSliderStop
     */
    onProgressSliderStop() {
      this.properties.dragging = false;
    },

    /**
     * If audio player is `seeking`, disable playback buttons and update CSS classes to render that we are seeking.
     *
     * @method onSeeking
     * @protected
     */
    onSeeking() {
      this.nodes.playButton.disabled = true;
      this.classList.add('layer-audio-seeking');
    },

    /**
     * When the audio player finishes seeking, enable playback buttons and remove any seeking styling... and then optionally resume playback.
     *
     * @method onSeekingDone
     * @protected
     */
    onSeekingDone() {
      this.nodes.playButton.disabled = false;
      this.classList.remove('layer-audio-seeking');
      if (this.properties.playAfterSeek) {
        this.properties.playing = false; // force the setter to fire when we set play to true (hacky)
        this.playing = true;
        this.properties.playAfterSeek = false;
      }
    },

    /**
     * URLs should be regenerated every hour so that expiring urls are replaced with valid urls.
     *
     * Such an event triggers a change event, and the audio player will need the new url, and will need its time
     * set to match our current time and to resume playback.
     *
     * @method _handleExpiringUrls
     */
    _handleExpiringUrls() {
      this.model.on('message-type-model:change', () => {
        if (this.model.streamUrl && this.model.streamUrl !== this.properties.audio.src) {
          this.properties.playAfterSeek = this.playing;
          this.model.currentTime = this.getCurrentTime();
          this.properties.audio.src = this.model.streamUrl;
          this.properties.firstPlayed = false;
          this.autoplay = true;
        }
      });
    },
  },
});
