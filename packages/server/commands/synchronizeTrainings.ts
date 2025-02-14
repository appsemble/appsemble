import { syncTrainings } from '../utils/syncTrainings.js';

export const command = 'synchronize-trainings';
export const description =
  'Checks the training folder for training documents and makes sure they are synchronized with the database';

export function handler(): void {
  syncTrainings('trainings');
}
