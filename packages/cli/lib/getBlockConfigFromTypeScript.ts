import { relative } from 'node:path';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { type BlockConfig, type BlockManifest } from '@appsemble/types';
import { parse } from 'comment-parser';
import { type Schema } from 'jsonschema';
import normalizePath from 'normalize-path';
import { createFormatter, createParser, SchemaGenerator, ts } from 'ts-json-schema-generator';

/**
 * Get the tsdoc comment for a TypeScript node.
 *
 * @param checker The type checker instance to use.
 * @param node The node for which to get the tsdoc.
 * @returns The tsdoc comment as a string, if present.
 */
function getNodeComments(checker: ts.TypeChecker, node: ts.TypeElement): string {
  const symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) {
    return;
  }

  const comments = symbol.getDocumentationComment(checker);
  if (comments.length) {
    return comments
      .map((comment) =>
        comment.kind === 'lineBreak' ? comment.text : comment.text.trim().replaceAll('\r\n', '\n'),
      )
      .join('');
  }
}

/**
 * Process keys from an interface into an object.
 *
 * This asserts only index signature members and regular alphanumerical properties are used.
 *
 * @param iface The TypeScript interface to check.
 * @param checker The TypeScript type checker.
 * @param convert A function for converting extracted data to a value. It will be called with the
 *   name and JSDoc description. The name is `undefined` for index signatures. The function should
 *   return a tuple of key and value.
 * @returns A record created from the returned key/value pairs.
 */
function processInterface<T>(
  iface: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
  convert: (name: string, description: string) => [string, T],
): Record<string, T> {
  if (!iface?.members.length) {
    return;
  }

  const source = iface.getSourceFile().getText();

  return Object.fromEntries(
    iface.members.map((member) => {
      const description = getNodeComments(checker, member);
      if (ts.isIndexSignatureDeclaration(member)) {
        // Comments aren’t properly extracted for index signatures.
        const commentRanges = ts.getLeadingCommentRanges(source, member.pos);
        if (commentRanges) {
          const comments = commentRanges?.map((r) => source.slice(r.pos, r.end)) ?? [];
          const [block] = parse(comments[0]);
          const processedDescription = block.source
            .map((src) => src.tokens.description)
            .join('\n')
            .replaceAll(/^\s+|\s+$/g, '');

          return convert(undefined, processedDescription);
        }

        return convert(undefined, description);
      }

      if (!ts.isPropertySignature(member)) {
        throw new AppsembleError(
          `Only property and index signatures are allowed as ${
            iface.name
          } keys. Found: ${member.getFullText()}`,
        );
      }

      const { name } = member;

      if (!ts.isIdentifier(name)) {
        throw new AppsembleError(
          `Only property and index signatures are allowed as ${
            iface.name
          } keys. Found: ${name.getFullText()}`,
        );
      }

      const { text } = name;

      if (!/^[\da-z]+$/i.test(text)) {
        throw new AppsembleError(
          `Found property named ‘${text}’ in ${iface.name} interface. Only alphanumerical identifiers are supported.`,
        );
      }

      return convert(text, description);
    }),
  );
}

/**
 * Get an actions object based on a TypeScript interface node.
 *
 * @param iface The node to base the actions on.
 * @param checker The TypeScript type checker.
 * @returns The action manifest to upload.
 */
function processActions(
  iface: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
): BlockManifest['actions'] {
  return processInterface(iface, checker, (name, description) => [name ?? '$any', { description }]);
}

/**
 * Get an events object based on TypeScript interface nodes.
 *
 * @param eventListenerInterface The node to base the event listeners on.
 * @param eventEmitterInterface The node to base the event emitters on.
 * @param checker The TypeScript type checker.
 * @returns The events manifest to upload.
 */
function processEvents(
  eventListenerInterface: ts.InterfaceDeclaration,
  eventEmitterInterface: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
): BlockManifest['events'] {
  const listen = processInterface(eventListenerInterface, checker, (name, description) => [
    name ?? '$any',
    { description },
  ]);
  const emit = processInterface(eventEmitterInterface, checker, (name, description) => [
    name ?? '$any',
    { description },
  ]);

  return (emit || listen) && { emit, listen };
}

/**
 * Get the JSON schema for parameters based on a TypeScript program.
 *
 * @param program The TypeScript program from which to extract parameters.
 * @param iface The interface node from which to extract parameters.
 * @returns The JSON schema for the block parameters.
 */
function processParameters(program: ts.Program, iface: ts.InterfaceDeclaration): Schema {
  if (!iface) {
    return;
  }
  const formatter = createFormatter({}, (fmt) => {
    fmt.addTypeFormatter({
      supportsType: (type) => type.getName() === 'IconName',
      getDefinition: () => ({ type: 'string', format: 'fontawesome' }),
      getChildren: () => [],
    });
    fmt.addTypeFormatter({
      supportsType: (type) => type.getName() === 'Remapper',
      getDefinition: () => ({ format: 'remapper' }),
      getChildren: () => [],
    });
  });
  const parser = createParser(program, { expose: 'all', topRef: false });
  const generator = new SchemaGenerator(program, parser, formatter);
  const schema = generator.createSchemaFromNodes([iface]) as Schema;
  if (schema.definitions && !Object.keys(schema.definitions).length) {
    delete schema.definitions;
  }
  // This is the tsdoc that has been added to the SDK to aid the block developer.
  delete schema.description;
  return schema;
}

