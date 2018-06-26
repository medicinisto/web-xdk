
function processClassDef({ tags, docblock }, currentDef) {
  currentDef.docblock = docblock;
  tags.forEach((tag) => {
    switch (tag.tagName) {
      case 'extends':
        currentDef.extends = tag.details;
        break;
      case 'private':
        currentDef.private = tag.details;
        break;

      case 'singelton':
        currentDef.singelton = tag.details;
        break;

      case 'mixin':
        currentDef.mixins.push(tag.details);
        break;
      case 'abstract':
        currentDef.abstract = true;
        break;
      case 'typescript':
        currentDef.instructions = tag.details;
        break;
    }
  });
}

function parseProperty(propertyDef, isReturn) {
  let tagMatches = propertyDef.match(/^{(.*?)}\s+\[(.+?)(=.*)?\](\s+.*)?$/);
  let type;
  let name;
  let required = true;
  let value;
  let description;
  try {
    if (tagMatches) {
      type = tagMatches[1];
      required = false;
      name = tagMatches[2];
      value = (tagMatches[3] || '').substring(1);
      description = tagMatches[4] || '';
    } else if (isReturn) {
      const thisMatch = propertyDef.match(/^({.*?}\s+)?this\s*(.*)/);
      if (thisMatch) {
        name = 'this';
        description = thisMatch[2];
      } else if (propertyDef.match(/{.*?}\s*$/)) {
        type = propertyDef.match(/{(.*?)}\s*$/)[1];
      } else {
        tagMatches = propertyDef.match(/^{(.*?)}\s*(returns?\.\S+)?(\s+.*)?$/);
        type = tagMatches[1];
        name = tagMatches[2] || '';
        description = tagMatches[3];
      }
    } else {
      tagMatches = propertyDef.match(/^{(.*?)}\s*(\S+)(\s+.*)?$/);
      if (!tagMatches) throw new Error('Could not process ' + propertyDef);
      type = tagMatches[1];
      name = tagMatches[2];
      description = tagMatches[4] || '';
    }

    switch (type) {
      case 'String':
        type = 'string';
        break;
      case 'Number':
      case 'number':
        type = 'number';
        if (typeof value === 'string') value = parseInt(value);
        break;
      case 'Boolean':
      case 'boolean':
        type = 'boolean';
        if (typeof value !== 'boolean') value = value == 'true';
        break;
    }

    description = (description || '').trim().replace(/^[\s\-]*/, '');

    return { type, name, required, value, description };
  } catch (e) {
    console.error('Failed to parse\n> ' + propertyDef, '\n', e);
    throw e;
  }
}

function processPropertyDef({ tags, docblock }, currentDef) {
  const propertyDef = {
    docblock,
    subproperties: {},
    type: '',
    private: undefined,
    protected: undefined,
    name: '',
    static: false,
    readonly: false,
    required: false,
    description: '',
    value: null,
  };

  const hiddenTags = tags.filter(tag => ['hidden', 'hide', 'removed'].indexOf(tag.tagName) !== -1);
  if (hiddenTags.length) return;

  let funcName;
  tags.forEach((tag) => {
    switch (tag.tagName) {
      case 'private':
        propertyDef.private = true;
        propertyDef.protected = false;
        break;
      case 'protected':
        propertyDef.protected = true;
        propertyDef.private = false;
        break;
      case 'static':
        propertyDef.static = true;
        break;
      case 'readonly':
        propertyDef.readonly = true;
        break;
      case 'param':
      case 'property': {
        let { type, name, required, value, description } = parseProperty(tag.details, false);
        if (tag.tagName === 'param' && funcName) {
          name = funcName + '.' + name;
        }

        description = (description || '').trim().replace(/^[\s\-]*/, '');
        if (name.indexOf('.') === -1) {
          propertyDef.type = type;
          propertyDef.required = required;
          propertyDef.name = name;
          propertyDef.value = value;
          propertyDef.description = description;

          if (propertyDef.private === undefined && propertyDef.protected === undefined) {
            propertyDef.private = name.indexOf('_') === 0;
          }
          if (propertyDef.name) currentDef.properties.push(propertyDef);
          if (type === 'Function') {
            funcName = name;
          }
        } else {
          const nameParts = name.split('.');
          let def = propertyDef;
          for (let i = 1; def && i < nameParts.length - 1; i++) {
            def = def.subproperties[nameParts[i]];
          }
          if (def) {
            const subName = nameParts[nameParts.length - 1];
            def = def.subproperties[subName] = {
              subproperties: {},
              type: '',
              name: subName,
              description: '',
              value: null,
            };
            def.type = type;
            def.required = required;
            def.value = value;
            def.description = description;
          }
        }
        break;
      }
      default:
        console.log('ignore: ' + tag.tagName + ': ' + tag.details);
    }
    propertyDef.private = Boolean(propertyDef.private);
    propertyDef.protected = Boolean(propertyDef.protected);
    propertyDef.readonly = Boolean(propertyDef.readonly);
  });
}

