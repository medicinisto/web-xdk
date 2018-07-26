/* eslint-disable */
module.exports = function init(grunt) {
  grunt.registerMultiTask('jsduckfixes', 'Fixing Docs', function jsduckfixes() {
    var options = this.options();

    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        var contents = grunt.file.read(file);
        var startIndex = contents.indexOf('{');
        var endIndex = contents.lastIndexOf('}') + 1;
        var parsedContents = JSON.parse(contents.substring(startIndex, endIndex));

        if (parsedContents.members) parsedContents.members.forEach(function(element) {
          element.id = element.id.replace(/:/g, '_');
        });
        parsedContents.html = parsedContents.html.replace(/id='([^']*):([^']*)'/g, "id='" + "$1" + "_" + "$2'");
        parsedContents.html = parsedContents.html.replace(/href='([^']*):([^']*)'/g, "href='" + "$1" + "_" + "$2'");
        contents = contents.substring(0, startIndex) + JSON.stringify(parsedContents) + contents.substring(endIndex);
        grunt.file.write(file, contents);
      });
    });
  });

  /* Adds template info to the jsduck class definition comments */
  grunt.registerMultiTask('jsducktemplates', 'Adding templates to Docs', function() {
    var options = this.options();

    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        var template = grunt.file.read(file);
        var srcFilePath = file.replace(/src/, 'n').replace(/\.html/, '.js');
        var srcFile = grunt.file.read(srcFilePath);
        var startIndex = srcFile.indexOf("@class");

        if (startIndex !== -1) {
          var layerIds = (template.match(/layer-id=["'](.*?)["']/gm) || []).map(function(match) {
            return match.replace(/^.*["'](.*)["']/, "$1");
          });

          srcFile = srcFile.substring(0, startIndex) +
          `### Templates\n\n * You can see the template for the latest template version at [${file.replace(/^.*\//, '')}](https://github.com/layerhq/web-xdk/blob/master/src/${srcFilePath.replace(/^.*npm/,'').replace(/\.js$/, '.html')})  \n * \n * The following layer-id attributes are expected in templates for this component: \n * \n * * ${layerIds.join('\n * * ')} \n` + srcFile.substring(startIndex);
          grunt.file.write(srcFilePath, srcFile);
        }
      });
    });
  });
};