/* eslint-disable */
var extractClassDef = require('./extract-class-docblock');
var path = require('path');
var babel = require('babel-core');

module.exports = function(grunt) {
  // Replace each file with a conversion that really should only replace `import/export` with `require/export`
  // Any really experimental ES6 should not be used in the XDK code but if it is, will get converted here too.
  grunt.registerMultiTask('commonjsify', 'Babelifying all files in src/core', function() {
    var options = this.options();

    function convert(file, outputPath) {
      try {
        //console.log("Read " + file + " and write " + outputPath);
        var output = grunt.file.read(file);
        var outputFolder = path.dirname(outputPath);
        if (!grunt.file.exists(outputFolder)) {
          grunt.file.mkdir(outputFolder);
        }

        const { code, def } = extractClassDef(output);

        var babelResult = babel.transform(code, {
          presets: [["env", {
            "targets": {
              "browsers": [
                "Chrome > 64"
              ]
            }
          }]],
          compact: false
        });
        var result = def + babelResult.code;

        grunt.file.write(outputPath, result);
      } catch(e) {
        grunt.log.writeln('Failed to process ' + file + '; ', e);
      }
    }

    var files = [];
    // Iterate over each file set and generate the build file specified for that set
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        files.push(file);
        try {
          convert(file, file.replace(/^.*?\//, fileGroup.dest + '/'));
        } catch(e) {
          console.error('Failed to convert ' + file + ' to babel');
          throw(e);
        }
      });
    });
  });
}