function processMethodDef({ tags, name, docblock }, currentDef) {
  if (name === true) throw new Error('Missing method name in ' + docblock);
  const methodDef = {
    docblock,
    returns: null,
    params: [],
    private: undefined,
    protected: undefined,
    name: name.trim(),
    static: false,
    description: '',
    abstract: false,
  };
  const hiddenTags = tags.filter(tag => ['hidden', 'hide', 'removed', 'ignore'].indexOf(tag.tagName) !== -1);
  if (hiddenTags.length) {
    return;
  }

  tags.forEach((tag) => {
    switch (tag.tagName) {
      case 'private':
        methodDef.private = true;
        methodDef.protected = false;
        break;
      case 'protected':
        methodDef.protected = true;
        methodDef.private = false;
        break;
      case 'abstract':
        methodDef.abstract = true;
        break;
      case 'static':
        methodDef.static = true;
        break;
      case 'method':
        break;
      case 'param': {
        const parsedProp = parseProperty(tag.details, false);
        const type = parsedProp.type;
        const paramName = parsedProp.name;
        const required = parsedProp.required;
        const value = parsedProp.value;
        const description = parsedProp.description;
        const nameParts = paramName.split('.');

        const propertyDef = {
          subproperties: {},
          type,
          name: nameParts[nameParts.length - 1],
          required,
          description,
          value,
        };

        if (nameParts.length === 1) {
          methodDef.params.push(propertyDef);
        } else {
          let currentParam = methodDef.params.filter(paramDef => paramDef.name === nameParts[0])[0];
          for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
            currentParam = currentParam.subproperties[nameParts[i]];
          }
          if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
        }
        break;
      }
      case 'return':
      case 'returns': {
        const parsedProp = parseProperty(tag.details, true);
        const type = parsedProp.type;
        const paramName = parsedProp.name;
        const required = parsedProp.required;
        const value = parsedProp.value;
        const description = parsedProp.description;
        const chainable = (paramName === 'this');

        const nameParts = (paramName || '').split('.');

        const propertyDef = {
          subproperties: {},
          type,
          name: nameParts[nameParts.length - 1],
          required,
          description,
          value,
          chainable,
        };

        if (nameParts.length <= 1) {
          methodDef.returns = propertyDef;
        } else {
          let currentParam = methodDef.returns;
          for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
            currentParam = currentParam.subproperties[nameParts[i]];
          }
          if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
        }
        break;
      }
      default:
        console.log('ignore: ' + tag.tagName + ': ' + tag.details);
    }
  });

  if (methodDef.name) currentDef.methods.push(methodDef);
}

