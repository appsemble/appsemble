import type * as types from '@appsemble/types';
import yaml from 'js-yaml';
import { omit } from 'lodash';

import type * as models from '../models';

/**
 * Normalizes an app record for consistant return values.
 *
 * @param {Object} record The sequelize App model to normalize.
 * @param {string[]} omittedValues A list of fields to omit from the result.
 */
export default function getAppFromRecord(
  record: models.App,
  omittedValues: (keyof types.App)[] = [],
): Partial<types.App> {
  const result = {
    id: record.id,
    $created: record.created,
    $updated: record.updated,
    domain: record.domain || null,
    path: record.path,
    private: Boolean(record.private),
    iconUrl: `/api/apps/${record.id}/icon`,
    definition: record.definition,
    yaml: record.yaml || yaml.safeDump(record.definition),
    ...(record.get('RatingCount') && {
      rating: {
        average: record.get('RatingAverage') ? Number(record.get('RatingAverage')) : null,
        count: record.get('RatingCount') ? Number(record.get('RatingCount')) : null,
      },
    }),
    ...(record.get('ResourceCount') &&
      record.template && { resources: record.get('ResourceCount') > 0 }),
    OrganizationId: record.OrganizationId,
  };

  return omit(result, omittedValues);
}
