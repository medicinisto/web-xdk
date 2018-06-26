let interfaceIndex = 0;

const unknownTypes = ['Audio', 'Video', 'Canvas'];

function setupType(fullType, imports, typeSet, interfaces, structures) {
  if (fullType === 'Mixed') {
    return 'any';
  } else if (fullType === 'Mixed[]') {
    return 'any[]';
  }
  const multipleTypes = fullType.indexOf('|') !== -1;
  if (multipleTypes) {
    const types = fullType.split(/\s*\|\s*/);
    // Setup the imports for each of these...
    return types.map(type => setupType(type, imports, typeSet, interfaces, structures)).join(' | ');
  }
  const isArrayType = fullType.match(/\[\]/);
  if (isArrayType) fullType = fullType.replace(/\[\]/, '');
  const genericMatches = fullType.match(/^[a-zA-Z0-9_]+<(.*)>$/);
  const isGenericType = Boolean(genericMatches);
  let genericType;
  if (isGenericType) {
    genericType = setupType(genericMatches[1], imports, typeSet, interfaces, structures);
    fullType = fullType.replace(/<.*$/, '');
  }

  let type = fullType;
  try {
    if (typeSet[type]) {
      type = typeSet[type];
    } else if (type.indexOf('Layer.') === 0) {
      if (!structures[type]) {
        type = 'any';
        typeSet[fullType] = type;
      } else {
        type = type.replace(/\./g, '');
        typeSet[fullType] = type;
        imports.push(`import ${type} from './${fullType}';`);
      }
    } else if (unknownTypes.indexOf(fullType) !== -1) {
      interfaces.push(`interface ${fullType} { [index: string]: any; }`);
    }
    if (isArrayType) type = type + '[]';
    if (isGenericType) type = type + '<' + genericType + '>';
    return type;
  } catch (e) {
    console.error('failed to setup ' + JSON.stringify(fullType) + '  ', e);
    throw e;
  }
}

function processMethods(classDef, lines, imports, typeSet, interfaces, structures, processedMixins = {}, addedMethods = {}) {
  classDef.methods.forEach((methodDef) => {
    if (addedMethods[methodDef.name]) return;
    const methodName = processMethod(classDef, methodDef, lines, imports, typeSet, interfaces, structures);
    addedMethods[methodName] = true;
  });
  classDef.mixins.forEach((mixinClassDefName) => {
    const mixinClassDef = structures[mixinClassDefName];
    if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
      processedMixins[mixinClassDef.name] = true;
      processMethods(mixinClassDef, lines, imports, typeSet, interfaces, structures, processedMixins, addedMethods);
    }
  });
}

function processMethod(classDef, methodDef, lines, imports, typeSet, interfaces, structures) {
  try {
    let returnType;
    if ((methodDef.name === 'on' || methodDef.name === 'trigger' ||
      methodDef.name === '_triggerAsync') && classDef.name !== 'Layer.UI.Component') return;
    if (!methodDef.returns) {
      returnType = 'void';
    } else if (methodDef.returns.name === 'this') {
      returnType = classDef.name.replace(/^.*\./, '');
    } else {
      returnType = setupType(methodDef.returns.type, imports, typeSet, interfaces, structures);
    }
    const params = methodDef.params.map((paramDef) => {
      let type = setupType(paramDef.type, imports, typeSet, interfaces, structures);
      type = setupInterfaceIfNeeded(type, paramDef, imports, typeSet, interfaces, structures);
      type = setupFunctionIfNeeded(type, paramDef, imports, typeSet, interfaces, structures);
      return `${paramDef.name}${paramDef.required ? '' : '?'}: ${type}`;
    });

    let declarationType = 'public';
    if (methodDef.private) declarationType = 'private';
    if (methodDef.protected) declarationType = 'protected';
    if (classDef.isMixin) declarationType = '';

    lines.push(`    ${methodDef.docblock.split(/\n\s*/).join('\n    ')}\n    ${declarationType} ${methodDef.static ? 'static ' : ''}${methodDef.name}(${params.join(', ')})${methodDef.name === 'constructor' ? '' : ': ' + returnType};\n`);
    return methodDef.name;
  } catch (e) {
    console.error('Failed to setup method ', JSON.stringify(methodDef), e);
    throw e;
  }
}

