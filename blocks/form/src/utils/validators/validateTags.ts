import { type TagsField, type TagsRequirement } from '../../../block.js';

export function validateTags(field: TagsField, value: unknown[]): TagsRequirement {
  return field.requirements?.find((requirement) => {
    if (!Array.isArray(value)) {
      return true;
    }

    if ('minItems' in requirement && value.length < requirement.minItems) {
      return true;
    }

    if ('maxItems' in requirement && value.length > requirement.maxItems) {
      return true;
    }

    if (
      'regex' in requirement &&
      value.some((v) => !new RegExp(requirement.regex, requirement.flags || 'g').test(String(v)))
    ) {
      return true;
    }

    if (
      'min' in requirement &&
      value.some((v) => !Number.isFinite(v) || Number(v) < requirement.min)
    ) {
      return true;
    }

    if (
      'max' in requirement &&
      value.some((v) => !Number.isFinite(v) || Number(v) > requirement.max)
    ) {
      return true;
    }

    return false;
  });
}
