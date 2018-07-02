/**
 * Import the jsdoc JSON representation and generate typescript from it
 */

// TODO: Adaptors????
// TODO: Any string that is one of a set of options can be defined with `type ReadStatus = "ALL" | "SOME" | "NONE";`
let grunt;
let interfaceIndex = 0;

const unknownTypes = ['Audio', 'Video', 'Canvas'];
const StandardEventMethodNames = ['on', 'once', 'trigger', '_triggerAsync'];

/**
 * Given a requested type name such as `Layer.Core.Client` or `String[]` or `Layer.UI.components.ComposeBar` or `WebSocket`:
 *
 * 1. Generate `import` commands as needed; these imports have the form `import LayerCoreClient from './client'`
 *    so `Layer.Core.Client` now has a type name of `LayerCoreClient`
 * 2. Don't generate `import` commands if its already been imported or is not a Layer class
 */
function setupType(classTypescriptData, fullType) {
  const { classDef, typeSet, imports, interfaces, allClasses } = classTypescriptData;

  // JSDuck Mixed maps to Typescript any
  if (fullType === 'Mixed') {
    return 'any';
  } else if (fullType === 'Mixed[]') {
    return 'any[]';
  }

  // If there are multiple possible types, we'll need to call setupType on each one of them
  // and then return the resulting type names as  `name1 | name2 | name3...` list
  const multipleTypes = fullType.indexOf('|') !== -1;
  if (multipleTypes) {
    const types = fullType.split(/\s*\|\s*/);
    return types.map(type => setupType(classTypescriptData, type)).join(' | ');
  }

  // If its an array type, flag that its an array type and then remove that flag from the type name we're going to process.
  const isArrayType = fullType.match(/\[\]/);
  if (isArrayType) fullType = fullType.replace(/\[\]/, '');

  // If its a Generic type,  flag that its a generic, and process the inner generic type (setting up any imports needed for it)
  const genericMatches = fullType.match(/^[a-zA-Z0-9_]+<(.*)>$/);
  const isGenericType = Boolean(genericMatches);
  let genericType;
  if (isGenericType) {
    genericType = setupType(classTypescriptData, genericMatches[1]);
    fullType = fullType.replace(/<.*$/, ''); // remove the generic type from the full type; we'll process them separately
  }

  // Map the type to something useful, and generate imports if needed
  let type = fullType;
  try {
    // If this class has already been imported, just reuse the name it was imported into.
    if (typeSet[type]) {
      type = typeSet[type];
    }

    // If its a Layer class, then we should care about it:
    else if (type.indexOf('Layer.') === 0) {
      // If its not a Layer Class we have a definition for, just use `any`
      if (!allClasses[type]) {
        type = 'any';
        typeSet[fullType] = type;
      }

      // Else we have a definition for this class; generate an import to bring that class definition into the typescript file
      else {
        type = type.replace(/\./g, '');
        typeSet[fullType] = type;
        imports.push(`import ${type} from '${generatePathFromAtoB(classDef, allClasses[fullType])}';`);
      }
    }

    // There are some standard types that Typescript should but does not understand; generate interfaces for them
    else if (unknownTypes.indexOf(fullType) !== -1) {
      interfaces.push(`interface ${fullType} { [index: string]: any; }`);
    }

    // Now that we've finished processing the type info, reassemble any array or generic structures and then return the resulting type name
    if (isArrayType) type = type + '[]';
    if (isGenericType) type = type + '<' + genericType + '>';
    return type;
  } catch (e) {
    console.error('failed to setup ' + JSON.stringify(fullType) + '  ', e);
    throw e;
  }
}

/**
 * Iterate over every method of the class and of its mixins, generating method declarations for this class,
 * as well as any interfaces and imports they may need.
 */
function processMethods(classTypescriptData, processedMixins = {}, addedMethods = {}) {
  const { classDef, allClasses } = classTypescriptData;
  classDef.methods.forEach((methodDef) => {
    if (addedMethods[methodDef.name]) return;
    const methodName = processMethod(classTypescriptData, methodDef);
    addedMethods[methodName] = true;
  });
  classDef.mixins.forEach((mixinClassDefName) => {
    const mixinClassDef = allClasses[mixinClassDefName];
    if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
      processedMixins[mixinClassDef.name] = true;
      processMethods(Object.assign({}, classTypescriptData, { classDef: mixinClassDef }),
        processedMixins, addedMethods);
    }
  });
}

/**
 * Add a method definition to our typescript file, with all necessary interfaces, imports and method declarations.
 *
 * Return the method name so we can be sure not to add the same name multiple times.
 */
