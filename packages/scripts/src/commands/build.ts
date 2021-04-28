import { resolve } from 'path';

import { logger } from '@appsemble/node-utils';
import { createAppConfig, createStudioConfig } from '@appsemble/webpack-core';
import { rm, writeJson } from 'fs-extra';
import webpack, { compilation, Configuration } from 'webpack';
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
    .option('app-stats', {
      normalize: true,
      description: 'If specified, write Webpack stats for the app build to this file',
    })
    .option('studio-stats', {
      normalize: true,
      description: 'If specified, write Webpack stats for the studio build to this file',
    });
}

interface Args {
  app: boolean;
  appStats: string;
  studio: boolean;
  studioStats: string;
}

export async function handler({ app, appStats, studio, studioStats }: Args): Promise<void> {
  const configurations: Configuration[] = [];
  let appConfig: Configuration;
  let studioConfig: Configuration;
  const outputDir = resolve(__dirname, '..', '..', '..', '..', 'dist');
  logger.warn(`Removing directory: ${outputDir}`);
  await rm(outputDir, { force: true, recursive: true });
  if (app) {
    appConfig = createAppConfig({ mode: 'production' });
    configurations.push(appConfig);
  }
  if (studio) {
    studioConfig = createStudioConfig({ mode: 'production' });
    configurations.push(studioConfig);
  }
  const compiler = webpack(configurations);
  const result = await new Promise<compilation.MultiStats>((resolvePromise, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else if (stats.hasErrors()) {
        reject(stats.toString({ colors: true }));
      } else {
        logger.info(stats.toString({ colors: true, reasons: true }));
        resolvePromise(stats);
      }
    });
  });

  function writeStats(filename: string, config: Configuration): Promise<void> {
    if (filename && config) {
      logger.info(`Writing stats for ${config.name} to ${filename}`);
      return writeJson(filename, result.stats[configurations.indexOf(config)].toJson(), {
        spaces: 2,
      });
    }
  }
  await writeStats(appStats, appConfig);
  await writeStats(studioStats, studioConfig);
}
