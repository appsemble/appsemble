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
  const data = record.dataValues !== undefined ? record.dataValues : record;
  const result = {
    id: data.id,
    $created: data.created,
    $updated: data.updated,
    domain: data.domain || null,
    path: data.path,
    private: Boolean(data.private),
    iconUrl: `/api/apps/${data.id}/icon`,
    definition: data.definition,
    yaml: data.yaml || yaml.safeDump(data.definition),
    ...(data.RatingCount && {
      rating: {
        average: data.RatingAverage ? Number(data.RatingAverage) : null,
        count: data.RatingCount ? Number(data.RatingCount) : null,
      },
    }),
    OrganizationId: data.OrganizationId,
  };

  return omit(result, omittedValues);
}
