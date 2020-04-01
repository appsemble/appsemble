import { AppsembleError, logger } from '@appsemble/node-utils';
import { BlockManifest } from '@appsemble/types';
import path from 'path';
import {
  createProgram,
  findConfigFile,
  forEachChild,
  formatDiagnostic,
  FormatDiagnosticsHost,
  formatDiagnosticsWithColorAndContext,
  getPreEmitDiagnostics,
  Identifier,
  InterfaceDeclaration,
  isIndexSignatureDeclaration,
  isInterfaceDeclaration,
  isModuleDeclaration,
  parseJsonConfigFileContent,
  Program,
  readConfigFile,
  SourceFile,
  sys,
} from 'typescript';
import { buildGenerator, Definition } from 'typescript-json-schema';
import { inspect } from 'util';

import { BlockConfig, BlockPayload } from '../types';

// XXX specify any
function processActions(iface: InterfaceDeclaration): BlockManifest['actions'] {
  if (!iface || !iface.members.length) {
    return undefined;
  }

  return Object.fromEntries(
    iface.members.map((member) => {
      if (isIndexSignatureDeclaration(member)) {
        return ['$any', {}];
      }

      if ((member.name as Identifier).escapedText === '$any') {
        throw new AppsembleError(
          'Found ‘$any’ property signature in Actions interface. This is reserved to mark index signatures.',
        );
      }

      return [(member.name as Identifier).escapedText, {}];
    }),
  );
}

// XXX specify any
function mergeInterfacesKeys(iface: InterfaceDeclaration): string[] {
  if (!iface || !iface.members.length) {
    return undefined;
  }
  return iface.members.map((member) => (member.name as Identifier).escapedText as string);
}

// XXX specify any
function processEvents(
  eventListenerInterface: InterfaceDeclaration,
  eventEmitterInterface: InterfaceDeclaration,
): BlockManifest['events'] {
  const listen = mergeInterfacesKeys(eventListenerInterface);
  const emit = mergeInterfacesKeys(eventEmitterInterface);
  if (!listen && !emit) {
    return undefined;
  }
  return { emit, listen };
}

function processParameters(program: Program, sourceFile: SourceFile): Definition {
  if (!sourceFile) {
    return undefined;
  }
  const generator = buildGenerator(
    program,
    {
      noExtraProps: true,
      required: true,
    },
    [sourceFile.fileName],
  );
  generator.setSchemaOverride('IconName', {
    type: 'string',
    format: 'fontawesome',
  });
  const schema = generator.getSchemaForSymbol('Parameters');
  // This is the tsdoc that has been added to the SDK to aid the block developer.
  delete schema.description;
  return schema;
}

/**
 * Get the TypeScript program for a given path.
 *
 * @param blockPath The path for which to get the TypeScript program.
 * @returns The TypeScript program.
 */
function getProgram(blockPath: string): Program {
  const diagnosticHost: FormatDiagnosticsHost = {
    getNewLine: () => sys.newLine,
    getCurrentDirectory: sys.getCurrentDirectory,
    getCanonicalFileName: (x) => x,
  };
  const tsConfigPath = findConfigFile(blockPath, sys.fileExists);
  const { config, error } = readConfigFile(tsConfigPath, sys.readFile);
  if (error) {
    throw new AppsembleError(formatDiagnostic(error, diagnosticHost));
  }
  if (!config.files || !config.include) {
    config.files = sys
      .readDirectory(blockPath, ['.ts', '.tsx'])
      .map((f) => path.relative(blockPath, f));
  }
  const { errors, fileNames, options } = parseJsonConfigFileContent(
    config,
    sys,
    blockPath,
    undefined,
    tsConfigPath,
  );
  // filter: 'rootDir' is expected to contain all source files.
  const diagnostics = errors.filter(({ code }) => code !== 6059);
  if (diagnostics.length) {
    throw new AppsembleError(formatDiagnosticsWithColorAndContext(diagnostics, diagnosticHost));
  }

  options.noEmit = true;
  delete options.out;
  delete options.outDir;
  delete options.outFile;
  delete options.declaration;
  delete options.declarationDir;
  delete options.declarationMap;
  const program = createProgram(fileNames, options);
  const preEmitDiagnostics = getPreEmitDiagnostics(program);
  if (preEmitDiagnostics.length) {
    throw new AppsembleError(
      formatDiagnosticsWithColorAndContext(preEmitDiagnostics, diagnosticHost),
    );
  }
  return program;
}

