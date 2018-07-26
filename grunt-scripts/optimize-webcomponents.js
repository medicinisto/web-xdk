/* eslint-disable */
var path = require('path');

module.exports = function(grunt) {
  /*
   * Take the Webcomponent definitions, and optimize away stuff we don't need...
   * like comments and whitespace in the CSS and HTML template strings.
   */
  grunt.registerMultiTask('optimize-webcomponents', 'Building Web Components', function() {
    var options = this.options();

    function optimizeStrings(contents, name, commentExpr) {
      var keyString = name + ': `';
      var startIndex = contents.indexOf(keyString);
      if (startIndex === -1) return contents;

      startIndex += keyString.length;
      var endIndex = contents.indexOf('`', startIndex);
      if (endIndex === -1) return contents;
      var stringToOptimize = contents.substring(startIndex, endIndex).replace(commentExpr, '').split(/\n/).map(line => line.trim()).filter(line => line).join('\n').replace(/>\n</g, '><');
      return contents.substring(0, startIndex) + stringToOptimize + contents.substring(endIndex);
    }

    function optimizeWebcomponent(file, dest) {
      try {
        // Extract the class name; TODO: class name should be same as file name.
        var jsFileName = file.replace(/^.*\//, '');
        var className = jsFileName.replace(/\.js$/, '');

        if (jsFileName === 'test.js') return;

        var output = grunt.file.read(file);
        output = optimizeStrings(output, 'style', /\/\*[\s\S]*?\*\//mg);
        output = optimizeStrings(output, 'template', /<!--[\s\S]*?-->/mg);

        var destFolder = path.dirname(dest);

        if (!grunt.file.exists(destFolder)) {
          grunt.file.mkdir(destFolder);
        }

        //console.log("Write " + dest);
        grunt.file.write(dest, output);
      } catch(e) {
        grunt.log.writeln('Failed to process ' + file + '; ', e);
      }
    }

    var files = [];
    // Iterate over each file set and generate the build file specified for that set
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        files.push(file);
        var dest = file.replace(/^.*?\/src/, fileGroup.dest);
        optimizeWebcomponent(file, dest);
      });
    });
    inWebcomponents = false;
  });
}