function processMethod(classTypescriptData, methodDef) {
  const { classDef, lines, allClasses } = classTypescriptData;

  try {
    let returnType;
    switch (methodDef.instructions) {
      case 'private':
        methodDef.private = true;
        methodDef.protected = false;
        break;
      case 'protected':
        methodDef.protected = true;
        methodDef.private = false;
        break;
      case 'public':
        methodDef.protected = false;
        methodDef.private = false;
        break;
    }


    // If the method is one of our Root Class event handling methods, those will be processed in processAllEvents; so skip them
    if (StandardEventMethodNames.indexOf(methodDef.name) !== -1 && isRootClass(classDef, allClasses)) {
      return;
    }

    // If there is no returns definition, then use `void`
    if (!methodDef.returns) {
      returnType = 'void';
    }

    // If the return name is `this` use the current class name
    else if (methodDef.returns.name === 'this') {
      returnType = classDef.name.replace(/^.*\./, '');
    }

    // Else get a proper type name, and generate any imports that are needed
    else {
      returnType = setupType(classTypescriptData, methodDef.returns.type);
    }

    // For each parameter gather the type name to use, and generate any Interfaces needed for it
    const params = methodDef.params.map((paramDef) => {
      let type = setupType(classTypescriptData, paramDef.type);
      type = setupInterfaceIfNeeded(classTypescriptData, type, paramDef);
      type = setupFunctionIfNeeded(classTypescriptData, type, paramDef);
      return `${paramDef.name}${paramDef.required ? '' : '?'}: ${type}`;
    });

    // Determine if the method is public/private/protected; for mixins we don't declare this... though we will need to review that so that once mixed in its public/private/protected.
    let declarationType = 'public';
    if (methodDef.private) declarationType = 'private';
    if (methodDef.protected) declarationType = 'protected';
    if (classDef.isMixin) declarationType = '';

    // Generate the method definition
    lines.push(`
      ${methodDef.docblock.split(/\n\s*/).join('\n    ')}
      ${declarationType} ${methodDef.static ? 'static ' : ''}${methodDef.name}(${params.join(', ')})${methodDef.name === 'constructor' ? '' : ': ' + returnType};
    `);
    return methodDef.name;
  } catch (e) {
    console.error('Failed to setup method ', JSON.stringify(methodDef), e);
    throw e;
  }
}

/**
 * If a property or parameter is a function, generate an inteface to represent that Function and return the interface name.
 * Generates an interface of the form:
 *
 * ```
 * interface AFunc17 {
 *   (conversation: LayerCoreConversation): boolean
 * }
 * ```
 *
 * which can then be used in the class definition as:
 *
 * ```
 * declare class MyClass {
 *    myFunc: AFunc17, // A property that is a function
 *
 *    myMethod("call-this", callback: AFunc17): void; // A parameter that is a function
 * }
 * ```
 */
function setupFunctionIfNeeded(classTypescriptData, type, propDef) {
  const { interfaces } = classTypescriptData;
  let returnDef;
  let returnType;

  // If the property/parameter is not a Function then its not our problem. Shoot it back at the caller.
  if (type !== 'Function') return type;

  // Generate a unique interface name for the Function, and start defining the interface.
  const interfaceName = 'AFunc' + interfaceIndex++;
  const interfaceLines = [
    `interface ${interfaceName} {`,
  ];

  // The propDef that is a Function will have subproperties that are its parameters and/or its return type;
  // process each one of them.
  const funcDefParts = Object.keys(propDef.subproperties).map((subPropertyName) => {
    // If the subproperty's name is 'return' then its a return type, setup the function's return type,
    // generating any interfaces, imports, etc... that are needed for it.
    if (subPropertyName === 'return') {
      returnDef = propDef.subproperties[subPropertyName];
      returnType = setupType(classTypescriptData, returnDef.type);
      returnType = setupInterfaceIfNeeded(classTypescriptData, returnType, returnDef);
      return null;
    }

    // Else the subproperty is a parameter of our function, gather the parameter name and type, generating any imports and interfaces needed
    else {
      const subPropDef = propDef.subproperties[subPropertyName];
      let subType = setupType(classTypescriptData, subPropDef.type);
      subType = setupInterfaceIfNeeded(classTypescriptData, subType, subPropDef);
      return subPropertyName + ': ' + subType;
    }
  }).filter(value => value);

  // Generate the Function Interface Definition
  interfaceLines.push(`    (${funcDefParts.join(', ')}): ${returnType || 'void'}`);
  interfaceLines.push('}');
  interfaces.push(interfaceLines.join('\n'));

  // Return the interface name to be used in defining that Function property/parameter
  return interfaceName;
}

