import { getValidTrainings, logger } from '@appsemble/node-utils';

import { Training } from '../models/main/Training.js';
import { getDB } from '../models/index.js';
import { withDatabaseMaintenanceLock } from './sqlUtils.js';

/**
 * Makes sure that each individual training document has its reference stored on the database
 *
 * @param path The absolute path to read the trainings from
 */
async function syncTrainingsUnlocked(path: string): Promise<void> {
  const localTrainingIds = await getValidTrainings(path);

  // Trainings already stored on the database
  const dbTrainings = await Training.findAll({ attributes: ['id'] });
  for (const training of dbTrainings) {
    const relatedDoc = localTrainingIds.includes(training.id);
    if (!relatedDoc) {
      logger.warn(
        `Can no longer find a training document related to "${training.id}". Deleting database entry.`,
      );
      await training.destroy();
    }
  }

  // Trainings stored in ./trainings
  for (const localTrainingId of localTrainingIds) {
    const storedOnDb = dbTrainings.some((training) => training.id === localTrainingId);
    if (storedOnDb) {
      continue;
    }

    logger.warn(
      `New training document found called "${localTrainingId}". Creating new database entry`,
    );
    await Training.create({ id: localTrainingId });
  }
}

export function syncTrainings(path: string): Promise<void> {
  return withDatabaseMaintenanceLock(getDB(), () => syncTrainingsUnlocked(path));
}
