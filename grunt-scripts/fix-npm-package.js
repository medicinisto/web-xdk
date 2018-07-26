/* eslint-disable */
module.exports = function(grunt) {
  grunt.registerTask('fix-npm-package', function() {
    var contents = JSON.parse(grunt.file.read('npm/package.json'));
    contents.main = 'index.js'
    contents.types = 'index-all.d.ts';
    delete contents.scripts.prepublishOnly;
    grunt.file.write('npm/package.json', JSON.stringify(contents, null, 4));
  });
}