/**
 * If the given type requires an Interface to be defined for it, call generateInterface() and return the resulting type.
 * If the given type is best represented by some other type return the preferred type name.
 *
 * return the type name to be used (either the original type or the generated interface name)
 */
function setupInterfaceIfNeeded(classTypescriptData, type, propDef) {
  if (type === 'Mixed') return 'any';
  if (type === 'Object' || type === 'Event') {
    if (Object.keys(propDef.subproperties).length) {
      type = generateInterface(classTypescriptData, propDef);
    } else if (type === 'Object') {
      type = 'AnObject';
    }
  }
  return type;
}

/**
 * Any property or parameter that is an object with known subproperties needs an interface defined that specifies what those subproperties are.
 * If subproperties have their own subproperties, then additional interfaces need to be generated.
 *
 * Return the interface name that represents the specified propDef.
 */
function generateInterface(classTypescriptData, propDef) {
  const { interfaces } = classTypescriptData;
  try {

    // Generate a unique interface name
    const interfaceName = 'AnInterface' + interfaceIndex++;

    // Generate the start of the interface definition
    const interfaceLines = [`interface ${interfaceName} {`];

    // For each subproperty, add it as a property to the interface
    Object.keys(propDef.subproperties).forEach((subPropDefName) => {
      const subPropDef = propDef.subproperties[subPropDefName];

      // Get the type name (generating any necessary immports)
      let type = setupType(classTypescriptData, subPropDef.type);

      if (type === 'Object' || type === 'Event') {
        // If the resulting type is an Object or Event and it has subproperties, recursively call generateInterface on this subproperty
        if (Object.keys(subPropDef.subproperties).length) {
          type = generateInterface(classTypescriptData, subPropDef);
        }

        // If its just an Object without any properties specified use the generic `AnObject` defined elsewhere.
        else if (type === 'Object') {
          type = 'AnObject';
        }
      }

      // Add the property name and type to the interface definition
      interfaceLines.push(`    ${subPropDef.name}: ${type};`);
    });
    interfaceLines.push('}');

    interfaces.push(interfaceLines.join('\n'));
    return interfaceName;
  } catch (e) {
    console.error('Failed to generate ' + propDef.name, e);
    throw e;
  }
}

/**
 * Iterate over every property in the class definition and its mixin definitions calling processProperty,
 * adding each property to the typescript definition.
 */
function processProperties(classTypescriptData, processedMixins = {}, addedProps = {}) {
  const { classDef, allClasses } = classTypescriptData;

  // Process each property
  classDef.properties.forEach((propDef) => {
    if (addedProps[propDef.name]) return;
    const addedProp = processProperty(classTypescriptData, propDef);
    if (addedProp) addedProps[addedProp] = true;
  });

  // Call processProperties on each mixin; avoid redefining properties or reprocessing mixins that are already part of the class.
  classDef.mixins.forEach((mixinClassDefName) => {
    const mixinClassDef = allClasses[mixinClassDefName];
    if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
      processedMixins[mixinClassDef.name] = true;
      processProperties(Object.assign({}, classTypescriptData, { classDef: mixinClassDef }),
        processedMixins, addedProps);
    }
  });
}

/**
 * Add a property to the typescript class, doing any neccessary imports needed to achieve that.
 */
function processProperty(classTypescriptData, propDef) {
  const { classDef, lines } = classTypescriptData;
  try {
    switch (propDef.instructions) {
      case 'private':
        propDef.private = true;
        propDef.protected = false;
        break;
      case 'protected':
        propDef.protected = true;
        propDef.private = false;
        break;
      case 'public':
        propDef.protected = false;
        propDef.private = false;
        break;
    }


    // Get the locally defined name for the type, which may be of the form `LayerCoreRoot` based on an import of `import LayerCoreRoot from './root'`
    let type = setupType(classTypescriptData, propDef.type);

    // Determine if the property is public/private/protected or left unset if its treated as an Interface
    // TODO: Properties are being copied in from Mixins so we probably can leave them as public/private/protected as long as we don't every try to use the Interface;
    // TODO: Don't generate the interface typescript files for Mixins, simply generate nothing.
    let declarationType = 'public';
    if (propDef.private) declarationType = 'private';
    if (propDef.protected) declarationType = 'protected';
    if (classDef.isMixin) declarationType = '';

    // Does our type need an interface generated for it? If so, get the type name for that Interface.
    type = setupInterfaceIfNeeded(classTypescriptData, type, propDef);

    // If the property is a Function, setup an interface for its parameters and return type, and get back the Function Interface name
    type = setupFunctionIfNeeded(classTypescriptData, type, propDef);

    // Add the property definition to the typescript class
    lines.push(`    ${propDef.docblock.split(/\n\s*/).join('\n    ')}\n    ${declarationType} ${propDef.static ? 'static ' : ''}${propDef.readonly ? 'readonly ' : ''}${propDef.name}: ${type};\n`);

    // Return the property name so we know that this name is now part of the class definition.
    return propDef.name;
  } catch (e) {
    console.error('Failed to process property', propDef, e);
    throw e;
  }
}

