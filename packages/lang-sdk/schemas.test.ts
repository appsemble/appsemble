import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { BaseValidatorFactory, schemas } from './index.js';

describe('validation', () => {
  const validator = new BaseValidatorFactory({ schemas }).build();
  const testsDir = new URL('schema-tests/', import.meta.url);

  describe.each(readdirSync(testsDir))('%s', (name) => {
    const schema = schemas[name as keyof typeof schemas];

    it('should reference an existing schema', () => {
      expect(schemas).toHaveProperty(name);
    });

    describe('valid', () => {
      const valid = new URL(`${name}/valid/`, testsDir);

      it.each(readdirSync(valid))('%s', async (filename) => {
        const buffer = await readFile(new URL(filename, valid), 'utf8');
        // TODO: update
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
      const invalid = new URL(`${name}/invalid/`, testsDir);

      it.each(readdirSync(invalid))('%s', async (filename) => {
        const buffer = await readFile(new URL(filename, invalid), 'utf8');
        const instance = parse(buffer);
        const result = validator.validate(instance, schema, { base: '#', nestedErrors: true });
        expect(result.valid).toBe(false);
      });
    });
  });
});
