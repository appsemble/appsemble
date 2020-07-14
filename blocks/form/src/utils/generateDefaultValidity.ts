import type { Parameters } from '@appsemble/sdk';

export default function generateDefaultValidity(
  parameters: Parameters,
  data: any,
): { [field: string]: boolean } {
  return parameters.fields.reduce<{ [field: string]: boolean }>(
    (acc, { defaultValue, name, readOnly, type, ...field }) => {
      const required = Boolean(requirements?.find((req) => (req as RequiredRequirement).required));

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
