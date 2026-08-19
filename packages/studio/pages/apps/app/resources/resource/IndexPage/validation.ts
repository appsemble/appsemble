import { type JSONSchemaEditorError } from '../../../../../../../components/JSONSchemaEditor/types.js';
import { type Schema, validate } from 'jsonschema';

interface ResourceValidationError {
  argument?: unknown;
  message: string;
  name?: string;
  path: (number | string)[];
}

function formatValidationMessage(message: string): string {
  const sentence = `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

export function normalizeResourceValidationErrors(
  errors: ResourceValidationError[],
  assetPaths?: Map<number, (number | string)[]>,
): JSONSchemaEditorError[] {
  return errors.map((error) => {
    const [root, assetIndex] = error.path;
    const path =
      root === 'assets' && typeof assetIndex === 'number'
        ? (assetPaths?.get(assetIndex) ?? [])
        : error.path;

    return {
      message: formatValidationMessage(error.message),
      path:
        error.name === 'required' && typeof error.argument === 'string'
          ? [...path, error.argument]
          : path,
    };
  });
}

export function validateResourceValue(
  value: unknown,
  schema: Schema,
): JSONSchemaEditorError[] {
  return normalizeResourceValidationErrors(
    validate(value, schema, { skipAttributes: ['type', 'format'] }).errors,
  );
}
