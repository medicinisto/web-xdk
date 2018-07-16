/**
 * Adds a Telemetry Monitor to the Layer Client
 *
 * @class Layer.Core.Client
 * @typescript extendclass
 */

import TelemetryMonitor from '../telemetry-monitor';
import Core from '../namespace';

const ClientTelemetry = {
  events: [
    /**
     * State change events are used for internal communications.
     *
     * Primarily used so that the Telemetry component can monitor and report on
     * system activity.
     *
     * @event state-change
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
     * @property {Boolean} [telemetryEnabled=true]
     */
    telemetryEnabled: true,

    /**
     * Gather usage and responsiveness statistics
     *
     * @property {Layer.Core.TelemetryMonitor} telemetryMonitor
     * @private
     */
    telemetryMonitor: null,
  },
};
export default ClientTelemetry;
Core.mixins.Client.push(ClientTelemetry);
