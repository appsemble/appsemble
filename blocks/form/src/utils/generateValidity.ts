import type { Parameters } from '@appsemble/sdk';

export default function generateValidity(
  parameters: Parameters,
  data: any,
): { [field: string]: boolean } {
  return parameters.fields.reduce<{ [field: string]: boolean }>(
    (acc, { defaultValue, name, readOnly, required, type }) => {
      let valid = !required;
      if (required) {
        valid = defaultValue !== undefined;
      }
      if (readOnly) {
        if (required) {
          valid = !!data[name];
        } else {
          valid = true;
        }
      }

      if (type === 'boolean') {
        valid = true;
      }

      acc[name] = valid;
      return acc;
    },
    {},
  );
}
