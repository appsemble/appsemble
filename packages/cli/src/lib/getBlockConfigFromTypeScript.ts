import { relative } from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import type { BlockManifest } from '@appsemble/types';
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
  TypeChecker,
  TypeElement,
} from 'typescript';
import { buildGenerator, Definition } from 'typescript-json-schema';

import type { BlockConfig } from '../types';

/**
 * Get the tsdoc comment for a TypeScript node.
 *
 * @param checker - The type checker instance to use.
 * @param node - The node for which to get the tsdoc.
 * @returns The tsdoc comment as a string, if present.
 */
function getNodeComments(checker: TypeChecker, node: TypeElement): string {
  const symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) {
    return null;
  }

  const comments = symbol.getDocumentationComment(checker);
  if (comments.length) {
    return comments
      .map((comment) =>
        comment.kind === 'lineBreak' ? comment.text : comment.text.trim().replace(/\r\n/g, '\n'),
      )
      .join('');
  }
}

/**
 * Get an axtions object based on a TypeScript interface node.
 *
 * @param iface - The node to base the actions on.
 * @param checker - The TypeScript type checker.
 * @returns The action manifest to upload.
 */
function processActions(
  iface: InterfaceDeclaration,
  checker: TypeChecker,
): BlockManifest['actions'] {
  if (!iface || !iface.members.length) {
    return;
  }

  return Object.fromEntries(
    iface.members.map((member) => {
      const description = getNodeComments(checker, member);
      if (isIndexSignatureDeclaration(member)) {
        return ['$any', { description }];
      }

      if ((member.name as Identifier).escapedText === '$any') {
        throw new AppsembleError(
          'Found ‘$any’ property signature in Actions interface. This is reserved to mark index signatures.',
        );
      }

      return [(member.name as Identifier).escapedText, { description }];
    }),
  );
}

/**
 * Get an events object based on TypeScript interface nodes.
 *
 * @param eventListenerInterface - The node to base the event listeners on.
 * @param eventEmitterInterface - The node to base the event emitters on.
 * @param checker - The TypeScript type checker.
 * @returns The events manifest to upload.
 */
function processEvents(
  eventListenerInterface: InterfaceDeclaration,
  eventEmitterInterface: InterfaceDeclaration,
  checker: TypeChecker,
): BlockManifest['events'] {
  if (!eventListenerInterface?.members.length && !eventEmitterInterface?.members.length) {
    return;
  }

  const listen =
    eventListenerInterface?.members.length &&
    Object.fromEntries(
      eventListenerInterface.members.map((member) => [
        (member.name as Identifier).escapedText,
        { description: getNodeComments(checker, member) },
      ]),
    );
  const emit =
    eventEmitterInterface?.members.length &&
    Object.fromEntries(
      eventEmitterInterface.members.map((member) => [
        (member.name as Identifier).escapedText,
        { description: getNodeComments(checker, member) },
      ]),
    );

  return { emit, listen };
}

/**
 * Get the JSON schema for parameters based on a TypeScript program.
 *
 * @param program - The TypeScript program from which to extract parameters.
 * @param sourceFile - The source file from which to extract parameters.
 * @returns The JSON schema for the block parameters.
 */
function processParameters(program: Program, sourceFile: SourceFile): Definition {
  if (!sourceFile) {
    return;
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
 * @param blockPath - The path for which to get the TypeScript program.
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
    config.files = sys.readDirectory(blockPath, ['.ts', '.tsx']).map((f) => relative(blockPath, f));
  }
  const { errors, fileNames, options } = parseJsonConfigFileContent(
    config,
    sys,
    blockPath,
    undefined,
    tsConfigPath,
  );
  // Filter: 'rootDir' is expected to contain all source files.
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

/**
 * Generate a block manifest from the block metadata and TypeScript project.
 *
 * Uses the .appsemblerc file and the type definitions of the block.
 *
 * @param blockConfig - The block configuration
 *
 * @returns The block configuration appended from the TypeScript project.
 */
export function getBlockConfigFromTypeScript(
  blockConfig: BlockConfig,
): Pick<BlockManifest, 'actions' | 'events' | 'parameters'> {
  if ('actions' in blockConfig && 'events' in blockConfig && 'parameters' in blockConfig) {
    return blockConfig;
  }
  logger.info(`Extracting data from TypeScript project ${blockConfig.dir}`);
  const program = getProgram(blockConfig.dir);
  const checker = program.getTypeChecker();

  let actionInterface: InterfaceDeclaration;
  let eventEmitterInterface: InterfaceDeclaration;
  let eventListenerInterface: InterfaceDeclaration;
  let parametersSourceFile: SourceFile;

  program.getSourceFiles().forEach((sourceFile) => {
    const fileName = relative(process.cwd(), sourceFile.fileName);
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
    actions:
      'actions' in blockConfig ? blockConfig.actions : processActions(actionInterface, checker),
    events:
      'events' in blockConfig
        ? blockConfig.events
        : processEvents(eventListenerInterface, eventEmitterInterface, checker),
    parameters:
      'parameters' in blockConfig
        ? blockConfig.parameters
        : processParameters(program, parametersSourceFile),
  };
}
