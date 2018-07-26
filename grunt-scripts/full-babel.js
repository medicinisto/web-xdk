/* eslint-disable */
var extractClassDef = require('./extract-class-docblock');
var babel = require('babel-core');
var path = require('path');

module.exports = function(grunt) {
  grunt.registerMultiTask('full-babel', 'Babelifying all files in src/core', function() {
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
                "Chrome > 64",
                "Safari >= 11",
                "Firefox >= 58",
                "last 2 Edge versions",
                "IE 11"
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
          var dest = file.replace(/^.*?\/src/, fileGroup.dest);
          convert(file, dest);
        } catch(e) {
          console.error('Failed to convert ' + file + ' to babel');
          throw(e);
        }
      });
    });
  });
}
