import type { Field, RequiredRequirement } from '../../block';

export default function isRequired(field: Field): boolean {
  const requirements = 'requirements' in field && field.requirements;
  return Boolean(
    'requirements' in field && requirements.find((req) => (req as RequiredRequirement).required),
  );
}
