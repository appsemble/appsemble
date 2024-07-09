import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'scale-containers';
export const description =
  'Scales down all deployments of companion containers, which are currently not in use';

export function builder(yargs: Argv): Argv<any> {
  return yargs.option('interval', {
    desc: 'The time in minutes to perform the operation. Defaults to 10 minutes',
    default: 10,
  });
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { scaleContainers, setArgv } = await serverImport('setArgv', 'scaleContainers');

  setArgv(argv);
  return scaleContainers();
}
