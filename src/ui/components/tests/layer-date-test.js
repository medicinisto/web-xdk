/* eslint-disable */
describe('layer-date', function() {
  var el, testRoot, client, d;

  beforeAll(function(done) {
    setTimeout(done, 1000);
  });

  beforeEach(function() {
    jasmine.clock().install();
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

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);

    el = document.createElement('layer-date');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();

    d = new Date();
    d.setDate(0);
    var d2 = new Date(d);
    jasmine.clock().mockDate(d2);
  });

  afterEach(function() {

    document.body.removeChild(testRoot);
    if (el) {
      el.destroy();
      el = null;
    }
    if (client) {
      client.destroy();
      client = null;
    }
    jasmine.clock().uninstall();
  });

  it('Should accept a date parameter', function() {
    el.date = d;
    expect(el.date).toEqual(d);
  });

  it('Should use todayFormat if today', function() {
    spyOn(d, "toLocaleString").and.callThrough();
    el.todayFormat = {hour: 'numeric'};
    el.weekFormat = {minute: 'numeric'};
    el.defaultFormat = {month: 'numeric'};
    el.olderFormat = {year: 'numeric'};
    el.date = d;
    expect(d.toLocaleString).toHaveBeenCalledWith(navigator.language, el.todayFormat);
    expect(el.innerHTML).toEqual(d.toLocaleString(navigator.language, el.todayFormat));
  });

  it('Should use weekFormat if week', function() {
    d.setDate(d.getDate() - 3);
    spyOn(d, "toLocaleString").and.callThrough();
    el.todayFormat = {hour: 'numeric'};
    el.weekFormat = {minute: 'numeric'};
    el.defaultFormat = {month: 'numeric'};
    el.olderFormat = {year: 'numeric'};
    el.date = d;
    expect(d.toLocaleString).toHaveBeenCalledWith(navigator.language, el.weekFormat);
    expect(el.innerHTML).toEqual(d.toLocaleString(navigator.language, el.weekFormat));
  });

  it('Should use olderFormat if not this year', function() {
    d.setFullYear(d.getFullYear() - 3);
    spyOn(d, "toLocaleString").and.callThrough();
    el.todayFormat = {hour: 'numeric'};
    el.weekFormat = {minute: 'numeric'};
    el.defaultFormat = {month: 'numeric'};
    el.olderFormat = {year: 'numeric'};
    el.date = d;
    expect(d.toLocaleString).toHaveBeenCalledWith(navigator.language, el.olderFormat);
    expect(el.innerHTML).toEqual(d.toLocaleString(navigator.language, el.olderFormat));
  });

  it('Should use defaultFormat if this year; will fail stupid test if run first week of january', function() {
    d.setDate(d.getDate() - 8);
    spyOn(d, "toLocaleString").and.callThrough();
    el.todayFormat = {hour: 'numeric'};
    el.weekFormat = {minute: 'numeric'};
    el.defaultFormat = {month: 'numeric'};
    el.olderFormat = {year: 'numeric'};
    el.date = d;
    expect(d.toLocaleString).toHaveBeenCalledWith(navigator.language, el.defaultFormat);
    expect(el.innerHTML).toEqual(d.toLocaleString(navigator.language, el.defaultFormat));
  });

  it('Should rerender to empty', function() {
    el.date = d;
    el.date = null;
    expect(el.innerHTML).toEqual('');
  });

  it("Should use dateRenderer if provided", function() {
    var f = function() {return "Some Day";}
    el.dateRenderer = f;
    el.date = d;
    expect(el.innerHTML).toEqual("Some Day");
  });
});