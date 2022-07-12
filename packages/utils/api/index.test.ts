import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { createValidator } from 'koas-core/lib/validation';
import { parse } from 'yaml';

import { api, schemas } from '.';

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
      const descriptionSchema = path.endsWith('ActionDefinition') ? schema.properties.type : schema;
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
      expect(schema).not.toHaveProperty('oneOf');
      expect(schema).not.toHaveProperty('then');
      expect(schema).not.toHaveProperty('uniqueItems');
      if (schema.required && !schema.additionalProperties) {
        for (const name of schema.required as string[]) {
          // eslint-disable-next-line jest/no-conditional-expect
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

  describe('validation', () => {
    const testsDir = join(__dirname, 'schema-tests');

    describe.each(readdirSync(testsDir))('%s', (name) => {
      const schema = schemas[name as keyof typeof schemas];

      it('should reference an existing schema', () => {
        expect(schemas).toHaveProperty(name);
      });

      describe('valid', () => {
        const valid = join(testsDir, name, 'valid');

        it.each(readdirSync(valid))('%s', async (filename) => {
          const buffer = await readFile(join(valid, filename), 'utf8');
          expect(buffer).toMatch(
            new RegExp(
              `^# yaml-language-server: \\$schema=https://appsemble.app/api.json#/components/schemas/${name}\n`,
            ),
          );
          const instance = parse(buffer);
          const result = validator.validate(instance, schema, { base: '#', nestedErrors: true });
          expect(result.valid).toBe(true);
        });
      });

      describe('invalid', () => {
        const invalid = join(testsDir, name, 'invalid');

        it.each(readdirSync(invalid))('%s', async (filename) => {
          const buffer = await readFile(join(invalid, filename), 'utf8');
          const instance = parse(buffer);
          const result = validator.validate(instance, schema, { base: '#', nestedErrors: true });
          expect(result.valid).toBe(false);
        });
      });
    });
  });
});