/**
 * Get a messages object based on a TypeScript interface node.
 *
 * @param iface The node to base the messages on.
 * @param checker The TypeScript type checker.
 * @returns The action manifest to upload.
 */
function processMessages(
  iface: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
): BlockManifest['messages'] {
  return processInterface(iface, checker, (name, description) => [name, { description }]);
}

/**
 * Get the TypeScript program for a given path.
 *
 * @param blockPath The path for which to get the TypeScript program.
 * @returns The TypeScript program.
 */
function getProgram(blockPath: string): ts.Program {
  const diagnosticHost: ts.FormatDiagnosticsHost = {
    getNewLine: () => ts.sys.newLine,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (x) => x,
  };
  const tsConfigPath = ts.findConfigFile(blockPath, ts.sys.fileExists);
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    throw new AppsembleError(ts.formatDiagnostic(error, diagnosticHost));
  }
  if (!config.files || !config.include) {
    config.files = ts.sys
      .readDirectory(blockPath, ['.ts', '.tsx'])
      .map((f) => relative(blockPath, f));
  }
  const { errors, fileNames, options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    blockPath,
    undefined,
    tsConfigPath,
  );
  // Filter: 'rootDir' is expected to contain all source files.
  const diagnostics = errors.filter(({ code }) => code !== 6059);
  if (diagnostics.length) {
    throw new AppsembleError(ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticHost));
  }

  options.noEmit = true;
  delete options.out;
  delete options.outDir;
  delete options.outFile;
  delete options.declaration;
  delete options.declarationDir;
  delete options.declarationMap;
  const program = ts.createProgram(fileNames, options);
  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
  if (preEmitDiagnostics.length) {
    throw new AppsembleError(
      ts.formatDiagnosticsWithColorAndContext(preEmitDiagnostics, diagnosticHost),
    );
  }
  return program;
}

/**
 * Generate a block manifest from the block metadata and TypeScript project.
 *
 * Uses the .appsemblerc file and the type definitions of the block.
 *
 * @param blockConfig The block configuration
 * @returns The block configuration appended from the TypeScript project.
 */
export function getBlockConfigFromTypeScript(
  blockConfig: BlockConfig,
): Pick<BlockManifest, 'actions' | 'events' | 'messages' | 'parameters'> {
  if ('actions' in blockConfig && 'events' in blockConfig && 'parameters' in blockConfig) {
    return blockConfig;
  }
  logger.info(`Extracting data from TypeScript project ${blockConfig.dir}`);
  const program = getProgram(blockConfig.dir);
  const checker = program.getTypeChecker();

  let actionInterface: ts.InterfaceDeclaration;
  let eventEmitterInterface: ts.InterfaceDeclaration;
  let eventListenerInterface: ts.InterfaceDeclaration;
  let messagesInterface: ts.InterfaceDeclaration;
  let patametersInterface: ts.InterfaceDeclaration;

  for (const sourceFile of program.getSourceFiles()) {
    const fileName = relative(process.cwd(), sourceFile.fileName);
    // Filter TypeScript default libs
    if (program.isSourceFileDefaultLibrary(sourceFile)) {
      logger.silly(`Skipping metadata extraction from: ${fileName}`);
      continue;
    }
    logger.verbose(`Searching metadata in: ${fileName}`);
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    ts.forEachChild(sourceFile, (mod) => {
      // This node doesn’t override SDK types
      if (!ts.isModuleDeclaration(mod)) {
        return;
      }
      // This module defines other types
      if (mod.name.text !== '@appsemble/sdk') {
        return;
      }
      ts.forEachChild(mod.body, (iface) => {
        // Appsemble only uses module interface augmentation.
        if (!ts.isInterfaceDeclaration(iface)) {
          return;
        }
        const { line } = sourceFile.getLineAndCharacterOfPosition(iface.getStart(sourceFile));
        // Line numbers are 0 indexed, whereas they are usually represented as 1 indexed.
        const loc = `${normalizePath(fileName)}:${line + 1}`;

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
            if (patametersInterface) {
              throw new AppsembleError(`Found duplicate interface 'Parameters' in '${loc}'`);
            }
            patametersInterface = iface;
            break;
          case 'Messages':
            logger.info(`Found augmented interface 'Messages' in '${loc}'`);
            messagesInterface = iface;
            break;
          default:
            logger.warn(`Detected unused augmented type ${iface.name.text} in ${loc}`);
        }
      });
    });
  }

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
        : processParameters(program, patametersInterface),
    messages:
      'messages' in blockConfig
        ? blockConfig.messages
        : processMessages(messagesInterface, checker),
  };
}
