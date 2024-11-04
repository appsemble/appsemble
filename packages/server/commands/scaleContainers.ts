import { stopIdleContainers } from '@appsemble/node-utils';

export const command = 'scale-containers';
export const description =
  'Scales down all deployments of companion containers, which are currently not in use';

export async function handler(): Promise<void> {
  await stopIdleContainers();
  process.exit();
}
