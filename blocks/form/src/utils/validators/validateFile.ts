import { type FileField, type FileRequirement } from '../../../block.js';

function testType(acceptedType: string, type: string): boolean {
  return new RegExp(/^[^/]+\/\*$/).test(acceptedType)
    ? acceptedType.slice(0, acceptedType.indexOf('/')) === type?.slice(0, type?.indexOf('/'))
    : acceptedType === type;
}

export function validateFile(field: FileField, value: File | File[]): FileRequirement {
  return field.requirements?.find((requirement) => {
    if (
      'required' in requirement &&
      (value == null || (field.repeated && (value as File[]).length === 0))
    ) {
      return true;
    }

    // Allows existing asset id values
    if (typeof value === 'string') {
      return false;
    }

    if (
      'maxLength' in requirement &&
      field.repeated &&
      requirement.maxLength < (value as File[]).length
    ) {
      return true;
    }

    if (
      'minLength' in requirement &&
      field.repeated &&
      requirement.minLength > (value as File[]).length
    ) {
      return true;
    }

    if (field.repeated) {
      if (
        'minSize' in requirement &&
        (value as File[]).some((file) => requirement.minSize > file.size)
      ) {
        return true;
      }

      if (
        'maxSize' in requirement &&
        (value as File[]).some((file) => requirement.maxSize < file.size)
      ) {
        return true;
      }
    } else {
      if ('minSize' in requirement && requirement.minSize > (value as File).size) {
        return true;
      }

      if ('maxSize' in requirement && requirement.maxSize < (value as File).size) {
        return true;
      }
    }

    if ('accept' in requirement) {
      if (field.repeated) {
        return (value as File[]).some((file) =>
          requirement.accept.every((type) => !testType(type, file?.type)),
        );
      }

      return requirement.accept.every((type) => !testType(type, (value as File)?.type));
    }

    return false;
  });
}