function getFromContext(
  blockConfig: BlockConfig,
  fullPath: string,
): Pick<BlockManifest, 'actions' | 'events' | 'parameters'> {
  if ('actions' in blockConfig && 'events' in blockConfig && 'parameters' in blockConfig) {
    return blockConfig;
  }
  logger.info(`Extracting data from TypeScript project ${fullPath}`);
  const program = getProgram(fullPath);

  let actionInterface: InterfaceDeclaration;
  let eventEmitterInterface: InterfaceDeclaration;
  let eventListenerInterface: InterfaceDeclaration;
  let parametersSourceFile: SourceFile;

  program.getSourceFiles().forEach((sourceFile) => {
    const fileName = path.relative(process.cwd(), sourceFile.fileName);
    // Filter TypeScript default libs
    if (program.isSourceFileDefaultLibrary(sourceFile)) {
      logger.silly(`Skipping metadata extraction from: ${fileName}`);
      return;
    }
    logger.verbose(`Searching metadata in: ${fileName}`);
    forEachChild(sourceFile, (mod) => {
      // This node doesn’t override SDK types
      if (!isModuleDeclaration(mod)) {
        return;
      }
      // This module defines other types
      if (mod.name.text !== '@appsemble/sdk') {
        return;
      }
      forEachChild(mod.body, (iface) => {
        // Appsemble only uses module interface augmentation.
        if (!isInterfaceDeclaration(iface)) {
          return;
        }
        const { line } = sourceFile.getLineAndCharacterOfPosition(iface.getStart(sourceFile));
        // Line numbers are 0 indexed, whereas they are usually represented as 1 indexed.
        const loc = `${fileName}:${line + 1}`;

        switch (iface.name.text) {
          case 'Actions':
            logger.info(`Found augmented interface 'Actions' in '${loc}'`);
            if (actionInterface) {
              throw new AppsembleError(`Found duplicate interface 'Actions' in '${loc}'`);
            }
            actionInterface = iface;
            break;
          case 'EventEmitters':
            logger.info(`Found augmented interface 'EventEmitters' in '${loc}'`);
            if (eventEmitterInterface) {
              throw new AppsembleError(`Found duplicate interface 'EventEmitters' in '${loc}'`);
            }
            eventEmitterInterface = iface;
            break;
          case 'EventListeners':
            logger.info(`Found augmented interface 'EventListeners' in '${loc}'`);
            if (eventListenerInterface) {
              throw new AppsembleError(`Found duplicate interface 'EventListeners' in '${loc}'`);
            }
            eventListenerInterface = iface;
            break;
          case 'Parameters':
            logger.info(`Found augmented interface 'Parameters' in '${loc}'`);
            if (parametersSourceFile) {
              throw new AppsembleError(`Found duplicate interface 'Parameters' in '${loc}'`);
            }
            parametersSourceFile = sourceFile;
            break;
          default:
            logger.warn(`Detected unused augmented type ${iface.name.text} in ${loc}`);
        }
      });
    });
  });

  return {
    actions: 'actions' in blockConfig ? blockConfig.actions : processActions(actionInterface),
    events:
      'events' in blockConfig
        ? blockConfig.events
        : processEvents(eventListenerInterface, eventEmitterInterface),
    parameters:
      'parameters' in blockConfig
        ? blockConfig.parameters
        : processParameters(program, parametersSourceFile),
  };
}

/**
 * Generate a full block manifest from the block metadata.
 *
 * Uses the .appsemblerc file and the type definitions of the block.
 *
 * @param config The content of the .appsemblerc file
 * @param fullPath The path to the .appsemblerc file
 */
export default function generateBlockData(config: BlockConfig, fullPath: string): BlockPayload {
  const { description, layout, name, resources, version } = config;
  const { actions, events, parameters } = getFromContext(config, fullPath);

  logger.verbose(`Using name: ${inspect(name, { colors: true, depth: 20 })}`);
  logger.verbose(`Using description: ${inspect(description, { colors: true, depth: 20 })}`);
  logger.verbose(`Using version: ${inspect(version, { colors: true, depth: 20 })}`);
  logger.verbose(`Using layout: ${inspect(layout, { colors: true, depth: 20 })}`);
  logger.verbose(`Using actions: ${inspect(actions, { colors: true, depth: 20 })}`);
  logger.verbose(`Using events: ${inspect(events, { colors: true, depth: 20 })}`);
  logger.verbose(`Using parameters: ${inspect(parameters, { colors: true, depth: 20 })}`);

  return {
    name,
    description,
    actions,
    events,
    layout,
    parameters,
    resources,
    version,
  };
}
