import yaml from 'js-yaml';

export default function getAppFromRecord(record) {
  return {
    ...record.definition,
    id: record.id,
    organizationId: record.OrganizationId,
    yaml: record.yaml || yaml.safeDump(record.definition),
  };
}
