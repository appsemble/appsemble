import type { BaseRequirement, Field, FileField } from 'blocks/form/block';

import { validateNumber } from './validateNumber';
import { validateString } from './validateString';

export const validators: { [name: string]: Validator } = {
  file: (field: FileField, value) => {
    const required = field.requirements?.find((requirement) => requirement.required && !value);

    if (((field.repeated && !(value as File[])?.length) || value == null) && !required) {
      return;
    }

    if (field.accept) {
      if (field.repeated) {
        return (
          !(
            (value as File[]).some((file) => field.accept.includes(file.type)) &&
            (value as File[]).length >= 1
          ) && {}
        );
      }

      // XXX: Implement field requirements
      return !field.accept.includes((value as File).type) && {};
    }
  },
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    !(value.latitude && value.longitude) && {},
  hidden: () => {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  boolean: () => {},
  enum: () => {},
};

type Validator = (
  field: Field,
  value: unknown,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => BaseRequirement | void;
