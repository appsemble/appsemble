import { type Remapper } from '@appsemble/sdk';

import { type FileField, type FileRequirement, Requirement, type Values } from '../../../block.js';

function testType(acceptedType: string, type: string): boolean {
  return new RegExp(/^[^/]+\/\*$/).test(acceptedType)
    ? acceptedType.slice(0, acceptedType.indexOf('/')) === type?.slice(0, type?.indexOf('/'))
    : acceptedType === type;
}

export function validateFile(
  field: FileField,
  value: File | File[],
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): FileRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (value == null) {
      return Requirement.Required in requirement && Boolean(remap(requirement.required, values));
    }

    if (field.repeated) {
      if (
        Requirement.Prohibited in requirement &&
        Boolean(remap(requirement.prohibited, values)) &&
        (value as File[]).length
      ) {
        return true;
      }

      // Allows existing asset id values
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((entry) => typeof entry === 'string')
      ) {
        return false;
      }

      if (
        Requirement.MinLength in requirement &&
        remap(requirement.minLength!, values) > (value as File[]).length
      ) {
        return true;
      }

      if (
        Requirement.MaxLength in requirement &&
        remap(requirement.maxLength!, values) < (value as File[]).length
      ) {
        return true;
      }

      if (
        Requirement.MinSize in requirement &&
        (value as File[]).some((file) => requirement.minSize! > file.size)
      ) {
        return true;
      }

      if (
        Requirement.MaxSize in requirement &&
        (value as File[]).some((file) => requirement.maxSize! < file.size)
      ) {
        return true;
      }

      if (Requirement.Accept in requirement) {
        return (value as File[]).some((file) =>
          requirement.accept.every((type) => !testType(type, file?.type)),
        );
      }
    } else {
      if (
        Requirement.Prohibited in requirement &&
        Boolean(remap(requirement.prohibited, values)) &&
        (value as File)
      ) {
        return true;
      }

      // Allows existing asset id values
      if (typeof value === 'string') {
        return false;
      }

      if (Requirement.MinSize in requirement && requirement.minSize! > (value as File).size) {
        return true;
      }

      if (Requirement.MaxSize in requirement && requirement.maxSize! < (value as File).size) {
        return true;
      }

      if (Requirement.Accept in requirement) {
        return requirement.accept.every((type) => !testType(type, (value as File)?.type));
      }
    }

    return false;
  });
}