/**
 * Given a class definition and the full set of classes, determine if this class is a subclass of Layer.Core.Root.
 */
function isRootClass(classDef, allClasses) {
  if (classDef.name === 'Layer.Core.Root') return true;
  if (classDef.extends && allClasses[classDef.extends]) return isRootClass(allClasses[classDef.extends], allClasses);
  return false;
}

/**
 * For every event defined for this class... and **only** if this is a subclass of Root, add suitable definitions of
 * the `on`, `once`, `trigger` and `_triggerAsync` methods that explicitly define what event names are acceptable.
 */
function processAllEvents(classTypescriptData, processedMixins = {}) {
  const { classDef, allClasses, typeSet, imports, lines } = classTypescriptData;

  // For subclasses of Layer.Core.Root  that have events ONLY:
  if (!classDef.events || !isRootClass(classDef, allClasses)) return;

  // Gather all supported event names
  const events = [];
  classDef.events.forEach(eventDef => events.push(eventDef.name));

  // For each mixin of this class, gather its events too.
  // Use processedMixins to insure that a mixin does not get processed multiple times.
  classDef.mixins.forEach((mixinClassDefName) => {
    const mixinClassDef = allClasses[mixinClassDefName];
    if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
      processedMixins[mixinClassDef.name] = true;
      processAllEvents(classTypescriptData, processedMixins);
    }
  });

  // No events? Nothing to do here.
  if (!events.length) return;

  // Currently on and once methods must export LayerCoreRoot instead of classDef.name due to how typescript understands inheritance;
  // make sure that we have LayerCoreRoot imported.
  if (!typeSet['Layer.Core.Root']) {
    typeSet['Layer.Core.Root'] = 'LayerCoreRoot';
    imports.push(`import LayerCoreRoot from '${generatePathFromAtoB(classDef, { path: 'core/root' })}';`);
  }

  // The trigger method requies the LayerEvent definition; import it.
  if (!typeSet['Layer.Core.LayerEvent']) {
    typeSet['Layer.Core.LayerEvent'] = 'LayerCoreLayerEvent';
    imports.push(`import LayerCoreLayerEvent from '${generatePathFromAtoB(classDef, { path: 'core/layer-event' })}';`);
  }

  // Define event methods for each event name
  classDef.events.forEach((eventDef) => {
    const eventName = eventDef.name;
    lines.push(`    ${eventDef.docblock}`);
    lines.push(`    public on(eventName: "${eventName}", handler: Function, context?: AnObject): LayerCoreRoot;`);
    lines.push(`    public once(eventName: "${eventName}", handler: Function, context?: AnObject): LayerCoreRoot;`);
    lines.push(`    public trigger(eventName: "${eventName}", data?: any): LayerCoreLayerEvent;`);
    lines.push(`    private _triggerAsync(eventName: "${eventName}", data?: any): void;`);
    lines.push('');
  });
}

/**
 * Import every class that is part of this class' namespace into the typescript definition file for it.
 * This is only done if the class definition documentation block uses the `@typescript importnamespace` directive.
 *
 * Adding it to the namespace means `this.SubClassName1` and `this.SubClassName2` will all be properties
 */
function importNamespace(classTypescriptData) {
  const { classDef, allClasses, typeSet, lines, imports } = classTypescriptData;
console.log("IMPORTING NAMESPACE");
  // Gather all the names that are within this class' namespace
  const name = classDef.name;
  const childNames = Object.keys(allClasses).filter(className =>
    className.indexOf(name + '.') === 0 && className.substring(name.length + 1).indexOf('.') === -1);

  // For each class name, generate an import for it (if one hasn't already been setup for it)
  childNames.forEach((className) => {
    console.log("IMPORT " + className);
    let type;
    if (typeSet[className]) {
      type = typeSet[className];
    } else {
      type = className.replace(/\./g, '');
      typeSet[className] = type;
      imports.push(`import ${type} from './${generatePathFromAtoB(classDef, allClasses[className])}';`);
    }
    lines.push(`    ${className.substring(className.lastIndexOf('.') + 1)}: ${type};`);
  });
}