function setupFunctionIfNeeded(type, propDef, imports, typeSet, interfaces, structures) {
  if (type === 'Function') {
    const interfaceName = 'AFunc' + interfaceIndex++;
    const interfaceLines = [
      `interface ${interfaceName} {`,
    ];
    let returnDef;
    let returnType;
    const funcDefParts = Object.keys(propDef.subproperties).map((subPropertyName) => {
      if (subPropertyName === 'return') {
        returnDef = propDef.subproperties[subPropertyName];
        returnType = setupType(returnDef.type, imports, typeSet, interfaces, structures);
        returnType = setupInterfaceIfNeeded(returnType, returnDef, imports, typeSet, interfaces, structures);
        return null;
      } else {
        const subPropDef = propDef.subproperties[subPropertyName];
        let subType = setupType(subPropDef.type, imports, typeSet, interfaces, structures);
        subType = setupInterfaceIfNeeded(subType, subPropDef, imports, typeSet, interfaces, structures);
        return subPropertyName + ': ' + subType;
      }
    }).filter(value => value);

    interfaceLines.push(`    (${funcDefParts.join(', ')}): ${returnType || 'void'}`);
    interfaceLines.push('}');
    interfaces.push(interfaceLines.join('\n'));
    return interfaceName;
  }
  return type;
}

function setupInterfaceIfNeeded(type, propDef, imports, typeSet, interfaces, structures) {
  if (type === 'Mixed') return 'any';
  if (type === 'Object' || type === 'Event') {
    if (Object.keys(propDef.subproperties).length) {
      type = generateInterface(propDef, imports, typeSet, interfaces, structures);
    } else if (type === 'Object') {
      type = 'AnObject';
    }
  }
  return type;
}

