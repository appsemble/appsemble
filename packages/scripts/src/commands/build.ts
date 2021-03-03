import { logger } from '@appsemble/node-utils';
import { createAppConfig, createStudioConfig } from '@appsemble/webpack-core';
import { writeJson } from 'fs-extra';
import webpack, { Configuration } from 'webpack';
import { Argv } from 'yargs';

export const command = 'build';
export const description = 'Build the Appsemble core using Webpack';

export function builder(argv: Argv): Argv {
  return argv
    .option('app', {
      type: 'boolean',
      default: true,
      description: 'Disable this flag to skip building @appsemble/app',
    })
    .option('studio', {
      type: 'boolean',
      default: true,
      description: 'Disable this flag to skip building @appsemble/studio',
    })
    .option('stats', {
      normalize: true,
      description: 'If enabled, write stats to stats.json in the project root',
    });
}

interface Args {
  app: boolean;
  studio: boolean;
  stats: string;
}

export async function handler({ app, stats: statsFile, studio }: Args): Promise<void> {
  const configurations: Configuration[] = [];
  if (app) {
    configurations.push(createAppConfig({ mode: 'production' }));
  }
  if (studio) {
    configurations.push(createStudioConfig({ mode: 'production' }));
  }
  const compiler = webpack(configurations);
  const result = await new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else if (stats.hasErrors()) {
        reject(stats.toString({ colors: true }));
      } else {
        logger.info(stats.toString({ colors: true, reasons: true }));
        resolve(stats);
      }
    });
  });
  if (statsFile) {
    await writeJson(statsFile, result, { spaces: 2 });
  }
}
