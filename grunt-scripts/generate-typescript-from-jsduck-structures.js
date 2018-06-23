let interfaceIndex = 0;

function setupType(fullType, imports, typeSet) {
  if (fullType === 'Mixed') {
    return 'any';
  } else if (fullType === 'Mixed[]') {
    return 'any[]';
  }
  const multipleTypes = fullType.indexOf('|') !== -1;
  if (multipleTypes) {
    const types = fullType.split(/\s*\|\s*/);
    // Setup the imports for each of these...
    return types.map(type => setupType(type, imports, typeSet)).join(' | ');
  }
  const isArrayType = fullType.match(/\[\]/);
  if (isArrayType) fullType = fullType.replace(/\[\]/, '');
  let type = fullType;
  try {
    if (typeSet[type]) {
      type = typeSet[type];
    } else if (type.indexOf('Layer.') === 0) {
      type = type.replace(/\./g, '');
      typeSet[fullType] = type;
      imports.push(`import ${type} from './${fullType}';`);
    }
    return type + (isArrayType ? '[]' : '');
  } catch (e) {
    console.error('failed to setup ' + JSON.stringify(fullType) + '  ', e);
    throw e;
  }
}

function processMethod(classDef, methodDef, lines, imports, typeSet, interfaces) {
  try {
    let returnType;
    if (!methodDef.returns) {
      returnType = 'void';
    } else if (methodDef.returns.name === 'this') {
      returnType = classDef.name.replace(/^.*\./, '');
    } else {
      returnType = setupType(methodDef.returns.type, imports, typeSet);
    }
    const params = methodDef.params.map((paramDef) => {
      let type = setupType(paramDef.type, imports, typeSet);
      type = setupInterfaceIfNeeded(type, paramDef, imports, typeSet, interfaces);
      type = setupFunctionIfNeeded(type, paramDef, imports, typeSet, interfaces);
      return `${paramDef.name}: ${type}${paramDef.value ? ' = ' + paramDef.value : ''}`;
    });

    let declarationType = 'public';
    if (methodDef.private) declarationType = 'private';
    if (methodDef.protected) declarationType = 'protected';

    lines.push(`    ${methodDef.docblock.split(/\n\s*/).join('\n    ')}\n    ${declarationType} ${methodDef.static ? 'static ' : ''} ${methodDef.name}(${params.join(', ')})${methodDef.name === 'constructor' ? '' : ': ' + returnType};\n`);
  } catch (e) {
    console.error('Failed to setup method ', JSON.stringify(methodDef), e);
    throw e;
  }
}

function setupFunctionIfNeeded(type, propDef, imports, typeSet, interfaces) {
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
        returnType = setupType(returnDef.type, imports, typeSet);
        returnType = setupInterfaceIfNeeded(returnType, returnDef, imports, typeSet, interfaces);
      } else {
        const subPropDef = propDef.subproperties[subPropertyName];
        let subType = setupType(subPropDef.type, imports, typeSet);
        subType = setupInterfaceIfNeeded(subType, subPropDef, imports, typeSet, interfaces);
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

function setupInterfaceIfNeeded(type, propDef, imports, typeSet, interfaces) {
  if (type === 'Mixed') return 'any';
  if (type === 'Object' || type === 'Event') {
    if (Object.keys(propDef.subproperties).length) {
      type = generateInterface(propDef, imports, typeSet, interfaces);
    } else if (type === 'Object') {
      type = 'AnObject';
    }
  }
  return type;
}

function generateInterface(propDef, imports, typeSet, interfaces) {
  try {
    const interfaceName = 'AnInterface' + interfaceIndex++;
    const interfaceLines = [`interface ${interfaceName} {`];
    Object.keys(propDef.subproperties).forEach((subPropDefName) => {
      const subPropDef = propDef.subproperties[subPropDefName];
      let type = setupType(subPropDef.type, imports, typeSet);
      if (type === 'Object' || type === 'Event') {
        if (Object.keys(subPropDef.subproperties).length) {
          type = generateInterface(subPropDef, imports, typeSet, interfaces);
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

function processProperty(classDef, propDef, lines, imports, typeSet, interfaces) {
  try {
    let type = setupType(propDef.type, imports, typeSet);
    let declarationType = 'public';
    if (propDef.private) declarationType = 'private';
    if (propDef.protected) declarationType = 'protected';
    type = setupInterfaceIfNeeded(type, propDef, imports, typeSet, interfaces);
    type = setupFunctionIfNeeded(type, propDef, imports, typeSet, interfaces);
    lines.push(`    ${propDef.docblock.split(/\n\s*/).join('\n    ')}\n    ${declarationType} ${propDef.static ? 'static ' : ''} ${propDef.readonly ? 'readonly ' : ''}${propDef.name}: ${type};\n`);
  } catch (e) {
    console.error('Failed to process property', propDef, e);
    throw e;
  }
}

// TODO: Any mixin (i.e. implements Interface) needs to find all methods and properties and redefine any that are missing!
// TODO: Trackdown any remaining typescript errors
// TODO: Any string that is one of a set of options can be defined with `type ReadStatus = "ALL" | "SOME" | "NONE";`
// TODO: Try defining event handlers with `type SupportedEvents = "ready" | "challenge" | "authenticated";`
// TODO: Document the hell out of these parsers and generators

function processClass(grunt, name, classDef, destFolder) {
  const classParts = name.split('.');
  const className = classParts[classParts.length - 1];
  const extendsParts = (classDef.extends || '').split('.');
  const extendsClassName = extendsParts[extendsParts.length - 1] || '';
  const imports = [];
  const lines = [];
  const interfaces = ['interface AnObject { [index: string]: any; }'];

  const typeSet = {
    [name]: className,
  };

  if (extendsClassName && classDef.extends.indexOf('Layer.') === 0) {
    imports.push(`import ${extendsClassName} from './${classDef.extends}';`);
  }

  lines.push(`${classDef.docblock}\nexport default ${classDef.isMixin ? 'interface' : 'class'} ${className} ${extendsClassName ? 'extends ' + extendsClassName : ''} ${classDef.mixins.length ? 'implements ' + classDef.mixins.map(nextClassName => setupType(nextClassName, imports, typeSet)).join(', ') + ' ' : ''} {`);

  classDef.properties.forEach(propDef => processProperty(classDef, propDef, lines, imports, typeSet, interfaces));
  classDef.methods.forEach(methodDef => processMethod(classDef, methodDef, lines, imports, typeSet, interfaces));

  // Filter out silly stuff...

  // DONE...
  lines.push('}');
  const destFile = destFolder + '/' + name + '.d.ts';
  grunt.file.write(destFile, imports.join('\n') + '\n\n' + interfaces.join('\n') + '\n\n' + lines.join('\n'));
  console.log(`Wrote ${destFile}`);
}


function processFile(grunt, structures, destFolder) {
  const classNameList = Object.keys(structures).sort((a, b) => {
    if (a.toLowerCase() > b.toLowerCase()) return 1;
    if (a.toLowerCase() < b.toLowerCase()) return -1;
    return 0;
  });
  classNameList.forEach(name => processClass(grunt, name, structures[name], destFolder));
}


module.exports = (grunt, files, destFolder) => {
  files.forEach((file) => {
    const contents = grunt.file.read(file);
    processFile(grunt, JSON.parse(contents), destFolder);
  });
};
