import yaml from 'js-yaml';
import { omit } from 'lodash';

/**
 * Normalizes an app record for consistant return values.
 *
 * @param {Object} record The sequelize App model to normalize.
 * @param {string[]} omittedValues A list of fields to omit from the result.
 */
export default function getAppFromRecord(record, omittedValues = []) {
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
    rating: {
      average: record.RatingAverage ? Number(record.RatingAverage) : null,
      count: record.RatingCount ? Number(record.RatingCount) : null,
    },
    OrganizationId: record.OrganizationId,
  };

  return omit(result, omittedValues);
}
