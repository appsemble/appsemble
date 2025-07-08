import { createValidator } from 'koas-core/lib/validation.js';
import { describe, expect, it } from 'vitest';

import { api } from './index.js';

describe('schemas', () => {
  const document = api('');
  const validator = createValidator(document);
  const entries = Object.entries(validator.schemas);

  describe('boolean', () => {
    it.each(entries.filter(([, schema]) => schema.type === 'boolean'))('%s', (path, schema) => {
      expect(schema).not.toHaveProperty('additionalItems');
      expect(schema).not.toHaveProperty('additionalProperties');
      expect(schema).not.toHaveProperty('allOf');
      expect(schema).not.toHaveProperty('anyOf');
      expect(schema).not.toHaveProperty('const');
      // Expect(schema).toHaveProperty('description');
      expect(schema).not.toHaveProperty('else');
      expect(schema).not.toHaveProperty('enum');
      expect(schema).not.toHaveProperty('exclusiveMaximum');
      expect(schema).not.toHaveProperty('exclusiveMinimum');
      expect(schema).not.toHaveProperty('format');
      expect(schema).not.toHaveProperty('if');
      expect(schema).not.toHaveProperty('maximum');
      expect(schema).not.toHaveProperty('maxItems');
      expect(schema).not.toHaveProperty('maxLength');
      expect(schema).not.toHaveProperty('minimum');
      expect(schema).not.toHaveProperty('minItems');
      expect(schema).not.toHaveProperty('minLength');
      expect(schema).not.toHaveProperty('multipleOf');
      expect(schema).not.toHaveProperty('oneOf');
      expect(schema).not.toHaveProperty('required');
      expect(schema).not.toHaveProperty('then');
      expect(schema).not.toHaveProperty('uniqueItems');
    });
  });

  describe('enum', () => {
    it.each(entries.filter(([, schema]) => schema.enum))('%s', (path, schema) => {
      expect(schema).not.toHaveProperty('additionalItems');
      expect(schema).not.toHaveProperty('additionalProperties');
      expect(schema).not.toHaveProperty('allOf');
      expect(schema).not.toHaveProperty('anyOf');
      expect(schema).not.toHaveProperty('const');
      // Expect(schema).toHaveProperty('description');
      expect(schema).not.toHaveProperty('else');
      expect(schema).not.toHaveProperty('exclusiveMaximum');
      expect(schema).not.toHaveProperty('exclusiveMinimum');
      expect(schema).not.toHaveProperty('format');
      expect(schema).not.toHaveProperty('if');
      expect(schema).not.toHaveProperty('maximum');
      expect(schema).not.toHaveProperty('maxItems');
      expect(schema).not.toHaveProperty('maxLength');
      expect(schema).not.toHaveProperty('minimum');
      expect(schema).not.toHaveProperty('minItems');
      expect(schema).not.toHaveProperty('minLength');
      expect(schema).not.toHaveProperty('multipleOf');
      expect(schema).not.toHaveProperty('oneOf');
      expect(schema).not.toHaveProperty('required');
      expect(schema).not.toHaveProperty('then');
      expect(schema).not.toHaveProperty('type');
      expect(schema).not.toHaveProperty('uniqueItems');
    });
  });

  describe('object', () => {
    it.each(entries.filter(([, schema]) => schema.type === 'object'))('%s', (path, schema) => {
      // Action descriptions are defined on the type property.
      const descriptionSchema = path.endsWith('ActionDefinition')
        ? schema.properties?.type
        : schema;
      const isTabsPageDefinition = path.endsWith('TabsPageDefinition');
      expect(schema).not.toHaveProperty('additionalItems');
      expect(schema).toHaveProperty('additionalProperties');
      expect(schema).not.toHaveProperty('allOf');
      expect(schema).not.toHaveProperty('anyOf');
      expect(schema).not.toHaveProperty('const');
      expect(descriptionSchema).toHaveProperty('description');
      expect(schema).not.toHaveProperty('else');
      expect(schema).not.toHaveProperty('enum');
      expect(schema).not.toHaveProperty('exclusiveMaximum');
      expect(schema).not.toHaveProperty('exclusiveMinimum');
      expect(schema).not.toHaveProperty('format');
      expect(schema).not.toHaveProperty('if');
      expect(schema).not.toHaveProperty('maximum');
      expect(schema).not.toHaveProperty('maxItems');
      expect(schema).not.toHaveProperty('maxLength');
      expect(schema).not.toHaveProperty('minimum');
      expect(schema).not.toHaveProperty('minItems');
      expect(schema).not.toHaveProperty('minLength');
      expect(schema).not.toHaveProperty('multipleOf');
      if (!isTabsPageDefinition) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(schema).not.toHaveProperty('oneOf');
      }
      expect(schema).not.toHaveProperty('then');
      expect(schema).not.toHaveProperty('uniqueItems');
      if (schema.required && !schema.additionalProperties) {
        for (const name of schema.required as string[]) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect(schema.properties).toHaveProperty(name);
        }
      }
    });
  });

  describe('number', () => {
    it.each(entries.filter(([, schema]) => schema.type === 'number' || schema.type === 'integer'))(
      '%s',
      (path, schema) => {
        expect(schema).not.toHaveProperty('additionalItems');
        expect(schema).not.toHaveProperty('additionalProperties');
        expect(schema).not.toHaveProperty('allOf');
        expect(schema).not.toHaveProperty('anyOf');
        expect(schema).not.toHaveProperty('const');
        // Expect(schema).toHaveProperty('description');
        expect(schema).not.toHaveProperty('else');
        expect(schema).not.toHaveProperty('enum');
        expect(schema).not.toHaveProperty('format');
        expect(schema).not.toHaveProperty('if');
        expect(schema).not.toHaveProperty('maxItems');
        expect(schema).not.toHaveProperty('maxLength');
        expect(schema).not.toHaveProperty('minLength');
        expect(schema).not.toHaveProperty('minItems');
        expect(schema).not.toHaveProperty('multipleOf');
        expect(schema).not.toHaveProperty('oneOf');
        expect(schema).not.toHaveProperty('required');
        expect(schema).not.toHaveProperty('then');
        expect(schema).not.toHaveProperty('uniqueItems');
      },
    );
  });

  describe('string', () => {
    it.each(entries.filter(([, schema]) => schema.type === 'string'))('%s', (path, schema) => {
      expect(schema).not.toHaveProperty('additionalItems');
      expect(schema).not.toHaveProperty('additionalProperties');
      expect(schema).not.toHaveProperty('allOf');
      expect(schema).not.toHaveProperty('anyOf');
      expect(schema).not.toHaveProperty('const');
      // Expect(schema).toHaveProperty('description');
      expect(schema).not.toHaveProperty('else');
      expect(schema).not.toHaveProperty('enum');
      expect(schema).not.toHaveProperty('exclusiveMaximum');
      expect(schema).not.toHaveProperty('exclusiveMinimum');
      expect(schema).not.toHaveProperty('if');
      expect(schema).not.toHaveProperty('maximum');
      expect(schema).not.toHaveProperty('maxItems');
      // Expect(schema).toHaveProperty('maxLength');
      expect(schema).not.toHaveProperty('minimum');
      expect(schema).not.toHaveProperty('minItems');
      expect(schema).not.toHaveProperty('multipleOf');
      expect(schema).not.toHaveProperty('oneOf');
      expect(schema).not.toHaveProperty('required');
      expect(schema).not.toHaveProperty('then');
      expect(schema).not.toHaveProperty('uniqueItems');
    });
  });
});
