/**
 * Adds handling of custom websocket operations.
 *
 * This is handled by a Client mixin rather than:
 *
 * * The Client itself so we can keep the client simple and clean
 * * The Websocket Change Manager so that the change manager does not need to know
 *   how to handle any operation on any data.  Its primarily aimed at insuring websocket
 *   events get processed, not knowing minute details of the objects.
 *
 * @class Layer.Core.mixins.ClientTelemetry
 */

import Util from '../../utils';
import TelemetryMonitor from '../telemetry-monitor';
import Core from '../namespace';

module.exports = {
  events: [
    /**
     * State change events are used for internal communications.
     *
     * Primarily used so that the Telemetry component can monitor and report on
     * system activity.
     *
     * @event
     * @private
     */
    'state-change',
  ],
  lifecycle: {

    // Listen for any websocket operations and call our handler
    constructor(options) {
      this.telemetryMonitor = new TelemetryMonitor({
        enabled: this.telemetryEnabled,
      });
    },
    destroy() {
      this.telemetryMonitor.destroy();
    },
  },
  properties: {
    /**
     * Set to false to disable telemetry gathering.
     *
     * No content nor identifiable information is gathered, only
     * usage and performance metrics.
     *
     * @property {Boolean}
     */
    telemetryEnabled: true,

    /**
     * Gather usage and responsiveness statistics
     *
     * @property {Layer.Core.TelemetryMonitor}
     * @private
     */
    telemetryMonitor: null,
  },
  methods: {

  },
};

Core.mixins.Client.push(module.exports);
