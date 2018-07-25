/*
 * Generate a JSON file that represents all classes, methods, properties and events that are documented in JSDuck.
 *
 * Input is an array of javascript files to be processed.
 */

let grunt;
let classDefinitions = {};
let currentClassDefinition;

/**
 * Parse the tags for a class definition documentation block and setup the class definition
 */
function processClassDef({ tags, docblock }, code, file) {
  currentClassDefinition.docblock = docblock;
  let isExtendedDefinition = false;
  tags.forEach((tag) => {
    switch (tag.tagName) {
      case 'extends':
        currentClassDefinition.extends = tag.details;
        break;
      case 'private':
        currentClassDefinition.private = tag.details;
        break;

      case 'singelton':
        currentClassDefinition.singelton = tag.details;
        break;

      case 'mixin':
        currentClassDefinition.mixins.push(tag.details);
        break;
      case 'abstract':
        currentClassDefinition.abstract = true;
        break;
      case 'typescript':
        currentClassDefinition.instructions = tag.details;
        switch (tag.details) {
          case 'ignore':
            delete classDefinitions[currentClassDefinition.name];
            break;
          case 'extendclass':
            isExtendedDefinition = true;
            break;
        }
        break;
    }
  });

  const uiComponentName = code.match(/registerComponent\('(.*?)'/m);
  if (uiComponentName && uiComponentName[1]) {
    currentClassDefinition.uiClassName = uiComponentName[1];
  } else {
    currentClassDefinition.uiClassName = '';
  }

  if (!currentClassDefinition.path && !isExtendedDefinition) {
    currentClassDefinition.path = file.replace(/src\//, '');
  }
}

/**
 * Parse a single entry that comes after the tag for a property:
 *
 * `{String} propertyName1 This is a really good property`
 * `{Layer.Core.Client} options.client`
 * `{Number} [count=10]`
 * `{Layer.Core.DbManager} [dbManager] An optional manager`
 *
 * These two may show up for `@returns`:
 * `{String}`
 * `this`
 */
function parseProperty(propertyDef, isReturn) {
  // {(.*?)}: Get the type
  // \[(.+?)(=.*)?\]: If its an optional param, get its name and if provided, its default value.
  // (\s+.*)?: Get the optional description
  let tagMatches = propertyDef.match(/^{(.*?)}\s+\[(.+?)(=.*)?\](\s+.*)?$/);

  let type;
  let name;
  let required = true;
  let value;
  let description;

  try {
    // If the tagMatches worked, then its an optional property; setup its definition values.
    if (tagMatches) {
      type = tagMatches[1];
      required = false;
      name = tagMatches[2];
      value = (tagMatches[3] || '').substring(1);
      description = tagMatches[4] || '';
    }

    else if (isReturn) {
      const thisMatch = propertyDef.match(/^({.*?}\s+)?this\s*(.*)/);

      // If its a @returns definition whose name is "this", directly record its name as "this"
      if (thisMatch) {
        name = 'this';
        description = thisMatch[2];
      }

      // If its a @returns definition with only a type, record its type
      else if (propertyDef.match(/{.*?}\s*$/)) {
        type = propertyDef.match(/{(.*?)}\s*$/)[1];
      }

      // If its a returns statement whose name starts with "return.", capture its type, full name and description
      else {
        tagMatches = propertyDef.match(/^{(.*?)}\s*(returns?\.\S+)?(\s+.*)?$/);
        type = tagMatches[1];
        name = tagMatches[2] || '';
        description = tagMatches[3];
      }
    }

    // Its not a @return, and does not match the optional property template; its a required property.
    else {
      tagMatches = propertyDef.match(/^{(.*?)}\s*(\S+)(\s+.*)?$/);
      if (!tagMatches) throw new Error('Could not process ' + propertyDef);
      type = tagMatches[1];
      name = tagMatches[2];
      description = tagMatches[4] || '';
    }

    // Use lower case primitive types that Typescript favors, and cast any default values to the proper types
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
        if (typeof value !== 'boolean') value = value === 'true';
        break;
    }

    description = (description || '').trim().replace(/^[\s\-]*/, '');

    return { type, name, required, value, description };
  } catch (e) {
    console.error('Failed to parse\n> ' + propertyDef, '\n', e);
    throw e;
  }
}

/**
 * Given a `@property` tag for a property definition, make some sense out of it and add it to the property definition.
 */
function parsePropertyTag(options) {
  const { tag, propertyDef } = options;

  // Extract the type, default value, name, description, and "isRequied" from the @property tag
  const result = parseProperty(tag.details, false);
  const { type, required, value } = result;
  let { name, description } = result;

  // If we are in the middle of parsing a function and its parameters, append the function name to the actual name
  if (tag.tagName === 'param' && options.funcName) {
    name = options.funcName + '.' + name;
  }

  // Strip out any leading spaces and "-" chars from the description
  description = (description || '').trim().replace(/^[\s\-]*/, '');

  // If the name has only one part, we can directly setup the property defintion with what we've found.
  if (name.indexOf('.') === -1) {
    propertyDef.type = type;
    propertyDef.required = required;
    propertyDef.name = name;
    propertyDef.value = value;
    propertyDef.description = description;

    // Underscore names are flagged as private
    if (propertyDef.private === undefined && propertyDef.protected === undefined) {
      propertyDef.private = name.indexOf('_') === 0;
    }

    // If we don't have a name, we're kind of screwed and this property definition will be lost
    if (propertyDef.name) currentClassDefinition.properties.push(propertyDef);

    // If this property is a function, set it as the function we are currently parsing
    if (type === 'Function') {
      options.funcName = name;
    }
  }

  // Else this is a "propName.subpropName" pattern; add the subpropName into the subproperties object
  else {
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
}

/**
 * Given an array of tags (from the tagsObj, in turn generated from the docblock),
 * setup the current documentation block's property definition.
 */
function processPropertyDef({ tags, docblock }) {
  const propertyDef = {
    docblock,
    subproperties: {},
    type: '',
    private: false,
    protected: false,
    name: '',
    static: false,
    readonly: false,
    abstract: false,
    required: false,
    description: '',
    value: null,
    deprecated: false,
  };

  // Do not add any property that has the following tag names:
  const hiddenTags = tags.filter(tag => ['hidden', 'hide', 'removed', 'ignore'].indexOf(tag.tagName) !== -1);
  if (hiddenTags.length) return;

  // Process each tag name that shows in a property definition
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
      case 'typescript':
        propertyDef.instructions = tag.details;
        break;
      case 'param':
      case 'property': {
        const options = { tag, propertyDef, funcName };
        parsePropertyTag(options);
        funcName = options.funcName;
        break;
      }
      case 'abstract':
        propertyDef.abstract = true;
        break;
      case 'deprecated':
        propertyDef.deprecated = true;
        break;
      case 'inheritdoc':
      case 'fires':
      case 'link':
      case 'experimental':
        break;
      default:
        console.log('ignore property: ' + tag.tagName + ': ' + tag.details + '\n' + docblock + '\n');
    }
  });
}

