import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { inspect } from 'node:util';

import { AppsembleError, getWorkspaces, logger, readData } from '@appsemble/node-utils';
import { type ProjectBuildConfig, type ProjectImplementations } from '@appsemble/types';
import { prefixBlockURL } from '@appsemble/utils';
import chalk from 'chalk';
import { parse } from 'comment-parser';
import { cosmiconfig } from 'cosmiconfig';
import { type Schema } from 'jsonschema';
import normalizePath from 'normalize-path';
import { createFormatter, createParser, SchemaGenerator, ts } from 'ts-json-schema-generator';
import { type PackageJson } from 'type-fest';
import { type Configuration } from 'webpack';

/**
 * Get the build configuration from a project directory.
 *
 * @param dir The directory in which to search for the configuration file.
 * @returns The configuration.
 */
export async function getProjectBuildConfig(dir: string): Promise<ProjectBuildConfig> {
  const explorer = cosmiconfig('appsemble', { stopDir: dir });
  const found = await explorer.search(dir);

  let foundInParent;
  if (!found) {
    foundInParent = await explorer.search(dirname(dir));
    if (!foundInParent) {
      throw new AppsembleError(`No Appsemble configuration file found searching ${dir}`);
    }
  }

  const { config, filepath } = found || foundInParent;
  logger.info(`Found configuration file: ${filepath}`);

  const [pkg] = await readData<PackageJson>(join(dir, 'package.json'));
  if (!pkg.private) {
    logger.warn(
      `It is ${chalk.underline.yellow('highly recommended')} to set “${chalk.green(
        '"private"',
      )}: ${chalk.cyan('true')}” in package.json`,
    );
  }

  let longDescription: string | undefined;
  if (existsSync(join(dir, 'README.md'))) {
    longDescription = await readFile(join(dir, 'README.md'), 'utf8');
  }

  const result: ProjectBuildConfig = {
    description: pkg.description,
    longDescription,
    name: pkg.name,
    version: pkg.version,
    dir,
    ...config,
  };

  logger.verbose(`Resolved project configuration: ${inspect(result, { colors: true })}`);
  return result;
}

/**
 * Discover Appsemble projects based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param root The project root in which to find workspaces.
 * @returns Discovered Appsemble projects.
 */
export async function getProjectsBuildConfigs(root: string): Promise<ProjectBuildConfig[]> {
  const dirs = await getWorkspaces(root);
  const projectBuildConfigs = await Promise.all(
    dirs
      .concat(root)
      .map((path) => getProjectBuildConfig(path))
      // Ignore non-project workspaces.
      .map((p) => p.catch((): null => null)),
  );
  return projectBuildConfigs.filter(Boolean);
}

/**
 * Get the TypeScript program for a given path.
 *
 * @param path The path for which to get the TypeScript program.
 * @returns The TypeScript program.
 */
