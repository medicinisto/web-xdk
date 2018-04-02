/* eslint-disable */
describe('layer-file-upload-button', function() {
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

    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);

    el = document.createElement('layer-file-upload-button');
    testRoot.appendChild(el);

    CustomElements.takeRecords();
    Layer.Utils.defer.flush();
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
  });


  afterEach(function() {

  });

  it("Should setup a label pointing to a file input", function() {
    expect(el.nodes.label.getAttribute("for")).toEqual(el.nodes.input.id);
    expect(el.nodes.input.id.length > 0).toBe(true);
  });

  it("Should set the accept attribute", function() {
    el.accept = "application/pdf";
    expect(el.nodes.input.getAttribute('accept')).toEqual("application/pdf");
  });

  it("Should set the multiple attribute", function() {
    expect(el.nodes.input.multiple).toEqual(false);
    el.multiple = true;
    expect(el.nodes.input.multiple).toEqual(true);
  });

  it("Should trigger layer-files-selected onChange", function() {
    var file = new Blob(["abcdef"], {type: "crap/plain"});
    el.nodes.input = {
      files: [file]
    }

    var eventSpy = jasmine.createSpy('eventListener');
    el.addEventListener('layer-files-selected', eventSpy);


    // Run
    el.onChange();

    // Posttest
    var args = eventSpy.calls.allArgs()[0];
    expect(args.length).toEqual(1);
    expect(args[0].detail).toEqual({ files: [file] });
  });

  it("Should stop processing after layer-files-selected evt.preventDefault", function() {
    var file = new Blob(["abcdef"], {type: "crap/plain"});
    el.nodes.input = {
      files: [file]
    }

    el.addEventListener('layer-files-selected', function(evt) {
      evt.preventDefault();
    });

    var eventSpy = jasmine.createSpy('eventListener');
    el.addEventListener('layer-models-generated', eventSpy);

    // Run
    el.onChange();

    // Posttest
    var args = eventSpy.calls.allArgs()[0];
    expect(args).toBe(undefined);
  });

  it("Should trigger layer-models-generated", function() {
    var file = new Blob(["abcdef"], {type: "crap/plain"});
    el.nodes.input = {
      files: [file]
    }

    var eventSpy = jasmine.createSpy('eventListener');
    el.addEventListener('layer-models-generated', eventSpy);
    var FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');

    // Run
    el.onChange();

    // Posttest
    var args = eventSpy.calls.allArgs()[0];
    expect(args.length).toEqual(1);
    expect(args[0].detail.models[0].source).toBe(file);
    expect(args[0].detail).toEqual({ models: [jasmine.any(FileModel)] });
  });

  it("Should call parentComponent.onModelsGenerated", function() {
    // Setup
    el.parentComponent = {
      onModelsGenerated: jasmine.createSpy('generated')
    }
    var file = new Blob(["abcdef"], {type: "crap/plain"});
    el.nodes.input = {
      files: [file]
    }
    var FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');

    // Run
    el.onChange();

    // Posttest
    expect(el.parentComponent.onModelsGenerated).toHaveBeenCalledWith([jasmine.any(FileModel)]);

    // Cleanup
    delete el.properties.parentComponent;
  });

  it("Should prevent call to parentComponent.onModelsGenerated", function() {
    // Setup
    el.parentComponent = {
      onModelsGenerated: jasmine.createSpy('generated')
    }
    var file = new Blob(["abcdef"], {type: "crap/plain"});
    el.nodes.input = {
      files: [file]
    }
    var FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel');
    el.addEventListener('layer-models-generated', function(evt) {
      evt.preventDefault();
    });

    // Run
    el.onChange();

    // Posttest
    expect(el.parentComponent.onModelsGenerated).not.toHaveBeenCalled();

    // Cleanup
    delete el.properties.parentComponent;
  });

  // This test causes IE to open a file dialog, and no more tests run after that.
  xit("Should forward clicks to the input", function() {
    var called = false;

    el.nodes.input.addEventListener('click', function() {
      called = true;
    });


    // Run
    el.nodes.label.click();
    expect(called).toBe(true);
  });
});