/**
 * Given a `@returns` tag for a method definition, make some sense out of it and add it to the method definition.
 */
function parseMethodReturns({ tag, methodDef }) {
  const { type, name, required, value, description } = parseProperty(tag.details, true);
  const chainable = (name === 'this');
  const nameParts = (name || '').split('.');

  const propertyDef = {
    subproperties: {},
    type,
    name: nameParts[nameParts.length - 1],
    required,
    description,
    value,
    chainable,
  };

  // If there is no name or the name is just "return" or "blah" write it to methodDef.returns
  if (nameParts.length <= 1) {
    methodDef.returns = propertyDef;
  }

  // If the name has multiple parts, dig through methodDef.returns and insert it into its subproperties
  else {
    let currentParam = methodDef.returns;
    for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
      currentParam = currentParam.subproperties[nameParts[i]];
    }
    if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
  }
}

/**
 * Given a `@param` tag for a method definition, make some sense out of it and add it to the method definition.
 */
function parseMethodParam({ tag, methodDef }) {
  const { type, name, required, value, description } = parseProperty(tag.details, false);
  const nameParts = name.split('.');

  const propertyDef = {
    subproperties: {},
    type,
    name: nameParts[nameParts.length - 1],
    required,
    description,
    value,
  };

  // If the parameter name has a single part "myCounter" simply push it into the params array
  if (nameParts.length === 1) {
    methodDef.params.push(propertyDef);
  }

  // Else the param is something like "options.myCounter"; find the parent params object and add this to its subproperties
  else {
    let currentParam = methodDef.params.filter(paramDef => paramDef.name === nameParts[0])[0];
    for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
      currentParam = currentParam.subproperties[nameParts[i]];
    }
    if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
  }
}

/**
 * Given an array of tags (from the tagsObj, in turn generated from the docblock),
 * setup the current documentation block's method definition.
 */
function processMethodDef({ tags, name, docblock }) {
  if (name === true) throw new Error('Missing method name in ' + docblock);
  const methodDef = {
    docblock,
    returns: null,
    params: [],
    name: name.trim(),
    description: '',
    static: false,
    private: name.indexOf('_') === 0,
    protected: false,
    abstract: false,
    deprecated: false,
  };

  // Do not generate anything for a docblock containing any of the following tagNames
  const hiddenTags = tags.filter(tag => ['hidden', 'hide', 'removed', 'ignore'].indexOf(tag.tagName) !== -1);
  if (hiddenTags.length) {
    return;
  }

  // Handle each tag name that is applied to the method definition
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
      case 'param':
        parseMethodParam({ tag, methodDef });
        break;
      case 'return':
      case 'returns':
        parseMethodReturns({ tag, methodDef });
        break;
      case 'typescript':
        methodDef.instructions = tag.details;
        break;
      case 'deprecated':
        methodDef.deprecated = true;
        break;
      case 'inheritdoc':
      case 'fires':
      case 'link':
      case 'experimental':
        break;
      default:
        console.log('ignore method: ' + tag.tagName + ': ' + tag.details);
    }
  });

  if (methodDef.name) currentClassDefinition.methods.push(methodDef);
}

