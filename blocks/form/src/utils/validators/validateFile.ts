import { type FileField, type FileRequirement } from '../../../block.js';

export function validateFile(field: FileField, value: File | File[]): FileRequirement {
  return field.requirements?.find((requirement) => {
    if (
      'required' in requirement &&
      (value == null || (field.repeated && (value as File[]).length === 0))
    ) {
      return true;
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

    if ('accept' in requirement) {
      if (field.repeated) {
        return (value as File[]).some((file) => !requirement.accept.includes(file.type));
      }

      return !requirement.accept.includes((value as File).type);
    }

    return false;
  });
}
