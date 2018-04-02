/* eslint-disable */
describe('layer-message-status', function() {
  var el, testRoot, client, conversation, message;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    client = new Layer.init({
      appId: 'Fred'
    }).on('challenge', function() {});
    client.user = new Layer.Core.Identity({
      userId: 'FrodoTheDodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-message-status');
    testRoot.appendChild(el);
    el.enabled = true;

    conversation = client.createConversation({
      participants: ['layer:///identities/a']
    });
    message = conversation.createMessage('Hey ho');
    Layer.Utils.defer.flush();
  });
  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
    document.body.removeChild(testRoot);
  });

  it('Should call rerender on any message change events', function() {
    spyOn(el, "onRerender");
    el.item = message;
    el.onRerender.calls.reset();

    message.trigger('messages:change', {});
    expect(el.onRerender).toHaveBeenCalledWith(jasmine.any(Layer.Core.LayerEvent));
  });

  it('Should not call rerender on any message change events once its no longer the right message', function() {
    spyOn(el, "onRerender");
    el.item = message;
    el.item = null;
    el.onRerender.calls.reset();

    message.trigger('messages:change', {});
    expect(el.onRerender).not.toHaveBeenCalled();
  });

  it('Should show presend', function() {
    message.syncState = Layer.Constants.SYNC_STATE.NEW;
    el.presendTemplate = "PRESEND";
    el.item = message;
    expect(el.innerHTML).toEqual('PRESEND');
  });

  it('Should show pending', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SAVING;
    el.pendingTemplate = 'PENDING';
    el.item = message;
    expect(el.innerHTML).toEqual('PENDING');
  });

  it('Should show sent', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
    message.deliveryStatus = Layer.Constants.RECIPIENT_STATE.NONE;
    el.sentTemplate = 'SENT';
    el.item = message;
    expect(el.innerHTML).toEqual('SENT');
  });

  it('Should show delivered', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
    message.deliveryStatus = Layer.Constants.RECIPIENT_STATE.SOME;
    message.readStatus = Layer.Constants.RECIPIENT_STATE.NONE;
    el.deliveredDMTemplate = 'DELIVERED DM';
    el.item = message;
    expect(el.innerHTML).toEqual('DELIVERED DM');
  });

  it('Should show delivered to some', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
    conversation.participants.push(new Layer.Core.Identity({
      userId: 'b',
      id: 'layer:///identities/b'
    }));
    message.recipientStatus['a'] = 'delivered';
    message.recipientStatus['b'] = 'delivered';
    message.deliveryStatus = Layer.Constants.RECIPIENT_STATE.SOME;
    message.readStatus = Layer.Constants.RECIPIENT_STATE.NONE;
    el.deliveredGroupTemplate = "${count} delivery personel";
    el.item = message;
    expect(el.innerHTML).toEqual('2 delivery personel');
  });

  it('Should show read by some', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
    conversation.participants.push(new Layer.Core.Identity({
      userId: 'b',
      id: 'layer:///identities/b'
    }));
    message.recipientStatus['a'] = 'read';
    message.recipientStatus['b'] = 'read';
    message.deliveryStatus = Layer.Constants.RECIPIENT_STATE.SOME;
    message.readStatus = Layer.Constants.RECIPIENT_STATE.SOME;
    el.readGroupTemplate = "${count} readers";
    el.item = message;
    expect(el.innerHTML).toEqual('2 readers');
  });

  it('Should show read', function() {
    message.syncState = Layer.Constants.SYNC_STATE.SYNCED;
    message.deliveryStatus = Layer.Constants.RECIPIENT_STATE.SOME;
    message.readStatus = Layer.Constants.RECIPIENT_STATE.ALL;
    el.readDMTemplate = "READER";
    el.item = message;
    expect(el.innerHTML).toEqual('READER');
  });

  it("Should use messageStatusRenderer if provided", function() {
    var f = function() {return "who cares?"};
    el.messageStatusRenderer = f;
    el.item = message;
    expect(el.innerHTML).toEqual("who cares?");
  });
});