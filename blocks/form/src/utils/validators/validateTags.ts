import { Requirement, type TagsField, type TagsRequirement } from '../../../block.js';

export function validateTags(field: TagsField, value: unknown[]): TagsRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (!Array.isArray(value)) {
      return true;
    }

    if (Requirement.MinItems in requirement && value.length < requirement.minItems!) {
      return true;
    }

    if (Requirement.MaxItems in requirement && value.length > requirement.maxItems!) {
      return true;
    }

    if (
      Requirement.Regex in requirement &&
      value.some((v) => !new RegExp(requirement.regex, requirement.flags || 'g').test(String(v)))
    ) {
      return true;
    }

    if (
      Requirement.Min in requirement &&
      value.some((v) => !Number.isFinite(v) || Number(v) < requirement.min!)
    ) {
      return true;
    }

    if (
      Requirement.Max in requirement &&
      value.some((v) => !Number.isFinite(v) || Number(v) > requirement.max!)
    ) {
      return true;
    }

    return false;
  });
}
