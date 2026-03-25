import { ValidationError } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { printAxiosError } from './output.js';

describe('printAxiosError', () => {
  it('should resolve line and column numbers through YAML aliases', () => {
    const yaml = `formFields: &fields
  - type: fieldset
    requirements:
      - minItems: 1
form:
  fields: *fields
`;

    const result = printAxiosError('app-definition.yaml', yaml, [
      new ValidationError('is invalid', 'fieldset', undefined, ['form', 'fields', 0, 'type']),
      new ValidationError('must be larger', 1, undefined, [
        'form',
        'fields',
        0,
        'requirements',
        0,
        'minItems',
      ]),
    ]);

    expect(result).toBe(
      ['app-definition.yaml:2:11 is invalid', 'app-definition.yaml:4:19 must be larger'].join('\n'),
    );
  });

  it('should keep reporting direct YAML paths', () => {
    const yaml = `name: Test App
`;

    const result = printAxiosError('app-definition.yaml', yaml, [
      new ValidationError('is invalid', 'Test App', undefined, ['name']),
    ]);

    expect(result).toBe('app-definition.yaml:1:7 is invalid');
  });
});