/**
 * Given a `@param` tag for an event definition, make some sense out of it and add it to the event definition.
 */
function parseEventParam({ tag, eventDef }) {
  const { type, name, required, value, description } = parseProperty(tag, false);

  const nameParts = name.split('.');

  const propertyDef = {
    subproperties: {},
    type,
    name: nameParts[nameParts.length - 1],
    required,
    description,
    value,
  };

  // If the name has only one part "frodo" then set it as the event's single parameter
  if (nameParts.length === 1) {
    eventDef.param = propertyDef;
  }

  // If the event has multiple parts "frodo.age", "frodo.race", find the parent parameter definition
  // and add this to its subproperties.
  else {
    let currentParam = eventDef.param;
    for (let i = 1; currentParam && i < nameParts.length - 1; i++) {
      currentParam = currentParam.subproperties[nameParts[i]];
    }
    if (currentParam) currentParam.subproperties[propertyDef.name] = propertyDef;
  }
}

/**
 * Given an array of tags (from the tagsObj, in turn generated from the docblock),
 * setup the current documentation block's event definition.
 */
function processEventDef({ tags, name, docblock }) {
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
      case 'param':
        parseEventParam({ tag: tag.details, eventDef });
        break;
      case 'experimental':
      case 'link':
      case 'inheritdoc':
      case 'fires':
        break;
      default:
        console.log(`ignore event: ${tag.tagName}: ${tag.details}\n${docblock}\n`);
    }
  });

  if (eventDef.name) currentClassDefinition.events.push(eventDef);
}

/**
 * Given a documentation block, determine if it defines a class, and if so,
 * setup (or reuse) and return a class definition for that class
 */
function parseClassDefFromDocblock(file, docblock) {
  let classDef;
  const classNameMatch = docblock.match(/\*\s+@class\s+(\S+)/m);
  if (classNameMatch) {
    const className = classNameMatch[1];
    if (!classDefinitions[className]) {
      classDefinitions[className] = {
        path: '',
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
    classDef = classDefinitions[className];
  }
  return classDef;
}

/**
 * For the current documentation block, find all of its tags and build and return a tagsObj to represent them.
 */
function parseDocblockTags(docblock) {
  const tagStrList = docblock.match(/\*\s+@(\S+)([^\n]*)$/mg);

  // The tags Object:
  const tagsObj = {
    docblock,
    tags: [],
    name: '',
    method: false,
    class: false,
    event: false,
    property: false,
  };
  if (!tagStrList) throw new Error('Empty docblock not allowed!');
  tagStrList.forEach((tag) => {
    const newLineIndex = tag.indexOf('\n');
    if (newLineIndex !== -1) {
      tag = tag.substring(0, newLineIndex);
    }
    try {
      let tagName;
      let details;
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
      console.error('Error processing tag ' + tag);
      throw e;
    }
  });
  return tagsObj;
}

/**
 * For each file:
 *
 * 1. Extract all of the jsduck comments
 * 2. Identify what class is being parsed from its @class
 * 3. For each comment block, determine if its a class, method, property or event definition
 * 4. Process the comment block and generate definitions to match it
 */
function processFile(file) {
  try {
    const contents = grunt.file.read(file);

    const docblocks = contents.match(/\/\*\*[\s\S]+?\*\//gm);
    const code = contents.replace(/\/\*\*[\s\S]+?\*\//gm, '');
    if (!docblocks) return;
    currentClassDefinition = null;
    docblocks.forEach((docblock, index) => {
      const classDef = parseClassDefFromDocblock(file, docblock);
      if (classDef) {
        currentClassDefinition = classDef;
      } else if (!currentClassDefinition) {
        return;
      }
      try {
        // Parse the tags out of the current docblock
        const tagsObj = parseDocblockTags(docblock);
        if (!currentClassDefinition) console.error("No currentDef for " + docblock);

        // Process the tags as a class, method, property or event
        if (tagsObj.class) {
          processClassDef(tagsObj, code, file);
        } else if (tagsObj.method) {
          processMethodDef(tagsObj);
        } else if (tagsObj.event) {
          processEventDef(tagsObj);
        } else if (tagsObj.property) {
          processPropertyDef(tagsObj);
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

/*
 * Given access to the grunt instance, an array of files, and a JSON file to write to,
 * parse all the input files and output all classes, methods, properties and events found in each class.
 */
module.exports = (gruntIn, files, destFile) => {
  grunt = gruntIn;
  classDefinitions = {};
  try {
    files.forEach((file) => {
      processFile(file);
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
  grunt.file.write(destFile, JSON.stringify(classDefinitions, null, 4));
  console.log('Wrote ' + destFile);
};
