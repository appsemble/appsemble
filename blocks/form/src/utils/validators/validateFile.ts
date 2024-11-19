import { type FileField, type FileRequirement, Requirement } from '../../../block.js';

function testType(acceptedType: string, type: string): boolean {
  return new RegExp(/^[^/]+\/\*$/).test(acceptedType)
    ? acceptedType.slice(0, acceptedType.indexOf('/')) === type?.slice(0, type?.indexOf('/'))
    : acceptedType === type;
}

export function validateFile(field: FileField, value: File | File[]): FileRequirement {
  return field.requirements?.find((requirement) => {
    if (value == null) {
      return Requirement.Required in requirement;
    }

    if (field.repeated) {
      if (Requirement.Prohibited in requirement && (value as File[]).length) {
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
        requirement.minLength > (value as File[]).length
      ) {
        return true;
      }

      if (
        Requirement.MaxLength in requirement &&
        requirement.maxLength < (value as File[]).length
      ) {
        return true;
      }

      if (
        Requirement.MinSize in requirement &&
        (value as File[]).some((file) => requirement.minSize > file.size)
      ) {
        return true;
      }

      if (
        Requirement.MaxSize in requirement &&
        (value as File[]).some((file) => requirement.maxSize < file.size)
      ) {
        return true;
      }

      if (Requirement.Accept in requirement) {
        return (value as File[]).some((file) =>
          requirement.accept.every((type) => !testType(type, file?.type)),
        );
      }
    } else {
      if (Requirement.Prohibited in requirement && (value as File)) {
        return true;
      }

      // Allows existing asset id values
      if (typeof value === 'string') {
        return false;
      }

      if (Requirement.MinSize in requirement && requirement.minSize > (value as File).size) {
        return true;
      }

      if (Requirement.MaxSize in requirement && requirement.maxSize < (value as File).size) {
        return true;
      }

      if (Requirement.Accept in requirement) {
        return requirement.accept.every((type) => !testType(type, (value as File)?.type));
      }
    }

    return false;
  });
}
