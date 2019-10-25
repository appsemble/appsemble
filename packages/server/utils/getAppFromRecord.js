import yaml from 'js-yaml';

export default function getAppFromRecord(record) {
  return {
    id: record.id,
    $created: record.created,
    $updated: record.updated,
    path: record.path,
    private: Boolean(record.private),
    iconUrl: `/api/apps/${record.id}/icon`,
    definition: record.definition,
    yaml: record.yaml || yaml.safeDump(record.definition),
    OrganizationId: record.OrganizationId,
  };
}
