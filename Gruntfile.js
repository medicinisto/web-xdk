/* eslint-disable */
var fs = require('fs');
var version = require('./package.json').version;
var HTML_HEAD = fs.readFileSync('./jsduck-config/head.html').toString();
var CSS = fs.readFileSync('./jsduck-config/style.css').toString();

module.exports = function (grunt) {
  var saucelabsTests = require('./grunt-scripts/sauce-gruntfile')(grunt, version);
  require('./grunt-scripts/jsduck')(grunt);
  require('./grunt-scripts/commonjsify')(grunt);
  require('./grunt-scripts/full-babel')(grunt);
  require('./grunt-scripts/optimize-webcomponents')(grunt);
  require('./grunt-scripts/adapters')(grunt);
  require('./grunt-scripts/fix-npm-package')(grunt);
  require('./grunt-scripts/generate-structures-from-jsduck')(grunt);
  require('./grunt-scripts/generate-typescript-from-jsduck-structures')(grunt);
  var doingIstanbul = false;


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'generate-structures-from-jsduck': {
      build: {
        files: [
          {
            src: [
              'src/**/*.js',
              '!tmp/commonjs/ui/**/test.js', '!tmp/commonjs/ui/**/tests/*.js' // skip UI test files
            ],
            dest: 'tmp/duck.json'
          }
        ]
      }
    },
    'generate-typescript-from-jsduck-structures': {
      build: {
        files: [
          {
            src: [
              'tmp/duck.json'
            ],
            dest: 'npm'
          }
        ]
      }
    },
    commonjsify: {
      build: {
        files: [
          {
            src: [
              'src/*.js', // Root level files
              'src/core/**/*.js', // Core files
              'src/utils/**/*.js', // Util files
              'src/ui/**/*.js', // UI files
              '!tmp/commonjs/ui/**/test.js', '!tmp/commonjs/ui/**/tests/*.js' // skip UI test files
            ],
            dest: 'tmp/commonjs/src'
          }
        ]
      }
    },
    "full-babel": {
      es5files: {
        files: [
          {
            src: [
              'tmp/commonjs/*.js',
              'tmp/commonjs/**/*.js'
            ],
            dest: 'tmp/es5/src'
          }
        ]
      },
      build: {
        files: [
          {
            src: [
              'build/layer-xdk.js'
            ],
            dest: 'build/layer-xdk.js'
          }
        ]
      }
    },

    "optimize-webcomponents": {
      build: {
        files: [
          {
            src: ['tmp/commonjs/src/ui/**/*.js'],
            dest: 'tmp/commonjs/src'
          }
        ],
        options: {
        }
      }
    },
    'jsduck-adapters': {
      build: {
        files: [
          {
            src: ['src/ui/**/*.js', '!src/ui/**/test.js', '!src/ui/**/tests/*.js']
          }
        ],
        options: {
        }
      }
    },
    clean: {
      typescript: ['npm/**.d.ts', 'npm/*/**.d.ts']
    },
    remove: {
      build: {
        dirList: ['build', 'npm', 'themes/build']
      },
      npm: {
        dirList: ['npm'],
      },
      npmjs: {
        dirList: ['npm/*', '!npm/theme', '!npm/grunt-tasks'],
      },
      theme: {
        dirList: ['themes/build']
      },
      tmp: {
        dirList: ['tmp']
      },
      typescript: {
        fileList: ['npm/*/*.d.ts']
      },
    },
    browserify: {
      options: {
        verbose: true,
        separator: ';',
        transform: [ ],
        browserifyOptions: {

        }
      },
      samples: {
        files: [
          {
            dest: 'samples/build.js',
            src: 'samples/index.js'
          }
        ],
        options: {
          transform: [['babelify', {
            presets: ['es2015']}]],
        }
      },
      build: {
        files: [
          {
            dest: 'build/layer-xdk.js',
            src: 'tmp/commonjs/src/index-all.js'
          }
        ]
      },

      coverage: {
        files: {
          'test/coverage-build.js': ['npm/index-all.js']
        },
        options: {
          transform: [[fixBrowserifyForIstanbul], ["istanbulify"]],
          browserifyOptions: {
            standalone: false,
            debug: false
          }
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */ ',
        mangle: {
          except: [
            "layer",
            "Client"]
        },
        sourceMap: false,
        screwIE8: true
      },
      build: {
        files: {
          'build/layer-xdk.min.js': ['build/layer-xdk.js']
        }
      }
    },


    less: {
      themes: {
        files: [
          {src: ['themes/src/layer-basic-blue/theme.less'], dest: 'tmp/themes/layer-basic-blue.css'},
          {src: ['themes/src/layer-groups/theme.less'], dest: 'tmp/themes/layer-groups.css'}
        ]
      }
    },

    copy: {
      npm: {
        files: [
          {src: ['**'], cwd: 'tmp/es5/src', dest: 'npm/', expand: true},
          {src: 'package.json', dest: 'npm/package.json'},
          {src: 'README.md', dest: 'npm/README.md'},
          {src: 'LICENSE', dest: 'npm/LICENSE'},
          {src: ['**'], cwd: 'grunt-scripts', dest: 'npm/grunt-scripts/', expand: true}
        ]
      },
      npmtheme: {
        files: [
          {src: ['**'], cwd: 'themes/src/', dest: 'npm/themes/src/', expand: true},
          {src: ['**'], cwd: 'tmp/themes/', dest: 'npm/themes/', expand: true}
        ]
      },
      buildthemes: {
        files: [
          {src: ['*.css'], cwd: 'npm/themes', dest: 'build/themes/', expand: true}
        ]
      },

      // Adds support for the ignoreFiles parameter, which is needed for removing generated files from the result
      fixIstanbul: {
        src: "grunt-template-jasmine-istanbul_src-main-js-template.js",
        dest: "node_modules/grunt-template-jasmine-istanbul/src/main/js/template.js"
      }
    },

    cssmin: {
      build: {
        files: [
          {src: ['tmp/themes/layer-basic-blue.css'], dest: 'tmp/themes/layer-basic-blue.min.css'},
          {src: ['tmp/themes/layer-groups.css'], dest: 'tmp/themes/layer-groups.min.css'}
        ]
      }
    },
    eslint: {
      build: {
        files: [{
          src: ['src/**.js', 'src/**/*.js', '!src/**/tests/*.js', '!src/**/test.js', '!src/**/samples.js']
        }],
        options: {
          quiet: true,
          configFile: '.eslintrc',
          rules: {
            'no-debugger': 2,
            'no-console': 2
          }
        }
      },
      dev: {
        files: [{
          src: ['src/**.js', 'src/**/*.js', '!src/**/tests/*.js', '!src/**/test.js', '!src/**/samples.js']
        }],
        options: {
          quiet: true,
          configFile: '.eslintrc',
          rules: {
            'no-debugger': 0,
            'no-console': 0
          }
        }
      }
    },
    // Documentation
    jsduck: {
      build: {
        src: ["tmp/es5/src/**/*.js"],
        dest: 'docs',
        options: {
          'builtin-classes': false,
          'warnings': ['-no_doc', '-dup_member', '-link_ambiguous', '-cat_class_missing'],
          'external': ['HTMLTemplateElement', 'WebSocket', 'Blob', 'KeyboardEvent', 'DocumentFragment', 'IDBVersionChangeEvent', 'IDBKeyRange', 'IDBDatabase', 'File', 'Canvas', 'CustomEvent', 'Set', 'Uint8Array', 'Audio'],
          'title': 'Layer Web XDK - API Documentation',
          'categories': ['jsduck-config/categories.json'],
          'head-html': HTML_HEAD,
          'css': [CSS],
          'footer': 'Layer Web XDK v' + version,
          'tags': ['jsduck-config/typescript-tag.rb']
        }
      }
    },
    jsducktemplates: {
      build: {
        files: [
          {
            src: ['src/ui/components/**/*.html']
          }
        ],
        options: {
        }
      }
    },
    jsduckfixes: {
      build: {
        files: [
          {
            src: ['docs/output/*.js']
          }
        ],
        options: {
        }
      }
    },
    version: {
      build: {
        files: [
          {
            dest: 'src/version.js',
            src: 'src/version.js'
          }
        ]
      },
      options: {
        version: "<%= pkg.version %>"
      }
    },
    packageName: {
      build: {
        files: [
          {
            dest: 'src/name.js',
            src: 'src/name.js'
          }
        ]
      },
      options: {
        name: "<%= pkg.name %>"
      }
    },
    'generate-specrunner': {
      dev: {
        files: [
          {
            src: ['src/ui/components/test.js', 'src/ui/**/test.js', 'src/ui/**/tests/**.js', 'test/core/unit/**.js', 'test/core/unit/*/**.js', 'test/core/integration/**.js']
          }
        ]
      }
    },
    'generate-quicktests': {
      dev: {
        files: [
          {
            src: ['src/ui/components/test.js', 'src/ui/**/test.js', 'src/ui/**/tests/**.js', 'test/core/unit/**.js', 'test/core/unit/*/**.js', 'test/core/integration/**.js']
          }
        ],
      }
    },
    'generate-smalltests': {
      dev: {
        files: [
          {
            src: ['src/ui/components/test.js', 'src/ui/**/test.js', 'src/ui/**/tests/**.js', 'test/core/unit/**.js', 'test/core/unit/*/**.js', 'test/core/integration/**.js']
          }
        ],
      }
    },
    connect: {
      saucelabs: {
        options: {
          base: "",
          port: 9999
        }
      },
      develop: {
        options: {
          base: "",
          port: 8004
        }
      }
    },
    parallel: {
      dev: {
        options: {
          grunt: true,
          stream: true
        },
        tasks: ['watch:dev', 'watch:themes']
      },
      test: {
        options: {
          grunt: true,
          stream: true
        },
        tasks: ['watch:test', 'watch:themes']
      }
    },
    watch: {
      dev: {
        files: ['package.json', 'Gruntfile.js', 'src/**', '!src/**/test.js', '!src/ui/**/tests/**.js', '!src/version.js'],
        tasks: ['generate-npm', 'notify:watch', 'eslint:dev'],
        options: {
          interrupt: false
        }
      },
      test: {
        files: ['package.json', 'Gruntfile.js', 'src/**', '!src/**/test.js', '!src/ui/**/tests/**.js', '!src/version.js'],
        tasks: ['generate-build-file', 'notify:watch', 'eslint:dev'],
        options: {
          interrupt: false
        }
      },
      themes: {
        files: ['themes/src/**'],
        tasks: ['theme'],
        options: {
          interrupt: true
        }
      },
      options: {
        atBegin: true
      }
    },
    notify: {
      watch: {
        options: {
          title: 'Watch Build',  // optional
          message: 'Build Complete' //required
        }
      },
      start: {
        options: {
          title: 'Start Build',
          message: 'Starting Build',
        }
      },
      npm: {
        options: {
          title: 'Build Running',
          message: 'NPM Folder Generated',
        },
      },
      browserify: {
        options: {
          title: 'Build Running',
          message: 'Browserify Done',
        }
      },
    },
    'saucelabs-jasmine': saucelabsTests.tasks.saucelabs,
  });

  /* Insure that browserify and babelify generated code does not get counted against our test coverage */
  var through = require('through');
  function fixBrowserifyForIstanbul(file) {
    doingIstanbul = true;
    var generatedLines = [
      "function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }",
    ];
      var data = '';
      return through(write, end);

      function write (buf) {
          data += buf;
      }
      function end () {
        var lines = data.split(/\n/);

        for (var i = 0; i < lines.length; i++) {
          if (generatedLines.indexOf(lines[i]) !== -1) {
            lines[i] = "/* istanbul ignore next */ " + lines[i];
          }
        }

        this.queue(lines.join('\n'));
        this.queue(null);
      }
    }




  grunt.registerMultiTask('version', 'Assign Versions', function() {
    var options = this.options();


    function replace(fileGroup, version) {
      fileGroup.src.forEach(function(file, index) {
        var contents = grunt.file.read(file);
        grunt.file.write(fileGroup.dest, "export default '" + version + "';\n");
      });
    }

    // Iterate over each file set and fire away on that set
    this.files.forEach(function(fileGroup) {
      replace(fileGroup, options.version);
    });
  });

  grunt.registerMultiTask('packageName', 'Assign product name', function() {
    var options = this.options();


    function replace(fileGroup, name) {
      fileGroup.src.forEach(function(file, index) {
        var contents = grunt.file.read(file);
        grunt.file.write(fileGroup.dest, "export default '" + name + "';\n");
      });
    }

    // Iterate over each file set and fire away on that set
    this.files.forEach(function(fileGroup) {
      replace(fileGroup, options.name);
    });
  });

  grunt.registerMultiTask('generate-specrunner', 'Building SpecRunner.html', function() {
    var options = this.options();
    var scripts = [];

    var contents = grunt.file.read('test/SpecRunner.html');
    var startNameStr = "myspecs = [";

    var startNameIndex = contents.indexOf(startNameStr);
    var endIndex = contents.indexOf(']', startNameIndex) + 1;

    // Iterate over each file set and generate the build file specified for that set
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {

        // If we don't validate that the unit test file compiles
        try {
          var f = new Function(grunt.file.read(file));
        } catch(e) {
          console.error(e);
          throw new Error("Test file " + file + " has a compilation error");
        }
        scripts.push('../' + file);
      });
    });


    contents = contents.substring(0, startNameIndex) + "myspecs = ['" +
      scripts.join("',\n'") + "']" +
      contents.substring(endIndex);
    grunt.file.write('test/SpecRunner.html', contents);
  });


  grunt.registerMultiTask('generate-quicktests', 'Building SpecRunner.html', function() {
    var options = this.options();
    var specFiles = [
      {file: 'test/SpecRunnerTemplate.html', contents: grunt.file.read('test/SpecRunnerTemplate.html'), template: true},
      {file: 'test/CoverageRunner.html', contents: grunt.file.read('test/CoverageRunner.html'), template: false}
    ];
    var startStr = "<!-- START GENERATED SPEC LIST -->";
    var endStr = "<!-- END GENERATED SPEC LIST -->";

    var startIndexes = specFiles.map(function(file) {
      return file.contents.indexOf(startStr) + startStr.length;
    });
    var endIndexes = specFiles.map(function(file) {
      return file.contents.indexOf(endStr);
    });

    var scripts = {all: []};

    // Iterate over each file set and generate the build file specified for that set
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {

        // If we don't validate that the unit test file compiles, it will simply be skipped during a test run.
        // Do not allow grunt to complete if any unit tests fail to compile
        try {
          var f = new Function(grunt.file.read(file));
        } catch(e) {
          console.error("Failed to parse " + file);
          console.error(e);
          throw new Error("Test file " + file + " has a compilation error");
        }

        var scriptTag = '<script src="../' + file + '" type="text/javascript"></script>';
        if (file.match(/test\/core/)) {
          folderName = "core_tests";
        } else {
          folderName = "ui_tests";
        }

        if (!scripts[folderName]) scripts[folderName] = [];
        scripts[folderName].push(scriptTag);
        scripts.all.push(scriptTag);
      });
    });

    for (var i = 0; i < specFiles.length; i++) {
      var filePath = specFiles[i].file;
      var contents = specFiles[i].contents;
      if (startIndexes[i] !== -1) {
        if (!specFiles[i].template) {
          contents = contents.substring(0, startIndexes[i]) + '\n' + scripts.all.join('\n') + '\n' + contents.substring(endIndexes[i]);
          grunt.file.write(filePath, contents);
        } else {

          Object.keys(scripts).forEach(function(testName, index, allScripts) {
            if (testName === 'all') return;
            var testFile = contents.substring(0, startIndexes[i]) + '\n' + scripts[testName].join('\n') + '\n' + contents.substring(endIndexes[i]);
            if (index < allScripts.length - 1) {
              testFile = testFile.replace(/next_file_name_here\.html/, allScripts[index + 1] + '.html');
            } else {
              //testFile = testFile.replace(/window.location.pathname/, '//window.location.pathname');
              testFile = testFile.replace(/next_file_name_here\.html/, 'tests_done.html');
            }
            grunt.file.write(filePath.replace(/[^/]*$/,  testName + '.html'), testFile);
          });
        }
      }
    }
  });

  grunt.registerMultiTask('generate-smalltests', 'Building SpecRunner.html', function() {
    grunt.file.expand("test/smalltest*.html").forEach(function(file) {
      grunt.file.delete(file);
    });

    function testDifficultyModifier(file) {
      var contents = grunt.file.read(file);
      var modifier = file.match(/src\/ui/) ? 2 : 1;

      var matches = contents.match(/for\s*\((var )?i\s*=\s*0;\s*i\s*<\s*(\d+)/m);
      if (matches && matches[2] >= 25) modifier = modifier * 3;
      return modifier;
    }

    function getTestCount(file) {
      var contents = grunt.file.read(file);
      var matches = contents.match(/\bit\(["']/g);
      return matches ? matches.length : 0;
    }


    var options = this.options();
    var contents = grunt.file.read('test/SpecRunnerTemplate.html');
    var startStr = "<!-- START GENERATED SPEC LIST -->";
    var endStr = "<!-- END GENERATED SPEC LIST -->";

    var startIndexes = contents.indexOf(startStr) + startStr.length;
    var endIndexes = contents.indexOf(endStr);

    var allFiles = [];
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        allFiles.push(file);
      });
    });

    var scripts = {};
    var fileIndex = 0;
    var maxSpecsPerFile = 600;
    var currentCount = 0;

    // Iterate over each file set and generate the build file specified for that set
    allFiles.forEach(function(file, index) {

      // If we don't validate that the unit test file compiles, it will simply be skipped during a test run.
      // Do not allow grunt to complete if any unit tests fail to compile
      try {
        var f = new Function(grunt.file.read(file));
      } catch(e) {
        console.error(e);
        throw new Error("Test file " + file + " has a compilation error");
      }
      var fileName;
      var scriptTag = '<script src="../' + file + '" type="text/javascript"></script>';
      var count = getTestCount(file);
      count = count * testDifficultyModifier(file);
      if (currentCount + count > maxSpecsPerFile && currentCount) {
        fileIndex++;
        currentCount = 0;
      }

      currentCount += count;
      fileName = 'smalltest' + fileIndex;

      if (!scripts[fileName]) scripts[fileName] = [];
      scripts[fileName].push(scriptTag);
    });

    if (startIndexes !== -1) {
      Object.keys(scripts).forEach(function(testName, index, allScripts) {
        var testFile = contents.substring(0, startIndexes) + '\n' + scripts[testName].join('\n') + '\n' + contents.substring(endIndexes);
        if (index < allScripts.length - 1) {
          testFile = testFile.replace(/next_file_name_here\.html/, allScripts[index + 1] + '.html');
        } else {
          testFile = testFile.replace(/next_file_name_here\.html/, 'tests_done.html');
        }
        grunt.file.write('test/' +  testName + '.html', testFile);
      });
    }
  });


  grunt.registerTask('refuse-to-publish', function() {
    if (!process.env.TRAVIS_JOB_NUMBER) {
      throw new Error('cd into the npm folder to complete publishing');
    }
  });

  // Building
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-jsduck');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-remove');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-parallel');


  grunt.registerTask('coverage', ['copy:fixIstanbul', 'remove:tmp', 'commonjsify', 'optimize-webcomponents', 'browserify:coverage']);

  grunt.registerTask("test", ["generate-build-file", "connect:saucelabs","saucelabs-jasmine:quicktests", "saucelabs-jasmine:smalltests"]);

  grunt.registerTask("retest", ["connect:saucelabs", "saucelabs-jasmine:smalltests"]);

  grunt.registerTask('docs', ['generate-npm', 'jsduck-adapters', 'jsduck', 'jsduckfixes']);

  // Basic Code/theme building
  grunt.registerTask('generate-npm', [
    'remove:tmp', // cleanup old build
    'version',  // Verify version.js is up to date
    'packageName', // Verify the package name is up to date
    'commonjsify', // Replace es6 import/export with something that browserify can work with; write to tmp/commonjs
    'optimize-webcomponents', // Strip out comments/white-space from webcomponents (overwrite tmp/commonjs)
    'full-babel:es5files', // write tmp/es5 with code that jsduck and IE11 can understand
    'remove:npmjs', // Insure we have a clean npm folder
    'copy:npm', // Copy es5 into npm
    'fix-npm-package',
    'notify:npm', // Setup the npm folder package.json
  ]);

  grunt.registerTask('generate-build-file', [
    'remove:tmp', // cleanup old build
    'version',  // Verify version.js is up to date
    'packageName', // Verify the package name is up to date
    'commonjsify', // Replace es6 import/export with something that browserify can work with; write to tmp/commonjs
    'optimize-webcomponents', // Strip out comments/white-space from webcomponents (overwrite tmp/commonjs)
    'browserify:build', // Generate a build file from the optimized webcomponents and commonjsified files
    'full-babel:build', // Update build file with babelified version
    'notify:browserify',
    "generate-quicktests", "generate-smalltests" // Update SpecRunner to run new test files
  ]);

  grunt.registerTask('build', [
    'eslint:build', // Verify we are ready to build
    'remove:build', // Delete the build folder
    'remove:npm',
    'generate-npm', // Here only because people will probably run build and expect Everything not just the build folder
    'theme', // build the theme and write it to the npm folder
    'typescript', // generate typescript definitions and write them to the npm folder
    'generate-build-file', // Generate all build artifacts in the build folder
    'uglify', // Generate layer-xdk.min.js
    'copy:buildthemes' // Copy theme files in for CDN deploy
  ]);


  grunt.registerTask('prepublish', ['generate-npm', 'refuse-to-publish']);

  grunt.registerTask('samples', ['version', 'remove:tmp', 'optimize-webcomponents', 'commonjsify', 'browserify:samples']);

  // Build the theme and write them to npm folder
  grunt.registerTask('theme', ['remove:theme', 'less', 'cssmin', 'copy:npmtheme']),

  grunt.registerTask('typescript', ['clean:typescript', 'generate-structures-from-jsduck', 'generate-typescript-from-jsduck-structures']);

  grunt.registerTask('default', ['build', 'generate-npm']);

  // Open a port for running tests and rebuild whenever anything interesting changes
  grunt.registerTask("developnpm", ["theme", "generate-npm", "parallel:dev"]);
  grunt.registerTask("developtests", ["connect:develop", "generate-build-file", "parallel:test"]);

};
