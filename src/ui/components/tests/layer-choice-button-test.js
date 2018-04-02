/* eslint-disable */
describe('layer-choice-button', function() {
  var el, testRoot, client;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      isMine: true
    });

    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-choice-button');
    testRoot.appendChild(el);

    var ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
    var model = new ChoiceModel({
       label: "What is the airspeed velocity of an unladen swallow?",
       choices: [
         {text:  "Zero, it can not get off the ground!", id: "zero"},
         {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
         {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
      ],
    });
    el.model = model;

    Layer.Utils.defer.flush();
  });

  afterEach(function() {
    if (el) {
      el.destroy();
      el = null;
    }
    if (client) {
      client.destroy();
      client = null;
    }

    document.body.removeChild(testRoot);
  });

  it("Should generate buttons from the model", function() {
    expect(el.childNodes.length).toEqual(3);

    expect(el.childNodes[1].event).toBe(null);
    expect(el.childNodes[1].data).toEqual({id: "clever bastard"});
    expect(el.childNodes[1].text).toEqual("Are we using Imperial or Metric units?");
  });
});
