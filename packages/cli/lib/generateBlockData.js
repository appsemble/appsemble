import { AppsembleError, logger } from '@appsemble/node-utils';
import path from 'path';
import {
  createProgram,
  findConfigFile,
  formatDiagnostic,
  formatDiagnosticsWithColorAndContext,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from 'typescript';
import { buildGenerator } from 'typescript-json-schema';

export function getFromContext({ actions, events, parameters, types = {} }, fullPath) {
  const { events: eventsInterface, file = 'block.ts', parameters: parametersInterface } = types;

  let generator;

  function getGenerator() {
    if (!generator) {
      logger.info('Extracting data from TypeScript project');
      const diagnosticHost = {
        getNewLine: sys.newLine,
        getCurrentDirectory: sys.getCurrentDirectory,
        getCanonicalFileName: x => x,
      };
      const tsConfigPath = findConfigFile(fullPath, sys.fileExists);
      const { config, error } = readConfigFile(tsConfigPath, sys.readFile);
      if (error) {
        throw new AppsembleError(formatDiagnostic(error, diagnosticHost));
      }
      if (!config.files || !config.include) {
        config.files = sys
          .readDirectory(fullPath, ['.ts', '.tsx'])
          .map(f => path.relative(fullPath, f));
      }
      const { errors, fileNames, options } = parseJsonConfigFileContent(
        config,
        sys,
        fullPath,
        undefined,
        tsConfigPath,
      );
      const diagnostics = errors.filter(
        ({ code }) =>
          // "'rootDir' is expected to contain all source files."
          code !== 6059 &&
          // "The 'files' list in config file is empty."
          code !== 18002 &&
          // "No inputs were found in config file."
          code !== 18003,
      );
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
      const program = createProgram(
        fileNames.map(f => path.relative(fullPath, f)),
        options,
      );
      generator = buildGenerator(
        program,
        {
          noExtraProps: true,
          required: true,
        },
        [file],
      );
      // This name is used for fontawesome icon names. They are excluded from the schema,
      // as they are provided by the Appsemble framework, not by the block itself.
      generator.setSchemaOverride('IconName', {
        type: 'string',
        format: 'fontawesome',
      });
    }
    return generator;
  }

  function getParameters() {
    if (parametersInterface) {
      if (parameters) {
        throw new AppsembleError(
          'Exacly one of ‘parameters’ and ‘types.parameters’ should be specified. Got both.',
        );
      }

      return getGenerator().getSchemaForSymbol(parametersInterface);
    }
    return parameters;
  }

  function getEvents() {
    if (eventsInterface) {
      if (events) {
        throw new AppsembleError(
          'Exacly one of ‘parameters’ and ‘types.parameters’ should be specified. Got both.',
        );
      }

      const e = getGenerator().getSchemaForSymbol(eventsInterface);
      return {
        listen: e.properties.listen ? e.properties.listen.enum : undefined,
        emit: e.properties.emit ? e.properties.emit.enum : undefined,
      };
    }
    return events;
  }

  return {
    actions,
    parameters: getParameters(),
    events: getEvents(),
  };
}

/**
 * Generate a full block manifest from the block metadata.
 *
 * Uses the .appsemblerc file and the type definitions of the block.
 *
 * @param {*} config The content of the .appsemblerc file
 * @param {*} fullPath The path to the .appsemblerc file
 */
export default function generateBlockData(config, fullPath) {
  const { layout, resources, version } = config;
  const { actions, events, parameters } = getFromContext(config, fullPath);

  return {
    actions,
    events,
    layout,
    parameters,
    resources,
    version,
  };
}
