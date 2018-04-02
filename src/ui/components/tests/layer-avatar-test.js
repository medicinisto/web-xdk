/* eslint-disable */
describe('layer-avatar', function() {
  var el, testRoot, client;

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
      isFullIdentity: true,
      isMine: true
    });
    client._clientAuthenticated();

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-avatar');
    testRoot.appendChild(el);
    el.enabled = true;
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

    if (testRoot && testRoot.parentNode == document.body) document.body.removeChild(testRoot);
  });

  it('Should start without a layer-has-user class', function() {
    expect(el.classList.contains('layer-has-user')).toEqual(false);
  });

  it('Should start with users as empty array', function() {
    expect(el.users).toEqual([]);
  });

  it('Should have a layer-has-user class if one user', function() {
    el.users = [client.user];
    expect(el.classList.contains('layer-has-user')).toEqual(true);
  });

  it('Should have a layer-has-user class if two users', function() {
    el.users = [client.user, client.user];
    expect(el.classList.contains('layer-has-user')).toEqual(true);
  });

  it('Should resume not having a layer-has-user class', function() {
    el.users = [client.user, client.user];
    el.users = [];
    expect(el.classList.contains('layer-has-user')).toEqual(false);
  });

  it("Should generate an img for one user with an avatar", function() {
    client.user.avatarUrl = 'http://abby.normal.frankentein/';
    el.users = [client.user];
    expect(el.childNodes.length).toEqual(2);
    expect(el.firstChild.firstChild.tagName).toEqual('IMG');
    expect(el.firstChild.firstChild.src).toEqual(client.user.avatarUrl);
    expect(el.childNodes[1].tagName).toEqual('LAYER-PRESENCE');
  });

  it("Should generate a span with initials if firstName/lastName", function() {
    client.user.firstName = 'Abby';
    client.user.lastName = 'Normal'
    el.users = [client.user];
    expect(el.childNodes.length).toEqual(2);
    expect(el.firstChild.tagName).toEqual('SPAN');
    expect(el.firstChild.firstChild.textContent).toEqual('AN');
    expect(el.childNodes[1].tagName).toEqual('LAYER-PRESENCE');
  });

  it("Should generate a span with first two letters of displayName", function() {
    client.user.displayName = 'Abby';
    client.user.lastName = ''
    el.users = [client.user];
    expect(el.childNodes.length).toEqual(2);
    expect(el.firstChild.tagName).toEqual('SPAN');
    expect(el.firstChild.firstChild.textContent).toEqual('AB');
    expect(el.childNodes[1].tagName).toEqual('LAYER-PRESENCE');
  });

  it("Should generate multiple spans for multiple users", function() {
    el.users = [
      new Layer.Core.Identity({
          userId: 'AA',
          id: 'layer:///identities/AA',
          displayName: "Abby"
        }),
        new Layer.Core.Identity({
          userId: 'BB',
          id: 'layer:///identities/BB',
          displayName: 'Normal'
        })
    ];
    expect(el.childNodes.length).toEqual(2);
    expect(el.childNodes[0].tagName).toEqual('SPAN');
    expect(el.childNodes[1].tagName).toEqual('SPAN');
    expect(el.childNodes[0].firstChild.textContent).toEqual('AB');
    expect(el.childNodes[1].firstChild.textContent).toEqual('NO');
  });

  it("Should not set cluster class if one user", function() {
    el.users = [client.user];
    expect(el.classList.contains('layer-avatar-cluster')).toBe(false);
  });

  it("Should set cluster class if multiple users", function() {
    el.users = [
      new Layer.Core.Identity({
          userId: 'AA',
          id: 'layer:///identities/AA',
          displayName: "Abby"
        }),
        new Layer.Core.Identity({
          userId: 'BB',
          id: 'layer:///identities/BB',
          displayName: 'Normal'
        })
    ];
    expect(el.classList.contains('layer-avatar-cluster')).toBe(true);
  });

  it("Should set layer-empty-avatar on nameless identity", function() {
    el.users = [
      new Layer.Core.Identity({userId: 'AA', id: 'layer:///identities/AA'})
    ];
    expect(el.childNodes[0].classList.contains('layer-empty-avatar')).toBe(true);

    el.users = [
      new Layer.Core.Identity({userId: 'AA', id: 'layer:///identities/AA'}),
      new Layer.Core.Identity({userId: 'BB', id: 'layer:///identities/BB', displayName: "BB"})
    ];
    expect(el.childNodes[0].classList.contains('layer-empty-avatar')).toBe(false);
    expect(el.childNodes[1].classList.contains('layer-empty-avatar')).toBe(true);
  });

  it("Should set layer-empty-group-avatar on nameless identities", function() {
    el.users = [
      new Layer.Core.Identity({userId: 'AA', id: 'layer:///identities/AA'}),
      new Layer.Core.Identity({userId: 'BB', id: 'layer:///identities/BB'})
    ];
    expect(el.childNodes[0].classList.contains('layer-empty-group-avatar')).toBe(true);
    expect(el.childNodes.length).toEqual(1);

    el.users = [
      new Layer.Core.Identity({userId: 'AA', id: 'layer:///identities/AA'}),
      new Layer.Core.Identity({userId: 'BB', id: 'layer:///identities/BB'}),
      new Layer.Core.Identity({userId: 'CC', id: 'layer:///identities/CC', displayName: "CC"})
    ];
    expect(el.childNodes[0].classList.contains('layer-empty-group-avatar')).toBe(false);
    expect(el.childNodes[0].classList.contains('layer-empty-avatar')).toBe(false);
    expect(el.childNodes[1].classList.contains('layer-empty-group-avatar')).toBe(true);
  });

  it("Should have a layer-presence widget with its user set", function() {
    el.users = [client.user];
    expect(el.nodes.presence.tagName).toEqual('LAYER-PRESENCE');
    expect(el.nodes.presence.item).toBe(client.user);
  });

  it("Should respect showPresence of false", function() {
    el.showPresence = false;
    el.users = [client.user];
    expect(el.nodes.presence).toBe(undefined);
  });

  it("Should respect client.isPresenceEnabled of false", function() {
    client.isPresenceEnabled = false;
    el.users = [client.user];
    expect(el.nodes.presence).toBe(undefined);
  });

  describe("The onGenerateInitials() method", function() {
    it("Should use firstName and lastName above all else", function() {
      client.user.displayName = "Abe Baker";
      client.user.firstName = "Craig";
      client.user.lastName = "Doug";
      expect(el.onGenerateInitials(client.user)).toEqual('CD');
    });

    it("Should use firstName or lastName above all else", function() {
      client.user.displayName = "Abe Baker";
      client.user.firstName = "";
      client.user.lastName = "Doug";
      expect(el.onGenerateInitials(client.user)).toEqual('D');

      client.user.firstName = "Craig";
      client.user.lastName = "";
      expect(el.onGenerateInitials(client.user)).toEqual('C');
    });

    it("Should use displayName initials if available", function() {
      client.user.displayName = "Abe Baker";
      client.user.firstName = "";
      client.user.lastName = "";
      expect(el.onGenerateInitials(client.user)).toEqual('AB');
    });

    it("Should identify the last initial", function() {
      client.user.displayName = "Abe Baker Craig";
      client.user.firstName = "";
      client.user.lastName = "";
      expect(el.onGenerateInitials(client.user)).toEqual('AC');
    });

    it("Should use first two letters of display name if no initials found", function() {
      client.user.displayName = "AbeDoug";
      client.user.firstName = "";
      client.user.lastName = "";
      expect(el.onGenerateInitials(client.user)).toEqual('AB');
    });

    it("Should return empty string if nothing found", function() {
      client.user.displayName = "";
      client.user.firstName = "";
      client.user.lastName = "";
      expect(el.onGenerateInitials(client.user)).toEqual('');
    });
  });

  describe("The _sortMultiAvatars method", function() {
    var results;
    beforeEach(function() {
      el.users = [
        client.user,
        new Layer.Core.Identity({
          userId: 'A',
          id: 'layer:///identities/A',
        }),
        new Layer.Core.Identity({
          userId: 'B',
          id: 'layer:///identities/B',
          displayName: "B"
        }),
        new Layer.Core.Identity({
          userId: 'C',
          id: 'layer:///identities/C',
          avatarUrl: "C"
        }),
        new Layer.Core.Identity({
          userId: 'bot',
          id: 'layer:///identities/bot',
          firstName: "bot"
        }),
        new Layer.Core.Identity({
          userId: 'D',
          id: 'layer:///identities/D',
          lastName: "D"
        }),
      ];
      client.getIdentity("bot").type = 'BOT';
      results = el._sortMultiAvatars();
    });

    it("Should remove the session owner", function() {
      expect(results.indexOf(client.user)).toEqual(-1);
    });

    it("Should put the bots last", function() {
      expect(results[results.length - 1].userId).toEqual('bot');
    });

    it("Should put the anonymous user second last", function() {
      expect(results[results.length - 2].userId).toEqual('A');
    });

    it("Should put users with an avatar first", function() {
      expect(results[0].avatarUrl).toEqual("C");
    });

    it("SHould put users with initials after the avatar url, and in the order provided", function() {
      expect(results[1].displayName).toEqual("B");
      expect(results[2].lastName).toEqual("D");
    });
  });
});