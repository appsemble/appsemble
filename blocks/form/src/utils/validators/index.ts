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
        const length = (value as File[])?.length;
        const allValidTypes = (value as File[])?.every(
          (v) => !field.accept || field.accept.includes(v.type),
        );

        return !length || !allValidTypes ? {} : undefined;
      }

      // XXX: Implement field requirements
      return field.accept.includes((value as File).type) ? undefined : {};
    }
  },
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    value.latitude && value.longitude ? undefined : {},
  hidden: () => {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  boolean: () => {},
  radio: () => {},
  enum: () => {},
};

type Validator = (
  field: Field,
  value: unknown,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => BaseRequirement | void;
