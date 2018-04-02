/* eslint-disable */
describe('layer-age', function() {
  var el, d, client;


  beforeEach(function() {
    jasmine.clock().install();
    client = new Layer.init({
      appId: 'layer:///apps/staging/Fred'
    }).on('challenge', function() {});
    el = document.createElement('layer-age');
    Layer.Utils.defer.flush();
    d = new Date('2010-10-10');
    d.setHours(0,0,0,0);
    var d2 = new Date(d);
    jasmine.clock().mockDate(d2);
  });

  afterEach(function() {
    if (client) {
      client.destroy();
      client = null;
    }
    if (el) el.destroy();
    jasmine.clock().uninstall();
  });

  it('Should accept a date parameter', function() {
    var d = new Date();
    el.date = d;
    expect(el.date).toEqual(d);
  });

  it("Should accept an ageRenderer", function() {
    var f = jasmine.createSpy('age');
    el.ageRenderer = f;
    el.date = d;
    expect(el.ageRenderer).toBe(f);
    el.onRender();
    expect(f).toHaveBeenCalledWith(d);
  });

  it('Should handle absense of value', function() {
    el.onRender();
    expect(el.innerHTML).toEqual("Never Used");
  });

  it('Should handle minutes ago', function() {
    el.date = d;

    el.onRender();
    expect(el.innerHTML).toEqual("");

    d.setMinutes(d.getMinutes() - 1);
    el.onRender();
    expect(el.innerHTML).toEqual("1 min ago");

    d.setMinutes(d.getMinutes() - 1);
    el.onRender();
    expect(el.innerHTML).toEqual("2 mins ago");

    d.setMinutes(d.getMinutes() - 98);
    el.onRender();
    expect(el.innerHTML).toEqual("100 mins ago");

    d.setMinutes(d.getMinutes() - 20);
    el.onRender();
    expect(el.innerHTML).not.toEqual("120 mins ago");
  });

  it('Should handle hours ago', function() {
    el.date = d;

    d.setMinutes(d.getMinutes() - 120);
    el.onRender();
    expect(el.innerHTML).toEqual("2 hours ago");

    d.setHours(d.getHours() - 10);
    el.onRender();
    expect(el.innerHTML).toEqual("12 hours ago");

    d.setHours(d.getHours() - 30);
    el.onRender();
    expect(el.innerHTML).toEqual("42 hours ago");

    d.setHours(d.getHours() - 10);
    el.onRender();
    expect(el.innerHTML).not.toEqual("52 hours ago");
  });

  it('Should handle days ago', function() {;
    el.date = d;

    d.setDate(d.getDate() - 2);
    el.onRender();
    expect(el.innerHTML).toEqual("2 days ago");

    d.setDate(d.getDate() - 10);
    el.onRender();
    expect(el.innerHTML).toEqual("12 days ago");

    d.setDate(d.getDate() - 25);
    el.onRender();
    expect(el.innerHTML).toEqual("37 days ago");

    d.setDate(d.getDate() - 30);
    el.onRender();
    expect(el.innerHTML).toEqual("2 months ago");
  });

  it('Should handle months ago', function() {
    el.date = d;

    d.setMonth(d.getMonth() - 2);
    el.onRender();
    expect(el.innerHTML).toEqual("2 months ago");

    d.setMonth(d.getMonth() - 9);
    el.onRender();
    expect(el.innerHTML).toEqual("11 months ago");

    d.setMonth(d.getMonth() - 1);
    el.onRender();
    expect(el.innerHTML).not.toEqual("12 months ago");
  });
});