import { type BlockUtils, type Remapper } from '@appsemble/sdk';
import { has } from '@appsemble/utils';

import { validateDateTime } from './validateDateTime.js';
import { validateEnum } from './validateEnum.js';
import { validateFile } from './validateFile.js';
import { validateNumber } from './validateNumber.js';
import { validateRadio } from './validateRadio.js';
import { validateSelection } from './validateSelection.js';
import { validateString } from './validateString.js';
import { validateTags } from './validateTags.js';
import { type BaseRequirement, type Field, type Values } from '../../../block.js';
import { getValueByNameSequence } from '../getNested.js';
import { isRequired } from '../requirements.js';
import { validateMarkdown } from './validateMarkdown.js';

export const validators: Record<string, Validator> = {
  date: validateDateTime,
  'date-time': validateDateTime,
  enum: validateEnum,
  radio: validateRadio,
  file: validateFile,
  geocoordinates: (field, value: { longitude: number; latitude: number }) =>
    value?.latitude && value?.longitude ? undefined : {},
  string: validateString,
  number: validateNumber,
  integer: validateNumber,
  tags: validateTags,
  selection: validateSelection,
  markdown: validateMarkdown,
};

type Validator = (
  field: Field,
  value: unknown,
  remap?: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
) => BaseRequirement;

/**
 * Validate a field based on its set of requirements.
 *
 * @param field The field to validate.
 * @param values The values of all form fields.
 * @param utils Utility functions used in the validation process.
 * @param defaultError The default error message if a specific one
 *   isn’t defined for a specific requirement.
 * @param defaultValue The default value of this field.
 * @param prefix The sequence of field names that lead to the passed in field separated by a `"."`.
 * @returns - A string containing an error message
 *   or a boolean value indicating that there is an error.
 */
export function validate(
  field: Field,
  values: any,
  utils: BlockUtils,
  defaultError: Remapper,
  defaultValue: any,
  prefix = '',
): boolean | string {
  let value = getValueByNameSequence(prefix ? `${prefix}.${field.name}` : field.name, values);
  value = typeof value === 'string' ? value.trim() : value;

  if (!has(validators, field.type)) {
    return;
  }

  if (
    !isRequired(field, utils, values) &&
    !['selection', 'tags'].includes(field.type) &&
    value === defaultValue
  ) {
    // Consider empty/unchanged fields that aren’t required as valid.
    return;
  }

  const requirement = validators[field.type](field, value, utils.remap, values);
  if (requirement) {
    return (
      (utils.remap(requirement.errorMessage, value) as string) ||
      (utils.remap(defaultError, value) as string) ||
      true
    );
  }
}
