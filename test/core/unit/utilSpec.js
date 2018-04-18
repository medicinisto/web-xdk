/* eslint-disable */
describe("The Util Library", function() {
    describe("The generateUUID() function", function() {
        it("Should generate a properly structured UUID", function() {
            expect(Layer.Utils.generateUUID()).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });

        it("Should generate a unique UUID", function() {
            var hash = {};
            for (var i = 0; i < 100; i++) {
                var id = Layer.Utils.generateUUID();
                expect(hash[id]).toBe(undefined);
                hash[id] = true;
            }
        });
    });

    describe("The typeFromID() function", function() {
        it("Should detect conversations", function() {
            expect(Layer.Utils.typeFromID("layer:///conversations/fred")).toEqual("conversations");
        });

        it("Should detect messages", function() {
            expect(Layer.Utils.typeFromID("layer:///messages/fred")).toEqual("messages");
        });

        it("Should detect queries", function() {
            expect(Layer.Utils.typeFromID("layer:///queries/fred")).toEqual("queries");
        });

        it("Should detect content", function() {
            expect(Layer.Utils.typeFromID("layer:///content/fred")).toEqual("content");
        });
    });

    describe("The isEmpty() function", function() {
        it("Should return true for an empty object", function() {
            expect(Layer.Utils.isEmpty({})).toBe(true);
        });

        it("Should return false for a non-empty object", function() {
            expect(Layer.Utils.isEmpty({hey: "ho"})).toBe(false);
        });

        it("Should return false for a non-plain object", function() {
            expect(Layer.Utils.isEmpty(new Date())).toBe(false);
        });
    });

    describe("The sortBy() function", function() {
        it("Should sort by a", function() {
            var a1 = [{a: 5}, {a: 10}, {a: 3}];
            Layer.Utils.sortBy(a1, function(v) {return v.a;});
            expect(a1).toEqual([{a: 3}, {a: 5}, {a: 10}]);
        });

        it("Should sort by negative a", function() {
            var a1 = [{a: 5}, {a: 10}, {a: 3}];
            Layer.Utils.sortBy(a1, function(v) {return -v.a;})
            expect(a1).toEqual([{a: 10}, {a: 5}, {a: 3}]);
        });

        it("Should not matter for equivalent values", function() {
            var a1 = [{a: 5}, {a: 5}, {a: 3}];
            Layer.Utils.sortBy(a1, function(v) {return v.a;});
            expect(a1).toEqual([{a: 3}, {a: 5}, {a: 5}]);
        });

        it("Should put undefined at the end.", function() {
            var a1 = [{a: 5}, {b: 4}, {a: 3}, {c: 10}];
            Layer.Utils.sortBy(a1, function(v) {return v.a;});
            expect(a1.slice(0,2)).toEqual([{a: 3}, {a: 5}]);
            expect(a1.slice(2,4)).toEqual(jasmine.arrayContaining([{b: 4}, {c: 10}]));

            var a1 = [{a: 5}, {b: 4}, {a: 3}, {c: 10}];
            Layer.Utils.sortBy(a1.reverse(), function(v) {return v.a;});
            expect(a1.slice(0,2)).toEqual([{a: 3}, {a: 5}]);
            expect(a1.slice(2,4)).toEqual(jasmine.arrayContaining([{b: 4}, {c: 10}]));
        });
    });

    describe("The clone() function", function() {
        it("Should return a new object", function() {
            var a = {hey: "ho"};
            expect(Layer.Utils.clone(a)).not.toBe(a);
            expect(Layer.Utils.clone(a)).toEqual(a);
        });
    });

    describe("The doesObjectMatch() method", function() {
        it("Should match identical objects", function() {
            expect(Layer.Utils.doesObjectMatch(
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all"}
                    },
                    doh: "ray"
                },
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all"}
                    },
                    doh: "ray"
                }
            )).toBe(true);
        });

        it("Should detect additional properties", function() {
            expect(Layer.Utils.doesObjectMatch(
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all"}
                    },
                    doh: "ray"
                },
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", g: "people"}
                    },
                    doh: "ray"
                }
            )).toBe(false);
        });

        it("Should detect removed properties", function() {
            expect(Layer.Utils.doesObjectMatch(
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", g: "people"}
                    },
                    doh: "ray"
                },
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all"}
                    },
                    doh: "ray"
                }
            )).toBe(false);
        });

        it("Should detect changed properties", function() {
            expect(Layer.Utils.doesObjectMatch(
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", g: "people"}
                    },
                    doh: "ray"
                },
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", g: "people2"}
                    },
                    doh: "ray"
                }
            )).toBe(false);
        });

        it("Should detect changed keys", function() {
            expect(Layer.Utils.doesObjectMatch(
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", g: "people"}
                    },
                    doh: "ray"
                },
                {
                    a: "hi",
                    b: {
                        c: "there",
                        d: "5",
                        e: {f: "all", h: "people"}
                    },
                    doh: "ray"
                }
            )).toBe(false);
        });

        it("Should inform caller that array comparisons aren't supported yet", function() {
            expect(function() {
                Layer.Utils.doesObjectMatch(
                    {
                        a: "hi",
                        b: [1],
                        doh: "ray"
                    },
                    {
                        a: "hi",
                        b: [1],
                        doh: "ray"
                    }
                );
            }).toThrowError('Array comparison not handled yet');
        });
    });


    describe("The defer() method", function() {
        it("Should call methods in the right order", function(done) {
            var result = [];
            Layer.Utils.defer(function() {
                result.push("a");
            });
            Layer.Utils.defer(function() {
                result.push("b");
            });
            Layer.Utils.defer(function() {
                result.push("c");
            });
            Layer.Utils.defer(function() {
                result.push("d");
            });
            result.push("before");
            Layer.Utils.defer(function() {
                expect(result).toEqual(["before", "a", "b", "c", "d"]);
                setTimeout(function() {
                    done();
                }, 0);
            });
        });

        it("Should run functions queued within defer after all other queued calls", function(done) {
            var result = [];

            Layer.Utils.defer(function() {
                result.push(1);
                Layer.Utils.defer(function() {
                    result.push(11);
                });
            });

            Layer.Utils.defer(function() {
                result.push(2);
                Layer.Utils.defer(function() {
                    result.push(22);
                });
            });

            setTimeout(function() {
                expect(result).toEqual([1, 2, 11, 22]);
                done();
            }, 10);
        });
    });

     describe("The getExponentialBackoffSeconds() method", function() {
        it("Should return a value between 0.1 and 0.35", function() {
            for (var i = 0; i < 100; i++) {
                var result = Layer.Utils.getExponentialBackoffSeconds(10000, 0);
                expect(result >= 0.1 && result <= 0.35).toBe(true);
            }
        });

        it("Should return a value between 0.2 and 0.45", function() {
            for (var i = 0; i < 100; i++) {
                var result = Layer.Utils.getExponentialBackoffSeconds(10000, 1);
                expect(result >= 0.2 && result <= 0.45).toBe(true);
            }
        });

        it("Should return a value between 0.4 and 0.9", function() {
            for (var i = 0; i < 100; i++) {
                var result = Layer.Utils.getExponentialBackoffSeconds(10000, 2);
                expect(result >= 0.4 && result <= 0.95).toBe(true);
            }
        });

        it("Should return a value between 0.8 and 1.3", function() {
            for (var i = 0; i < 100; i++) {
                var result = Layer.Utils.getExponentialBackoffSeconds(1000, 3);
                expect(result >= 0.8 && result <= 1.3).toBe(true);
            }
        });

        it("Should apply max to the non-random part of the result", function() {
            for (var i = 0; i < 100; i++) {
                var result = Layer.Utils.getExponentialBackoffSeconds(10, 50);
                expect(result >= 10 && result <= 11).toBe(true);
            }
        });
    });

    describe("The fetchTextFromFile() method", function() {
        var  blob, text;
        beforeEach(function() {
            text = new Array(Layer.Core.DbManager.MaxPartSize + 10).join('a');
            blob = new Blob([text], {type : 'text/plain'});
        });

        it("Should return file if file is really a string", function() {
            var result;
            Layer.Utils.fetchTextFromFile(text, function(data) { result = data;});
            expect(result).toEqual(text);
        });

        it("Should turn text blob to string", function(done) {
            var result;
            Layer.Utils.fetchTextFromFile(text, function(data) {
                expect(data).toEqual(text);
                done();
            });
        });

    });

    describe("The layerParse() method", function() {
        var client, conversation, config, message;
        beforeEach(function() {
            client = new Layer.Core.Client({appId: "fred"});

            client.user = new Layer.Core.Identity({
                userId: "c",
                id: "layer:///identities/c",
                firstName: "first",
                lastName: "last",
                phoneNumber: "phone",
                emailAddress: "email",
                metadata: {},
                publicKey: "public",
                avatarUrl: "avatar",
                displayName: "display",
                syncState: Layer.Constants.SYNC_STATE.SYNCED,
                isFullIdentity: true,
                isMine: true
            });


            client._clientAuthenticated();
            getObjectsResult = [];

            spyOn(client.dbManager, "_loadSyncEventRelatedData").and.callFake(function(syncEvents, callback) {callback([]);});
            spyOn(client.dbManager, "getObjects").and.callFake(function(tableName, ids, callback) {
                setTimeout(function() {
                    callback(getObjectsResult);
                }, 10);
            });
            client._clientReady();
            client.onlineManager.isOnline = true;

            conversation = client.createConversation({
                participants: ["a", "b"],
                metadata: {
                    eat: "food",
                    drink: "coffee"
                }
            }).send();
            message = conversation.createMessage("hi").send();
            config = {
                object: conversation,
                type: 'Conversation',
                operations: [
                    {operation: "set", property: "unread_message_count", value: 5},
                    {operation: "add", property: "participants", id: "layer:///identities/c", value: {id: "layer:///identities/c", url: "https:///heyho.com/identities/c", user_id: "c", display_name: "User C", avatar_url: null}},
                    {operation: "remove", property: "participants", id: "layer:///identities/a"},
                    {operation: "delete", property: "metadata.eat"},
                    {operation: "set", property: "lastMessage", id: message.id}
                ]
            };
        });

        afterEach(function() {
            client.destroy();
        });

        it("Should set the unread_message_count", function() {
            Layer.Utils.layerParse(config);
            expect(conversation.unreadCount).toEqual(5);
        });

        it("Should add a participant", function() {
            Layer.Utils.layerParse(config);
            var identityC = client.getIdentity("c");
            expect(conversation.participants.indexOf(identityC)).not.toEqual(-1);
        });

        it("Should remove a participant", function() {
            Layer.Utils.layerParse(config);
            var identityA = client.getIdentity("a");
            expect(conversation.participants.indexOf(identityA)).toEqual(-1);
        });

        it("Should delete a metadata property", function() {
            Layer.Utils.layerParse(config);
            expect(conversation.metadata).toEqual({
                drink: "coffee"
            });
        });

        it("Should set the lastMessage property by id", function() {
            conversation.lastMessage = null;
            Layer.Utils.layerParse(config);
            expect(conversation.lastMessage).toBe(message);
        });

        it("Should update recipientStatus", function() {
            message.recipientStatus = {
                "layer:///identities/a": "sent",
                "layer:///identities/b": "sent",
                "layer:///identities/c": "read"
            };
            Layer.Utils.layerParse({
                object: message,
                type: 'Message',
                operations: [
                    {operation: "set", property: "recipient_status.layer:///identities/a", value: "read"},
                    {operation: "set", property: "recipient_status.layer:///identities/b", value: "delivered"}
                ]
            });

            // Posttest
            expect(message.recipientStatus).toEqual({
                "layer:///identities/a": "read",
                "layer:///identities/b": "delivered",
                "layer:///identities/c": "read"
            });
        });

        it("Should call __updateRecipientStatus", function() {
            message.recipientStatus = {
                "layer:///identities/a": "sent",
                "layer:///identities/b": "sent",
                "layer:///identities/c": "read"
            };
            spyOn(message, "__updateRecipientStatus");
            Layer.Utils.layerParse({
                object: message,
                type: 'Message',
                operations: [
                    {operation: "set", property: "recipient_status.layer:///identities/a", value: "read"},
                    {operation: "set", property: "recipient_status.layer:///identities/b", value: "delivered"}
                ]
            });

            // Posttest
            expect(message.__updateRecipientStatus).toHaveBeenCalledWith({
                "layer:///identities/a": "read",
                "layer:///identities/b": "delivered",
                "layer:///identities/c": "read"
            }, {
                "layer:///identities/a": "sent",
                "layer:///identities/b": "sent",
                "layer:///identities/c": "read"
            });
        });

        it("Should updated identity presence", function() {
            expect(client.user._presence.status).not.toEqual("crazed and dazed");
            Layer.Utils.layerParse({
                object: client.user,
                type: "Identity",
                operations: [
                    {operation: "set", property: "presence.status", value: "crazed and dazed"}
                ]
            });

            // Posttest
            expect(client.user.status).toEqual("crazed and dazed");
        });
    });

    describe("The base64ToBlob() method", function() {
        it("Should return a blob", function() {
            var imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAECElEQVR4Xu2ZO44TURREa0SAWBASKST8xCdDQMAq+OyAzw4ISfmLDBASISERi2ADEICEWrKlkYWny6+77fuqalJfz0zVOXNfv/ER8mXdwJF1+oRHBDCXIAJEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8wbM42cDRADzBszjZwNEAPMGzONnA0QA8waWjX8OwHcAv5f9Me3fPRugvbuxd14C8B7AVwA3q0oQAcYwtr2+hn969faPVSWIAG2AT3rXJvz17CcAN6ptgggwrwDb4JeVIALMJ8AY/JISRIB5BGDhr3/aZwDXKxwHEWC6AJcBvAOwfuBjvuNfABcBfGGGl5yJANPabYV/B8DLaT96nndHgPYeu4c/RI8AbQJIwO9FgDMAfrVxWuRdMvB7EOA+gHsALgD4uQjO3b6pFPzqAjwA8HTF5weA8weWQA5+ZQGOw1//jR5SAkn4VQV4CODJls18CAmuAHjbcM8vc9U76ZSrdgt4BODxyLG8Twla4P8BcLfKPX/sEaeSAAz8fR4H8vArHQHXAHwYs3Xj9SU3gQX8SgKcAvBitTp38WAJCWzgVxJg+F0qSGAFv5oAh5bADn5FAQ4lwVUAb3a86nX1tL/tXK10Czj+O+7zOLCFX3UDrEXYhwTW8KsLsPRx0Ap/+A/fq12uKpVnqx4BSx8Hgb9quAcB5t4EgX/sz6sXAeaSIPA3zqOeBJgqwTMAzxuuelJn/ubzSG8CTJFg12ex4Z4vDb+HW8A2aK1XRFYCC/g9C7DkJrCB37sAS0hgBV9BgDklGODfBvCaPScU5np8CPxf71OfCSzhq2yAqZ8d2MJXE6DlOLCGryjALhLYw1cVgJEg8Dv7MKjlgXvbg2Hgd/ph0BwSBH7nHwZNkeCW4z1/rDCV/wOM5RyOg7MAvo0Nur3uIoAbVzpvBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hyMAJpc6VQRgK5KczACaHKlU0UAuirNwQigyZVOFQHoqjQHI4AmVzpVBKCr0hz8BzIXtYE3VcPnAAAAAElFTkSuQmCC";
            expect(Layer.Utils.base64ToBlob(imgBase64)).toEqual(jasmine.any(Blob));
        });

        it("Should return null", function() {
            expect(Layer.Utils.base64ToBlob()).toBe(null);
        });
    });

    describe("The decode() method", function() {
        // Don't really understand this method's details well, but verify it returns null if invalid
        it("Should throw error if it fails to process the input", function() {
            expect(function() {
                Layer.Utils.decode('•');
            }).toThrowError("Illegal base64url string!");
        });

        it("Should return string if it processes the input", function() {
            expect(Layer.Utils.decode(btoa("hello"))).toEqual("hello");
        });
    });


    describe("The atou() method", function() {
        it("Should mutate the input string", function() {
            expect(Layer.Utils.atou('SSDimaEgVW5pY29kZSE=')).toEqual("I ♡ Unicode!");
        });

        it("Should restore original string value", function() {
            expect(Layer.Utils.utoa(Layer.Utils.atou("SSDimaEgVW5pY29kZSE="))).toEqual("SSDimaEgVW5pY29kZSE=");
        });
    });

    describe("The includes() method", function() {
      it("Should detect inclusion", function() {
        expect(Layer.Utils.includes([1,3,5], 3)).toBe(true);
      });

      it("Should detect absence", function() {
        expect(Layer.Utils.includes([1,3,5], 4)).toBe(false);
      });
    });

    describe("The asciiInit() method", function() {
      it("Should abort if no version", function() {
          expect(Layer.Utils.asciiInit()).toEqual("Missing version");
      });

      it("Should return ASCII Layer logo with version 1.0.0", function() {
        expect(Layer.Utils.asciiInit('1.0.0')).toEqual(
        '\n    /hNMMMMMMMMMMMMMMMMMMMms.' +
        '\n  hMMy+/////////////////omMN-' +
        '\n  MMN                    oMMo' +
        '\n  MMN        Layer       oMMo' +
        '\n  MMN       Web XDK      oMMo' +
        '\n  MMM-                   oMMo' +
        '\n  MMMy      v1.0.0       oMMo' +
        '\n  MMMMo                  oMMo' +
        '\n  MMMMMy.                oMMo' +
        '\n  MMMMMMNy:\'             oMMo' +
        '\n  NMMMMMMMMmy+:-.\'      \'yMM/' +
        '\n  :dMMMMMMMMMMMMNNNNNNNNNMNs' +
        '\n   -/+++++++++++++++++++:\'');
      });

      it("Should return ASCII Layer logo with version 2.10.37", function() {
        expect(Layer.Utils.asciiInit('2.10.37')).toEqual(
          '\n    /hNMMMMMMMMMMMMMMMMMMMms.' +
        '\n  hMMy+/////////////////omMN-' +
        '\n  MMN                    oMMo' +
        '\n  MMN        Layer       oMMo' +
        '\n  MMN       Web XDK      oMMo' +
        '\n  MMM-                   oMMo' +
        '\n  MMMy      v2.10.37     oMMo' +
        '\n  MMMMo                  oMMo' +
        '\n  MMMMMy.                oMMo' +
        '\n  MMMMMMNy:\'             oMMo' +
        '\n  NMMMMMMMMmy+:-.\'      \'yMM/' +
        '\n  :dMMMMMMMMMMMMNNNNNNNNNMNs' +
        '\n   -/+++++++++++++++++++:\'');
      });

      it("Should return ASCII Layer logo with version 2.0.0-beta.3", function() {
        expect(Layer.Utils.asciiInit('2.0.0-beta.3')).toEqual(
          '\n    /hNMMMMMMMMMMMMMMMMMMMms.' +
        '\n  hMMy+/////////////////omMN-' +
        '\n  MMN                    oMMo' +
        '\n  MMN        Layer       oMMo' +
        '\n  MMN       Web XDK      oMMo' +
        '\n  MMM-                   oMMo' +
        '\n  MMMy      v2.0.0       oMMo' +
        '\n  MMMMo     beta.3       oMMo' +
        '\n  MMMMMy.                oMMo' +
        '\n  MMMMMMNy:\'             oMMo' +
        '\n  NMMMMMMMMmy+:-.\'      \'yMM/' +
        '\n  :dMMMMMMMMMMMMNNNNNNNNNMNs' +
        '\n   -/+++++++++++++++++++:\'');
      });
    });
});