function getProgram(path: string): ts.Program {
  const diagnosticHost = {
    getNewLine: () => ts.sys.newLine,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (x) => x,
  } as ts.FormatDiagnosticsHost;

  const tsConfigPath = ts.findConfigFile(path, ts.sys.fileExists);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

  if (error) {
    throw new AppsembleError(ts.formatDiagnostic(error, diagnosticHost));
  }

  if (!config.files || !config.include) {
    config.files = ts.sys.readDirectory(path, ['.ts', '.tsx']).map((f) => relative(path, f));
  }

  const { errors, fileNames, options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path,
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
 * Get the tsdoc comment for a TypeScript node.
 *
 * @param checker The type checker instance to use.
 * @param node The node for which to get the tsdoc.
 * @returns The tsdoc comment as a string, if present.
 */
function getNodeComments(checker: ts.TypeChecker, node: ts.TypeElement): string | undefined {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
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
  convert: (name?: string, description?: string) => [string, T],
): Record<string, T> | undefined {
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
): ProjectImplementations['actions'] {
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
): ProjectImplementations['events'] {
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
 * @returns The JSON schema for the project parameters.
 */
function processParameters(
  program: ts.Program,
  iface: ts.InterfaceDeclaration,
): Schema | undefined {
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
  // This is the tsdoc that has been added to the SDK to aid the developer.
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
): ProjectImplementations['messages'] {
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return processInterface(iface, checker, (name, description) => [name, { description }]);
}

/**
 * Generate project implementations from the project metadata and TypeScript project.
 *
 * Uses the .appsemblerc file and the type definitions of the project.
 *
 * @param buildConfig The project build configuration
 * @returns The project implementations from the TypeScript project.
 */
export function getProjectImplementations(buildConfig: ProjectBuildConfig): ProjectImplementations {
  logger.info(`Extracting data from TypeScript project ${buildConfig.dir}`);
  const program = getProgram(buildConfig.dir);
  const checker = program.getTypeChecker();

  let actionInterface: ts.InterfaceDeclaration | undefined;
  let eventEmitterInterface: ts.InterfaceDeclaration | undefined;
  let eventListenerInterface: ts.InterfaceDeclaration | undefined;
  let messagesInterface: ts.InterfaceDeclaration | undefined;
  let parametersInterface: ts.InterfaceDeclaration | undefined;

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
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
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
            if (parametersInterface) {
              throw new AppsembleError(`Found duplicate interface 'Parameters' in '${loc}'`);
            }
            parametersInterface = iface;
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
      // @ts-expect-error 2454 Variable used before it was assigned
      'actions' in buildConfig ? buildConfig.actions : processActions(actionInterface, checker),
    events:
      // @ts-expect-error 2454 Variable used before it was assigned
      // eslint-disable-next-line prettier/prettier
      'events' in buildConfig ? buildConfig.events : processEvents(eventListenerInterface, eventEmitterInterface, checker),
    parameters:
      // @ts-expect-error 2454 Variable used before it was assigned
      // eslint-disable-next-line prettier/prettier
      'parameters' in buildConfig ? buildConfig.parameters : processParameters(program, parametersInterface),
    messages:
      // @ts-expect-error 2454 Variable used before it was assigned
      // eslint-disable-next-line prettier/prettier
      'messages' in buildConfig ? buildConfig.messages : processMessages(messagesInterface, checker),
  };
}

/**
 * Load a webpack configuration file.
 *
 * A webpack configuration file may export either an webpack configuration object, or a synchronous
 * or asynchronous function which returns a webpack configuration object. This function supports
 * all 3 use cases.
 *
 * @param buildConfig The project build config.
 * @param mode The env that would be passed to webpack by invoking `webpack --env $env`.
 * @param outputPath The path where the build will be output on disk.
 * @returns The webpack configuration as exposed by the webpack configuration file.
 */
export async function getProjectWebpackConfig(
  buildConfig: ProjectBuildConfig,
  mode?: 'development' | 'production',
  outputPath?: string,
): Promise<Configuration> {
  let configPath: string;
  if (buildConfig.webpack) {
    configPath = join(buildConfig.dir, buildConfig.webpack);
  } else {
    configPath = join(buildConfig.dir, 'webpack.config.js');
    try {
      await stat(configPath);
    } catch {
      configPath = '@appsemble/webpack-config';
    }
  }
  logger.info(`Using webpack config from ${configPath}`);
  const publicPath = prefixBlockURL({ type: buildConfig.name, version: buildConfig.version }, '');
  let config = await import(String(configPath));
  config = await (config.default || config);
  config = config instanceof Function ? await config(buildConfig, { mode, publicPath }) : config;

  // Koa-webpack serves assets on the `output.path` path. Normally this field describes where to
  // output the files on the file system. This is monkey patched to support usage with our dev
  // server.
  config.output = config.output || {};
  config.output.path = outputPath || publicPath;
  logger.verbose(`Patched webpack config output.path to ${config.output.path}`);
  config.output.publicPath = publicPath;
  logger.verbose(`Patched webpack config output.publicPath to ${config.output.publicPath}`);

  return config;
}
