import type { Field, RequiredRequirement, StringField } from '../../block';

export function isRequired(field: Field): boolean {
  return Boolean(
    (field as StringField)?.requirements?.some(({ required }: RequiredRequirement) => required),
  );
}
