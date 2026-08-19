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
): JSONSchemaEditorError[] {
  return errors.map((error) => ({
    message: formatValidationMessage(error.message),
    path:
      error.name === 'required' && typeof error.argument === 'string'
        ? [...error.path, error.argument]
        : error.path,
  }));
}

export function validateResourceValue(
  value: unknown,
  schema: Schema,
): JSONSchemaEditorError[] {
  return normalizeResourceValidationErrors(
    validate(value, schema, { skipAttributes: ['type', 'format'] }).errors,
  );
}
