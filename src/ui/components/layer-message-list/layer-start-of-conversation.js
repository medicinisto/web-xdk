/**
 * The Start of Conversation which renders some customizable welcome message based on the Conversation
 *
 * TODO: Document this
 *
 * ### Importing
 *
 * Included with the standard build. If creating a custom build, import:
 *
 * ```
 * import '@layerhq/web-xdk/ui/components/layer-message-list/layer-start-of-conversation';
 * ```
 *
 * @class Layer.UI.components.MessageListPanel.StartOfConversation
 * @extends Layer.UI.Component
 */
import { registerComponent } from '../component';

/* eslint-disable max-len */
registerComponent('layer-start-of-conversation', {
  template: `
    Conversation began
    <layer-date layer-id='startDate'
      default-format='{"month": "long", "year": "numeric", "day": "numeric", "hour": "numeric", "minute": "numeric" }'
      today-format='{"hour": "numeric", "minute": "numeric"}' week-format='{"weekday": "long", "hour": "numeric", "minute": "numeric"}'>
    </layer-date>
  `,
  /* eslint-enable max-len */
  style: `
    layer-start-of-conversation {
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      visibility: hidden;
    }
    layer-start-of-conversation.layer-has-conversation {
      visibility: visible;
    }
    layer-start-of-conversation layer-date {
      display: inline;
    }
  `,
  properties: {

    /**
     * Conversation that we are at the start of.
     *
     * @property {Layer.Core.Conversation} conversation
     */
    conversation: {
      set(value) {
        this.toggleClass('layer-has-conversation', value);
        if (this.nodes.startDate) {
          if (value && value.isLoading) {
            value.once(`${value.constructor.eventPrefix}:loaded`, this._onConversationChange, this);
          }
          this.nodes.startDate.date = value ? value.createdAt : null;
        }
      },
    },


    /**
     * Date formatter configuration for the End of Conversation widget.
     *
     * Use this to configure how dates are rendered.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString for details
     * on the parameters that are supported by `toLocaleString`.
     *
     * There are four supported inputs
     *
     * * `today`: How to render dates that are today
     * * `week`: How to render dates that are not today, but within a 6 of today (note if today is
     *   wednesday, 1 week ago is also wednesday, and rendering `wednesday` would be confusing, so its 6 rather than 7 days.
     * * `default`: The default format to use
     * * `older`: The format to use for dates that are in a different year and more than 6 months in the past
     *
     * Example:
     *
     * ```
     * widget.dateFormat = {
     *    today: {"hour": "numeric", "minute": "numeric"},
     *    week: {"weekday": "short"},
     *    default: {"month": "short", "day": "2-digit"},
     *    older: {"month": "short", "year": "numeric"}
     * }
     * ```
     *
     * @property {Object} [dateFormat=]
     * @property {Object} [dateFormat.today={hour: 'numeric', minute: 'numeric'}]
     * @property {Object} [dateFormat.week={ weekday: 'short', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.older={ month: 'short', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     * @property {Object} [dateFormat.default={ month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }]
     */
    dateFormat: {
      set(value) {
        if (this.nodes.startDate) {
          Object.keys(value).forEach((name) => {
            this.nodes.startDate[name] = value[name];
          });
        }
      },
    },
  },
  methods: {
    _onConversationChange(evt) {
      this.nodes.startDate.date = this.conversation.createdAt;
    },
  },
});

