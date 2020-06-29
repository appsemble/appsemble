import type { Remapper } from '@appsemble/sdk';
import type { BaseRequirement, Field, FileField } from 'blocks/form/block';

import validateNumber from './validateNumber';
import validateString from './validateString';

export default {
  file: (field: FileField, value) => {
    const required = field.requirements.find((requirement) => requirement.required && !value);
    if (required) {
      return required;
    }

    if (value === null) {
      return false;
    }

    if (field.accept) {
      if (field.repeated) {
        return (
          ((value as File[]).every((file) => field.accept.includes(file.type)) &&
            (value as File[]).length) >= 1 && {}
        );
      }

      // XXX: Implement field requirements
      return !field.accept.includes((value as File).type) && {};
    }

    return null;
  },
  geocoordinates: (_, value: { longitude: number; latitude: number }) =>
    !(value.latitude && value.longitude) && {},
  hidden: (): boolean => null,
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  boolean: () => null,
} as { [name: string]: Validator };

type Validator = (
  field: Field,
  value: any,
  remap: (remapper: Remapper, data: any) => any,
) => BaseRequirement;
