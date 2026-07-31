import { type Remapper } from '@appsemble/sdk';

import { type FileField, type FileRequirement, Requirement, type Values } from '../../../block.js';

type FileValue = Blob | string;

function testType(acceptedType: string, type: string): boolean {
  return new RegExp(/^[^/]+\/\*$/).test(acceptedType)
    ? acceptedType.slice(0, acceptedType.indexOf('/')) === type?.slice(0, type?.indexOf('/'))
    : acceptedType === type;
}

export function validateFile(
  field: FileField,
  value: FileValue | FileValue[],
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): FileRequirement {
  // @ts-expect-error strictNullChecks not assignable to type
  return field.requirements?.find((requirement) => {
    if (value == null) {
      return Requirement.Required in requirement && Boolean(remap(requirement.required, values));
    }

    if (field.repeated) {
      const files = Array.isArray(value)
        ? value.filter((entry): entry is Blob => typeof entry !== 'string')
        : [];

      if (
        Requirement.Prohibited in requirement &&
        Boolean(remap(requirement.prohibited, values)) &&
        (value as FileValue[]).length
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
        remap(requirement.minLength!, values) > (value as FileValue[]).length
      ) {
        return true;
      }

      if (
        Requirement.MaxLength in requirement &&
        remap(requirement.maxLength!, values) < (value as FileValue[]).length
      ) {
        return true;
      }

      if (
        Requirement.MinSize in requirement &&
        files.some((file) => requirement.minSize! > file.size)
      ) {
        return true;
      }

      if (
        Requirement.MaxSize in requirement &&
        files.some((file) => requirement.maxSize! < file.size)
      ) {
        return true;
      }

      if (Requirement.Accept in requirement) {
        return files.some((file) =>
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
