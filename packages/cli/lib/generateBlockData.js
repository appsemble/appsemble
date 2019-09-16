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

export function getFromContext({ dir, actions, parameters, types = {} }, fullPath) {
  const { file = 'types.ts', parameters: parametersInterface } = types;
  if (parameters && parametersInterface) {
    throw new AppsembleError(
      'Exacly one of ‘parameters’ and ‘types.parameters’ should be specified. Got both.',
    );
  }
  if (actions && parameters) {
    return { actions, parameters };
  }
  logger.info('Extracting data from TypeScript project');
  const tsConfigPath = path.join(fullPath, 'tsconfig.json');
  const compilerOptions = readTSConfig(tsConfigPath);
  logger.verbose(`Resolved TypeScript compiler options ${JSON.stringify(compilerOptions)}`);
  const program = getProgramFromFiles([path.join(dir, file)], compilerOptions, dir);
  const generator = buildGenerator(program, {
    noExtraProps: true,
    required: true,
  });
  // This name is used for fontawesome icon names. They are excluded from the schema, as they are
  // provided by the Appsemble framework, not by the block itself.
  generator.setSchemaOverride('IconName', {
    type: 'string',
    format: 'fontawesome',
  });
  return {
    actions,
    parameters: generator.getSchemaForSymbol(parametersInterface),
  };
}

export default function generateBlockData(config, fullPath) {
  const { layout, resources, version } = config;
  const { actions, parameters } = getFromContext(config, fullPath);

  return {
    actions,
    layout,
    parameters,
    resources,
    version,
  };
}