/**
 * Given a Class Definition A that needs to import Class Definition B, return the path needed by an `import` to get from one to the other.
 */
function generatePathFromAtoB(classDefA, classDefB) {
  const pathA = classDefA.path.indexOf('/') === -1 ? '' : classDefA.path.replace(/\/[^\/]*?$/, '');
  const pathB = classDefB.path.replace(/\.js$/, '');
  const pathToRoot = pathA.length === 0 ? '.' : pathA.replace(/[^/]*\.js/, '').split('/').map(item => '..').join('/');
  return pathToRoot + '/' + pathB;
}

/**
 * Generate a typescript.d.ts file for each class definition
 */
function processClass(name, allClasses, destFolder) {
  const classDef = allClasses[name];
  const classParts = name.split('.');
  const className = classParts[classParts.length - 1];
  const extendsParts = (classDef.extends || '').split('.');
  const extendsClassName = extendsParts[extendsParts.length - 1] || '';
  const imports = [`import { AnObject, CustomHTMLElement } from '${generatePathFromAtoB(classDef, { path: 'misc' })}';`];
  const lines = [];
  const interfaces = [];

  const typeSet = {
    [name]: className,
  };

  const classTypescriptData = {
    classDef,
    lines,
    imports,
    typeSet,
    interfaces,
    allClasses,
  };

  if (extendsClassName && classDef.extends.indexOf('Layer.') === 0) {
    imports.push(`import ${extendsClassName} from '${generatePathFromAtoB(classDef, allClasses[classDef.extends])}';`);
  }

  // Could add the following, but it causes problems:
  // {classDef.mixins.length ? 'implements ' + classDef.mixins.map(nextClassName => setupType(classTypescriptData, nextClassName)).join(', ') + ' ' : ''} {`);
  lines.push(`${classDef.docblock}\nexport default ${classDef.abstract ? 'abstract ' : ''}${classDef.isMixin ? 'interface' : 'class'} ${className} ${extendsClassName ? 'extends ' + extendsClassName : ''} {`);

  processAllEvents(classTypescriptData);

  processProperties(classTypescriptData);
  processMethods(classTypescriptData);

  // Handle any custom `@typescript SomeInstruction` instruction on the Class definition documentation block
  switch ((classDef.instructions || '').replace(/\s+.*/, '')) {
    case 'importnamespace':
      importNamespace(classTypescriptData);
      break;
  }


  // DONE...
  lines.push('}');
  const destFile = destFolder + '/' + classDef.path.replace(/\.js/, '.d.ts');
  console.log('Writing ' + destFile);
  grunt.file.write(destFile, imports.join('\n') + '\n\n' + interfaces.join('\n') + '\n\n' + lines.join('\n'));
}

/**
 * Process duck.json into typescript definitions by iterating over every class definition and processing that class.
 */
function processFile(allClasses, destFolder) {
  // Process all classes in  duck.json, but do the classes like "Layer.Core" before "Layer.Core.Client" before "Layer.Core.Client.Blah"
  const classNameList = Object.keys(allClasses).sort((a, b) => {
    if (a.toLowerCase() > b.toLowerCase()) return 1;
    if (a.toLowerCase() < b.toLowerCase()) return -1;
    return 0;
  });

  // Using `@typescript ismixin` directive, setup classDef.isMixin on every class definition
  classNameList.forEach((name) => {
    const classDef = allClasses[name];
    if (classDef.instructions === 'ismixin') classDef.isMixin = true;
  });

  // Process every class into typescript definitions
  classNameList.forEach(name => processClass(name, allClasses, destFolder));
}


module.exports = (gruntIn, files, destFolder) => {
  grunt = gruntIn;
  // Note, typically there is only a single file: duck.json
  files.forEach((file) => {
    const contents = grunt.file.read(file);
    processFile(JSON.parse(contents), destFolder);
  });

  // Standard utilities file to import into all typescript files
  grunt.file.write(destFolder + '/misc.d.ts', `
export interface AnObject { [index: string]: any; }
export class CustomHTMLElement {
  classList: DOMTokenList;
  parentNode: HTMLElement;
  childNodes: NodeList;
  querySelector(search: string): HTMLElement;
  querySelectorAll(search: string): HTMLElement
}
`);
};
