import { readdirSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { AppsembleError, resolveFixture } from '@appsemble/node-utils';
import { ts } from 'ts-json-schema-generator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProjectImplementations } from './config.js';

describe('config', () => {
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(resolveFixture('.'));
  });

  describe('getProjectImplementations', () => {
    it('should extract configuration from a TypeScript project', () => {
      const result = getProjectImplementations({
        name: '',
        layout: 'float',
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/valid'),
      });

      expect(result).toStrictEqual({
        actions: { testAction: { description: undefined } },
        events: {
          emit: { testEmit: { description: undefined } },
          listen: { testListener: { description: undefined } },
        },
        messages: undefined,
        parameters: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          additionalProperties: false,
          properties: {
            param1: { type: 'string' },
            param2: { type: 'number' },
            param3: { type: 'boolean' },
            param4: { type: 'string' },
            param5: {
              additionalProperties: false,
              properties: {
                nested1: { type: 'string' },
                nested2: { type: 'number' },
                nested3: { type: 'boolean' },
              },
              required: ['nested1', 'nested2', 'nested3'],
              type: 'object',
            },
            param6: { items: { type: 'string' }, type: 'array' },
          },
          required: ['param1', 'param2', 'param3', 'param5', 'param6'],
          type: 'object',
        },
      });
    });

    // Spying on TypeScript functions no longer works.
    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip('should not use TypeScript if all metadata is present in the original config', () => {
      vi.spyOn(ts, 'createProgram');
      const input = {
        actions: {},
        events: { emit: { foo: {} }, listen: { bar: {} } },
        layout: 'float',
        parameters: { type: 'object' },
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/valid'),
        name: '',
      } as const;
      const result = getProjectImplementations(input);

      expect(result).toBe(input);
      expect(ts.createProgram).not.toHaveBeenCalled();
    });

    it('should prefer actions overrides over TypeScript actions', () => {
      const result = getProjectImplementations({
        actions: {},
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/valid'),
        name: '',
      });

      expect(result.actions).toStrictEqual({});
    });

    it('should prefer events overrides over TypeScript events', () => {
      const result = getProjectImplementations({
        events: { emit: { onSuccess: {} } },
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/valid'),
        name: '',
      });

      expect(result.events).toStrictEqual({ emit: { onSuccess: {} } });
    });

    it('should prefer parameters overrides over TypeScript parameters', () => {
      const result = getProjectImplementations({
        parameters: { type: 'object' },
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/valid'),
        name: '',
      });

      expect(result.parameters).toStrictEqual({ type: 'object' });
    });

    it('should throw if duplicate Actions are found', () => {
      expect(() =>
        getProjectImplementations({
          webpack: '',
          output: '',
          dir: resolveFixture('getProjectImplementations/duplicateActions'),
          name: '',
          version: '1.33.7',
        }),
      ).toThrowError(
        new AppsembleError(
          "Found duplicate interface 'Actions' in 'getProjectImplementations/duplicateActions/index.ts:31'",
        ),
      );
    });

    it('should throw if duplicate EventEmitters are found', () => {
      expect(() =>
        getProjectImplementations({
          webpack: '',
          output: '',
          dir: resolveFixture('getProjectImplementations/duplicateEventEmitters'),
          name: '',
          version: '1.33.7',
        }),
      ).toThrowError(
        new AppsembleError(
          "Found duplicate interface 'EventEmitters' in 'getProjectImplementations/duplicateEventEmitters/index.ts:31'",
        ),
      );
    });

    it('should throw if duplicate EventListeners are found', () => {
      expect(() =>
        getProjectImplementations({
          webpack: '',
          output: '',
          dir: resolveFixture('getProjectImplementations/duplicateEventListeners'),
          name: '',
          version: '1.33.7',
        }),
      ).toThrowError(
        new AppsembleError(
          "Found duplicate interface 'EventListeners' in 'getProjectImplementations/duplicateEventListeners/index.ts:31'",
        ),
      );
    });

    it('should throw if duplicate Parameters are found', () => {
      expect(() =>
        getProjectImplementations({
          webpack: '',
          output: '',
          dir: resolveFixture('getProjectImplementations/duplicateParameters'),
          name: '',
          version: '1.33.7',
        }),
      ).toThrowError(
        new AppsembleError(
          "Found duplicate interface 'Parameters' in 'getProjectImplementations/duplicateParameters/index.ts:31'",
        ),
      );
    });

    it('should handle fontawesome icons', () => {
      const result = getProjectImplementations({
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/fontawesomeParameters'),
        name: '',
        version: '1.33.7',
      });

      expect(result).toStrictEqual({
        actions: undefined,
        events: undefined,
        messages: undefined,
        parameters: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          additionalProperties: false,
          properties: {
            icon: { description: 'This is an icon.', format: 'fontawesome', type: 'string' },
          },
          type: 'object',
        },
      });
    });

    it('should handle TypeScript pre emit diagnostics', () => {
      function fn(): void {
        getProjectImplementations({
          name: '',
          layout: 'float',
          version: '1.33.7',
          webpack: '',
          output: '',
          dir: resolveFixture('getProjectImplementations/tsError'),
        });
      }

      expect(fn).toThrowError(AppsembleError);
      expect(fn).toThrowError(/'unused' is declared but its value is never read/);
    });

    it('should extract comments', () => {
      const result = getProjectImplementations({
        name: '',
        layout: 'float',
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: resolveFixture('getProjectImplementations/comments'),
      });

      expect(result).toStrictEqual({
        actions: {
          comment: {
            description: 'Valid action comment',
          },
          duplicate: {
            description: 'Expected comment',
          },
          line: {
            description: undefined,
          },
        },
        events: {
          emit: {
            testEmit: {
              description: 'Test event emitter.',
            },
          },
          listen: {
            testListener: {
              description: 'Test event listener.',
            },
          },
        },
        messages: undefined,
        parameters: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          additionalProperties: false,
          properties: {
            param: {},
          },
          required: ['param'],
          type: 'object',
        },
      });
    });

    describe('official blocks', () => {
      const blocksDir = new URL('../../../blocks/', import.meta.url);

      it.each(readdirSync(blocksDir))('%s', (name) => {
        const dir = fileURLToPath(new URL(name, blocksDir));

        const result = getProjectImplementations({
          name,
          version: '',
          output: '',
          webpack: undefined,
          dir,
        });

        expect(result).toMatchSnapshot();
      });
    });
  });
});
