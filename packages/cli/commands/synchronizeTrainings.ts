import { type ServeArguments } from './serve.js';
import { serverImport } from '../lib/serverImport.js';

export const command = 'synchronize-trainings';
export const description =
  'Checks the training folder for training documents and makes sure they are synchronized with the database';

export async function handler(argv: ServeArguments): Promise<void> {
  const { setArgv, synchronizeTrainings } = await serverImport('setArgv', 'synchronizeTrainings');

  setArgv(argv);
  return synchronizeTrainings();
}
