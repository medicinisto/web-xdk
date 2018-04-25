/**
 * Adds a Telemetry Monitor to the Layer Client
 *
 * @class Layer.Core.mixins.ClientTelemetry
 */

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
};

Core.mixins.Client.push(module.exports);
