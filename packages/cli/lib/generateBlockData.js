import { AppsembleError, logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import json5 from 'json5';
import path from 'path';
import { buildGenerator, getProgramFromFiles } from 'typescript-json-schema';

export async function getFromContext({ dir, actions, parameters, types = {} }) {
  const { file = 'types.ts', parameters: parametersInterface } = types;
  if (parameters && parametersInterface) {
    throw new AppsembleError(
      'Exacly one of ‘parameters’ and types.parameters’ should be specified. Got both.',
    );
  }
  if (actions && parameters) {
    return { actions, parameters };
  }
  logger.info('Extracting data from TypeScript project');
  const tsConfigPath = path.join(dir, 'tsconfig.json');
  const tsConfigText = await fs.readFile(tsConfigPath, 'utf8');
  const { compilerOptions } = json5.parse(tsConfigText);
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
    parameters: generator.getSchemaForSymbol('Parameters'),
  };
}

export default async function generateBlockData(config) {
  const { layout, resources, version } = config;
  const { actions, parameters } = await getFromContext(config);

  return {
    actions,
    layout,
    parameters,
    resources,
    version,
  };
}