function generateInterface(propDef, imports, typeSet, interfaces, structures) {
  try {
    const interfaceName = 'AnInterface' + interfaceIndex++;
    const interfaceLines = [`interface ${interfaceName} {`];
    Object.keys(propDef.subproperties).forEach((subPropDefName) => {
      const subPropDef = propDef.subproperties[subPropDefName];
      let type = setupType(subPropDef.type, imports, typeSet, interfaces, structures);
      if (type === 'Object' || type === 'Event') {
        if (Object.keys(subPropDef.subproperties).length) {
          type = generateInterface(subPropDef, imports, typeSet, interfaces, structures);
        } else if (type === 'Object') {
          type = 'AnObject';
        }
      }
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


function processProperties(classDef, lines, imports, typeSet, interfaces, structures, hasEvents, processedMixins = {}, addedProps = {}) {

  classDef.properties.forEach((propDef) => {
    if (addedProps[propDef.name]) return;
    const addedProp = processProperty(classDef, propDef, lines, imports, typeSet, interfaces, structures, hasEvents);
    if (addedProp) addedProps[addedProp] = true;
  });
  classDef.mixins.forEach((mixinClassDefName) => {
    const mixinClassDef = structures[mixinClassDefName];
    if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
      processedMixins[mixinClassDef.name] = true;
      processProperties(mixinClassDef, lines, imports, typeSet, interfaces, structures, hasEvents,
        processedMixins, addedProps);
    }
  });
}

function processProperty(classDef, propDef, lines, imports, typeSet, interfaces, structures, hasEvents) {
  try {
    let type = setupType(propDef.type, imports, typeSet, interfaces, structures);
    let declarationType = 'public';
    if (propDef.private) declarationType = 'private';
    if (propDef.protected) declarationType = 'protected';
    if (classDef.isMixin) declarationType = '';

    type = setupInterfaceIfNeeded(type, propDef, imports, typeSet, interfaces, structures);
    type = setupFunctionIfNeeded(type, propDef, imports, typeSet, interfaces, structures);
    lines.push(`    ${propDef.docblock.split(/\n\s*/).join('\n    ')}\n    ${declarationType} ${propDef.static ? 'static ' : ''}${propDef.readonly ? 'readonly ' : ''}${propDef.name}: ${type};\n`);
    return propDef.name;
  } catch (e) {
    console.error('Failed to process property', propDef, e);
    throw e;
  }
}

function isRootClass(classDef, structures) {
  if (classDef.name === 'Layer.Core.Root') return true;
  if (classDef.extends && structures[classDef.extends]) return isRootClass(structures[classDef.extends], structures);
  return false;
}

function processAllEvents(classDef, lines, imports, typeSet, interfaces, structures, processedMixins = {}) {
  if (classDef.events && isRootClass(classDef, structures)) {
    const events = [];
    classDef.events.forEach(eventDef => events.push(eventDef.name));
    classDef.mixins.forEach((mixinClassDefName) => {
      const mixinClassDef = structures[mixinClassDefName];
      if (mixinClassDef && !processedMixins[mixinClassDef.name]) {
        processedMixins[mixinClassDef.name] = true;
        processAllEvents(mixinClassDef, lines, imports, typeSet, interfaces, structures, processedMixins);
      }
    });
    if (events.length) {
      if (!typeSet['Layer.Core.Root']) {
        typeSet['Layer.Core.Root'] = 'LayerCoreRoot';
        imports.push('import LayerCoreRoot from \'./Layer.Core.Root\';');
      }
      if (!typeSet['Layer.Core.LayerEvent']) {
        typeSet['Layer.Core.LayerEvent'] = 'LayerCoreLayerEvent';
        imports.push('import LayerCoreLayerEvent from \'./Layer.Core.LayerEvent\';');
      }

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
  }
}

function importNamespace(classDef, lines, imports, typeSet, interfaces, structures, hasEvents) {
  const name = classDef.name;
  const childNames = Object.keys(structures).filter(className =>
    className.indexOf(name + '.') === 0 && className.substring(name.length + 1).indexOf('.') === -1);

  childNames.forEach((className) => {
    let type;
    if (typeSet[className]) {
      type = typeSet[className];
    } else {
      type = className.replace(/\./g, '');
      typeSet[className] = type;
      imports.push(`import ${type} from './${className}';`);
      lines.push(`    ${className.substring(className.lastIndexOf('.') + 1)}: ${type};`);
    }
  });
}

// TODO: Export Layer.Core to have something
// TODO: Adaptors????
// TODO: Trackdown any remaining typescript errors
// TODO: Any string that is one of a set of options can be defined with `type ReadStatus = "ALL" | "SOME" | "NONE";`
// TODO: Document the hell out of these parsers and generators

function processClass(grunt, name, structures, destFolder) {
  const classDef = structures[name];
  const classParts = name.split('.');
  const className = classParts[classParts.length - 1];
  const extendsParts = (classDef.extends || '').split('.');
  const extendsClassName = extendsParts[extendsParts.length - 1] || '';
  const imports = ['import { AnObject, CustomHTMLElement } from \'./misc\';'];
  const lines = [];
  const interfaces = [];

  const typeSet = {
    [name]: className,
  };

  if (extendsClassName && classDef.extends.indexOf('Layer.') === 0) {
    imports.push(`import ${extendsClassName} from './${classDef.extends}';`);
  }

  // lines.push(`${classDef.docblock}\nexport default ${classDef.abstract ? 'abstract ' : ''}${classDef.isMixin ? 'interface' : 'class'} ${className} ${extendsClassName ? 'extends ' + extendsClassName : ''} ${classDef.mixins.length ? 'implements ' + classDef.mixins.map(nextClassName => setupType(nextClassName, imports, typeSet, structures)).join(', ') + ' ' : ''} {`);
  lines.push(`${classDef.docblock}\nexport default ${classDef.abstract ? 'abstract ' : ''}${classDef.isMixin ? 'interface' : 'class'} ${className} ${extendsClassName ? 'extends ' + extendsClassName : ''} {`);

  processAllEvents(classDef, lines, imports, typeSet, interfaces, structures);

  processProperties(classDef, lines, imports, typeSet, interfaces, structures);
  processMethods(classDef, lines, imports, typeSet, interfaces, structures);

  switch (classDef.instructions) {
    case 'importnamespace':
      importNamespace(classDef, lines, imports, typeSet, interfaces, structures);
      break;
  }


  // DONE...
  lines.push('}');
  const destFile = destFolder + '/' + name + '.d.ts';
  grunt.file.write(destFile, imports.join('\n') + '\n\n' + interfaces.join('\n') + '\n\n' + lines.join('\n'));
}


function processFile(grunt, structures, destFolder) {
  const classNameList = Object.keys(structures).sort((a, b) => {
    if (a.toLowerCase() > b.toLowerCase()) return 1;
    if (a.toLowerCase() < b.toLowerCase()) return -1;
    return 0;
  });

  classNameList.forEach((name) => {
    const classDef = structures[name];
    if (classDef.instructions === 'ismixin') classDef.isMixin = true;
  });

  classNameList.forEach(name => processClass(grunt, name, structures, destFolder));
}


module.exports = (grunt, files, destFolder) => {
  files.forEach((file) => {
    const contents = grunt.file.read(file);
    processFile(grunt, JSON.parse(contents), destFolder);
  });

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
