/* eslint-disable */
module.exports = function(grunt) {
  grunt.registerMultiTask('jsduck-adapters', 'Adding docs to adaptors', function() {
    var options = this.options();
    var components = {};
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        var script = grunt.file.read(file);
        var matches = script.match(/^\s*registerComponent\('(layer-.*?)'/m);
        if (matches) {
          const componentName = matches[1];
          const reactComponentName = (componentName.substring(0, 1).toUpperCase() +
            componentName.substring(1)
            .replace(/-(.)/g, (str, value) => value.toUpperCase()))
            .replace(/^Layer/, '');
          const header = script.match(/\/\*\*[\s\S]*?\*\s*(.*)/);

          var classNameMatches = script.match(/@class (.*)/m);
          if (classNameMatches) {
            components[reactComponentName] = {
              description: header ? header[1] : '',
              duckName: classNameMatches ? classNameMatches[1] : '',
            };
          }
        }
      });
    });

    var reference = [];
    Object.keys(components).forEach((componentName) => {
      var description = components[componentName].description;
      var duckClassName = components[componentName].duckName;
      reference.push('@return {' + duckClassName + '} return.' + componentName + '    ' + description);
    });

    var reactAdaptor = grunt.file.read('tmp/es5/src/ui/adapters/react.js');
    var adapterStartIndex = reactAdaptor.indexOf('/**');
    var adapterEndIndex = reactAdaptor.indexOf('*/', adapterStartIndex);
    reactAdaptor = reactAdaptor.substring(0, adapterEndIndex) +
    '* ' + reference.join('\n * ') + "\n" +
    reactAdaptor.substring(adapterEndIndex);
    grunt.file.write('tmp/es5/src/ui/adapters/react.js', reactAdaptor);
  });
}