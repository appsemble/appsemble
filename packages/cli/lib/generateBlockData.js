import { AppsembleError, logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import path from 'path';
import { readConfigFile } from 'typescript';
import { buildGenerator, getProgramFromFiles } from 'typescript-json-schema';

/**
 * Recursively read an extended TypeScript configuration file.
 *
 * @param {string} tsConfigPath The path to the `tsconfig.json` file to read.
 * @returns {Object} The resolved compiler options.
 */
function readTSConfig(tsConfigPath) {
  logger.verbose(`Reading extended tsconfig file ${tsConfigPath}`);
  const { config, error } = readConfigFile(tsConfigPath, p => fs.readFileSync(p, 'utf8'));
  if (error) {
    throw new AppsembleError(error.messageText);
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'extends')) {
    return config.compilerOptions;
  }
  const { dir, name, ext } = path.parse(config.extends);
  return {
    ...readTSConfig(path.resolve(path.dirname(tsConfigPath), dir, `${name}${ext || '.json'}`)),
    ...config.compilerOptions,
  };
}

export function getFromContext({ actions, dir, events, parameters, types = {} }, fullPath) {
  const {
    file = 'block.ts',
    parameters: parametersInterface = 'Parameters',
    events: { listen: listenType = 'EventListeners', emit: emitType = 'EventEmitters' },
  } = types;

  let generator;

  function getGenerator() {
    if (!generator) {
      logger.info('Extracting data from TypeScript project');
      const tsConfigPath = path.join(fullPath, 'tsconfig.json');
      const compilerOptions = readTSConfig(tsConfigPath);
      logger.verbose(`Resolved TypeScript compiler options ${JSON.stringify(compilerOptions)}`);
      const program = getProgramFromFiles([path.join(dir, file)], compilerOptions, dir);
      generator = buildGenerator(program, {
        noExtraProps: true,
        required: true,
      });
      // This name is used for fontawesome icon names. They are excluded from the schema, as they are
      // provided by the Appsemble framework, not by the block itself.
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
    if (listenType || emitType) {
      if (events) {
        throw new AppsembleError(
          'Exacly one of ‘parameters’ and ‘types.parameters’ should be specified. Got both.',
        );
      }

      return {
        listen: getGenerator().getSchemaForSymbol(listenType).enum,
        emit: getGenerator().getSchemaForSymbol(emitType).enum,
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
