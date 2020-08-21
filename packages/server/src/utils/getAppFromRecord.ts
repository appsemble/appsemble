import type * as types from '@appsemble/types';
import yaml from 'js-yaml';
import { omit } from 'lodash';

import type * as models from '../models';

/**
 * Normalizes an app record for consistant return values.
 *
 * @param record - The sequelize App model to normalize.
 * @param omittedValues - A list of fields to omit from the result.
 *
 * @returns An app resource that can be safely returned from the API.
 */
export function getAppFromRecord(
  record: models.App,
  omittedValues: (keyof types.App)[] = [],
): Partial<types.App> {
  const result: types.App = {
    id: record.id,
    $created: record.created.toISOString(),
    $updated: record.updated.toISOString(),
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
    screenshotUrls: record.AppScreenshots?.map(
      ({ id }) => `/api/apps/${record.id}/screenshots/${id}`,
    ),
  };

  return omit(result, omittedValues);
}
