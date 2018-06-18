/* eslint-disable */
var fs = require('fs');
var path = require('path');
var version = require('./package.json').version;
var HTML_HEAD = fs.readFileSync('./jsduck-config/head.html').toString();
var CSS = fs.readFileSync('./jsduck-config/style.css').toString();
var babel = require('babel-core');

function extractClassDef(text) {
  const result = {
    code: '',
    def: ''
  };
  var indexOfClass = text.indexOf('@class');
  var indexOfClassCodeBlock = (indexOfClass !== -1) ? text.lastIndexOf('/**', indexOfClass) : -1;
  if (indexOfClassCodeBlock !== -1) {
    var endOfClassCodeBlock = text.indexOf('*/', indexOfClassCodeBlock);
    if (endOfClassCodeBlock !== -1) {
      endOfClassCodeBlock += 2;
      var prefix = text.substring(0, indexOfClassCodeBlock);
      var classComment = text.substring(indexOfClassCodeBlock, endOfClassCodeBlock);
      classComment = classComment.replace(/\n\s*\*/g, '\n *') + '\n';
      var postfix =  text.substring(endOfClassCodeBlock);
      result.code = prefix + postfix;
      result.def = classComment;
    }
  }
  if (!result.code) result.code = text;
  return result;
}

module.exports = function (grunt) {
  var saucelabsTests = require('./sauce-gruntfile')(grunt, version);
  var doingIstanbul = false;


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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

    remove: {
      build: {
        dirList: ['build', 'npm', 'themes/build']
      },
      theme: {
        dirList: ['themes/build']
      },
      tmp: {
        dirList: ['tmp']
      }
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
          {src: ['themes/src/layer-basic-blue/theme.less'], dest: 'npm/themes/layer-basic-blue.css'},
          {src: ['themes/src/layer-groups/theme.less'], dest: 'npm/themes/layer-groups.css'}
        ]
      }
    },

    copy: {
      npm: {
        files: [
          {src: ['**'], cwd: 'tmp/es5/src', dest: 'npm/', expand: true},
          {src: 'package.json', dest: 'npm/package.json'},
          {src: 'README.md', dest: 'npm/README.md'},
          {src: 'LICENSE', dest: 'npm/LICENSE'}
        ]
      },
      npmthemesrc: {
        files: [
          {src: ['**'], cwd: 'themes/src/', dest: 'npm/themes/src/', expand: true}
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
          {src: ['npm/themes/layer-basic-blue.css'], dest: 'npm/themes/layer-basic-blue.min.css'},
          {src: ['npm/themes/layer-groups.css'], dest: 'npm/themes/layer-groups.min.css'}
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
          'external': ['HTMLTemplateElement', 'Websocket', 'Blob', 'KeyboardEvent', 'DocumentFragment', 'IDBVersionChangeEvent', 'IDBKeyRange', 'IDBDatabase', 'File', 'Canvas', 'CustomEvent', 'Set', 'Uint8Array', 'Audio'],
          'title': 'Layer Web XDK - API Documentation',
          'categories': ['jsduck-config/categories.json'],
          'head-html': HTML_HEAD,
          'css': [CSS],
          'footer': 'Layer Web XDK v' + version
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
        tasks: ['wait', 'generate-npm', 'notify:watch', 'eslint:dev'],
        options: {
          interrupt: false
        }
      },
      test: {
        files: ['package.json', 'Gruntfile.js', 'src/**', '!src/**/test.js', '!src/ui/**/tests/**.js', '!src/version.js'],
        tasks: ['wait', 'generate-build-file', 'notify:watch', 'eslint:dev'],
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

    grunt.registerMultiTask('jsduckfixes', 'Fixing Docs', function() {
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

  grunt.registerMultiTask('version', 'Assign Versions', function() {
    var options = this.options();


    function replace(fileGroup, version) {
      fileGroup.src.forEach(function(file, index) {
        var contents = grunt.file.read(file);
        grunt.file.write(fileGroup.dest, "module.exports = '" + version + "';\n");
      });
    }

    // Iterate over each file set and fire away on that set
    this.files.forEach(function(fileGroup) {
      replace(fileGroup, options.version);
    });
  });


  grunt.registerMultiTask('custom_copy', 'Copying files', function() {
    var options = this.options();

    function process(file, outputPath) {
      try {
        grunt.file.copy(file, outputPath);
      } catch(e) {
        grunt.log.writeln('Failed to process ' + file + '; ', e);
      }
    }

    // Iterate over each file set and generate the build file specified for that set
    this.files.forEach(function(fileGroup) {
      fileGroup.src.forEach(function(file, index) {
        // TODO: Generalize this to not only work with src
        process(file, file.replace(/^src/, fileGroup.dest));
      });
    });
  });

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


  grunt.registerTask('fix-npm-package', function() {
    var contents = JSON.parse(grunt.file.read('npm/package.json'));
    contents.main = 'index.js'
    delete contents.scripts.prepublishOnly;
    grunt.file.write('npm/package.json', JSON.stringify(contents, null, 4));
  });

  grunt.registerTask('refuse-to-publish', function() {
    if (!process.env.TRAVIS_JOB_NUMBER) {
      throw new Error('cd into the npm folder to complete publishing');
    }
  });

  grunt.registerTask('wait', function() {
    var done = this.async();
    var waitTime = 4000;
    setTimeout(function() {
      console.log("Wait " + waitTime + " completed");
      done();
    }, waitTime);
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
    'commonjsify', // Replace es6 import/export with something that browserify can work with; write to tmp/commonjs
    'optimize-webcomponents', // Strip out comments/white-space from webcomponents (overwrite tmp/commonjs)
    'full-babel:es5files', // write tmp/es5 with code that jsduck and IE11 can understand
    'copy:npm', // Copy es5 into npm
    'theme', // build the theme and write it to npm
    'fix-npm-package', 'notify:npm', // Setup the npm folder package.json
  ]);

  grunt.registerTask('generate-build-file', [
    'remove:tmp', // cleanup old build
    'version',  // Verify version.js is up to date
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
    'generate-npm', // Here only because people will probably run build and expect Everything not just the build folder
    'generate-build-file', // Generate all build artifacts
    'uglify', // Generate layer-xdk.min.js
    'copy:buildthemes' // Copy theme files in for CDN deploy
  ]);


  grunt.registerTask('prepublish', ['generate-npm', 'refuse-to-publish']);

  grunt.registerTask('samples', ['version', 'remove:tmp', 'optimize-webcomponents', 'custom_copy:src', 'commonjsify', 'browserify:samples']);

  // Build the theme and write them to npm folder
  grunt.registerTask('theme', ['remove:theme', 'less', 'cssmin', 'copy:npmthemesrc']),


  grunt.registerTask('default', ['build', 'generate-npm']);

  // Open a port for running tests and rebuild whenever anything interesting changes
  grunt.registerTask("developnpm", ["generate-npm", "parallel:dev"]);
  grunt.registerTask("developtests", ["connect:develop", "generate-build-file", "parallel:test"]);
};
