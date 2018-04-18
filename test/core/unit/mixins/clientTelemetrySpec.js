/*eslint-disable */
// TODO: All tests should be run with both isTrustedDevice = true and false
describe("The Client Telemetry Mixin", function() {
    var appId = "Fred's App";
    var userId = "93c83ec4-b508-4a60-8550-099f9c42ec1a";

    var client, requests, userIdentity2;

    beforeEach(function() {

    });

    afterEach(function() {
        client.destroy();
    });

    it("Should instantiate an enabled telemetry Monitor", function() {
        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com",
            telemetryEnabled: true,
        }).on("challenge", function() {});
        expect(client.telemetryMonitor).toEqual(jasmine.any(Layer.Core.TelemetryMonitor));
        expect(client.telemetryMonitor.enabled).toBe(true);
    });

    it("Should instantiate a disabled telemetry Monitor", function() {
        client = new Layer.Core.Client({
            appId: appId,
            url: "https://huh.com",
            telemetryEnabled: false,
        }).on("challenge", function() {});
        expect(client.telemetryMonitor).toEqual(jasmine.any(Layer.Core.TelemetryMonitor));
        expect(client.telemetryMonitor.enabled).toBe(false);
    });
});
