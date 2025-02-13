import { readdir, readFile } from 'node:fs/promises';

import { type TrainingChapterProperties } from '@appsemble/types';

import { logger } from './logger.js';

/**
 * Returns all the directory names that are specified in the
 * 'trainingOrder' of the chapters' `properties.json`
 *
 * @param path The absolute path to read the trainings from
 * @returns List of the directory names that contain valid trainings
 */
export async function getValidTrainings(path: string): Promise<string[]> {
  const chapters = await readdir(path);
  const trainingIds: string[] = [];

  for (const chapterDirectory of chapters) {
    let properties: TrainingChapterProperties;
    try {
      properties = JSON.parse(
        await readFile(`${path}/${chapterDirectory}/properties.json`, 'utf8'),
      );
    } catch {
      logger.error(`Chapter directory "${chapterDirectory}" is missing a 'properties.json' file`);
      continue;
    }

    const missingProperties = ['blockedBy', 'title', 'trainingOrder'].filter(
      (prop) => !Object.prototype.hasOwnProperty.call(properties, prop),
    );

    if (missingProperties.length > 0) {
      logger.error(`Missing properties [${missingProperties}] in "properties.json"`);
      continue;
    }

    for (const trainingDirectory of properties.trainingOrder) {
      try {
        await readdir(`${path}/${chapterDirectory}/${trainingDirectory}`);
      } catch {
        logger.error(`Could not find "${trainingDirectory}"`);
        continue;
      }

      try {
        await readFile(`${path}/${chapterDirectory}/${trainingDirectory}/index.md`);
      } catch {
        logger.error(`Training "${trainingDirectory}" is missing an index.md`);
        continue;
      }

      trainingIds.push(trainingDirectory);
    }
  }

  return trainingIds;
}