function processEventDef({ tags, name, docblock }, currentDef) {
  if (name === true) throw new Error('Missing method name in ' + docblock);
  const eventDef = {
    docblock,
    param: null,
    private: undefined,
    protected: undefined,
    name: name.trim(),
  };
  const hiddenTags = tags.filter(tag => ['hidden', 'hide', 'removed'].indexOf(tag.tagName) !== -1);
  if (hiddenTags.length) {
    return;
  }

  tags.forEach((tag) => {
    switch (tag.tagName) {
      case 'private':
        eventDef.private = true;
        eventDef.protected = false;
        break;
      case 'protected':
        eventDef.protected = true;
        eventDef.private = false;
        break;
      case 'event':
        break;
      case 'param': {
        let { type, name, required, value, description } = parseProperty(tag.details, false);

        const nameParts = name.split('.');

        const propertyDef = {
          subproperties: {},
          type,
          name: nameParts[nameParts.length - 1],
          required,
          description,
          value,
        };

        if (nameParts.length === 1) {
          eventDef.param = propertyDef;
        } else {
          let currentParam = eventDef.param;
          for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
            currentParam = currentParam.subproperties[nameParts[i]];
          }
          if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
        }
        break;
      }
      default:
        console.log('ignore: ' + tag.tagName + ': ' + tag.details);
    }
  });

  if (eventDef.name) currentDef.events.push(eventDef);
}

function processFile(file, defs, grunt) {
  try {
    const contents = grunt.file.read(file);

    const docblocks = contents.match(/\/\*\*[\s\S]+?\*\//gm);
    if (!docblocks) return;
    let className;
    let currentDef;
    docblocks.forEach((docblock, index) => {
      const classNameMatch = docblock.match(/\*\s+@class\s+(\S+)/m);
      if (classNameMatch) {
        className = classNameMatch[1];
        if (!defs[className]) {
          defs[className] = {
            docblock: '',
            extends: '',
            mixins: [],
            properties: [],
            methods: [],
            staticProperties: [],
            staticMethods: [],
            events: [],
            private: false,
            singelton: false,
            abstract: false,
            name: className,
          };
        }
        currentDef = defs[className];
      } else if (!currentDef) {
        return;
      }
      try {
        const tagStrList = docblock.match(/\*\s+@(\S+)([^\n]*)$/mg);
        const tagsObj = { docblock, tags: [] };
        if (!tagStrList) throw new Error('Empty docblock not allowed!');
        tagStrList.forEach((tag) => {
          const newLineIndex = tag.indexOf('\n');
          if (newLineIndex !== -1) {
            tag = tag.substring(0, newLineIndex);
          }
          try {
            let tagName, details;
            const matches = tag.match(/@(\S+)(\s+\S.*)?$/);
            if (matches) {
              tagName = matches[1];
              if (matches[2]) {
                details = matches[2].replace(/^\s*/, '');
              } else {
                details = true;
              }
            }

            tagsObj.tags.push({ tagName, details });
            if (tagName === 'class') {
              tagsObj.class = details;
            } else if (tagName === 'method') {
              tagsObj.method = true;
              tagsObj.name = details;
            } else if (tagName === 'property') {
              tagsObj.property = true;
              tagsObj.name = details;
            } else if (tagName === 'type') {
              tagsObj.property = true;
              tagsObj.name = details;
            } else if (tagName === 'event') {
              tagsObj.event = true;
              tagsObj.name = details;
            }
          } catch (e) {
            console.error('Error processing File ' + file + ', tag: ' + tag);
            throw e;
          }
        });

        if (!currentDef) console.error("No currentDef for " + docblock);

        if (tagsObj.class) {
          processClassDef(tagsObj, currentDef);
        } else if (tagsObj.method) {
          processMethodDef(tagsObj, currentDef);
        } else if (tagsObj.property) {
          processPropertyDef(tagsObj, currentDef);
        } else if (tagsObj.event) {
          processEventDef(tagsObj, currentDef);
        }
      } catch (e) {
        console.error('Error processing File ' + file + ', docblock: ' + docblock);
        throw e;
      }
    });
  } catch (e) {
    console.error(file + ': ', e);
    throw e;
  }
}

module.exports = (grunt, files, destFile) => {

  const defs = {};
  try {
    files.forEach((file) => {
      processFile(file, defs, grunt);
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
  grunt.file.write(destFile, JSON.stringify(defs, null, 4));
  console.log('Wrote ' + destFile);
};
