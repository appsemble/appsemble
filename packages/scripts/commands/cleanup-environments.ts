import { logger } from '@appsemble/node-utils';

import { Environment, gitlab } from '../lib/gitlab';

export const command = 'cleanup-environments';
export const description = 'Delete all stopped GitLab review environments';

export async function handler(): Promise<void> {
  const perPage = 20;
  let total = 0;
  let count = perPage;
  while (count >= perPage) {
    const { data: environments } = await gitlab.get<Environment[]>('environments', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { states: 'stopped', search: 'review/', per_page: perPage },
    });
    for (const { id, name } of environments) {
      logger.info(`Deleting stopped environment ${name}`);
      await gitlab.delete(`environments/${id}`);
    }
    count = environments.length;
    total += count;
  }
  logger.info(`Deleted ${total} stopped environments`);
}
