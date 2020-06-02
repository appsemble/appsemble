import { AppsembleError } from '@appsemble/node-utils';
import path from 'path';
import ts from 'typescript';

import getBlockConfigFromTypeScript from './getBlockConfigFromTypeScript';

/**
 * Get the path to a fixture for this file.
 *
 * @param filename The fixture filename to resolve.
 */
function fixture(filename: string): string {
  return path.join(__dirname, '__fixtures__/getBlockConfigFromTypeScript', filename);
}

beforeEach(() => {
  jest.spyOn(process, 'cwd').mockReturnValue(__dirname);
});

describe('getBlockConfigFromTypeScript', () => {
  it('should extract configuration from a TypeScript project', () => {
    const result = getBlockConfigFromTypeScript({
      name: '',
      layout: 'float',
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: fixture('valid'),
    });
    expect(result).toStrictEqual({
      actions: { testAction: {} },
      events: { emit: ['testEmit'], listen: ['testListener'] },
      parameters: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        additionalProperties: false,
        definitions: { IconName: { format: 'fontawesome', type: 'string' } },
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

  it('should not use TypeScript if all metadata is present in the original config', () => {
    jest.spyOn(ts, 'createProgram');
    const input = {
      actions: {},
      events: { emit: [] as string[], listen: [] as string[] },
      layout: 'float',
      parameters: { type: 'object' },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: fixture('valid'),
      name: '',
    } as const;
    const result = getBlockConfigFromTypeScript(input);

    expect(result).toBe(input);
    expect(ts.createProgram).not.toHaveBeenCalled();
  });

  it('should prefer actions overrides over TypeScript actions', () => {
    const result = getBlockConfigFromTypeScript({
      actions: {},
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: fixture('valid'),
      name: '',
    });

    expect(result.actions).toStrictEqual({});
  });

  it('should prefer events overrides over TypeScript events', () => {
    const result = getBlockConfigFromTypeScript({
      events: { emit: ['onSuccess'] },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: fixture('valid'),
      name: '',
    });

    expect(result.events).toStrictEqual({ emit: ['onSuccess'] });
  });

  it('should prefer parameters overrides over TypeScript parameters', () => {
    const result = getBlockConfigFromTypeScript({
      parameters: { type: 'object' },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: fixture('valid'),
      name: '',
    });

    expect(result.parameters).toStrictEqual({ type: 'object' });
  });

  it('should throw if duplicate Actions are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: fixture('duplicateActions'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'Actions' in '__fixtures__/getBlockConfigFromTypeScript/duplicateActions/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventEmitters are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: fixture('duplicateEventEmitters'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventEmitters' in '__fixtures__/getBlockConfigFromTypeScript/duplicateEventEmitters/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventListeners are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: fixture('duplicateEventListeners'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventListeners' in '__fixtures__/getBlockConfigFromTypeScript/duplicateEventListeners/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate Parameters are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: fixture('duplicateParameters'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'Parameters' in '__fixtures__/getBlockConfigFromTypeScript/duplicateParameters/index.ts:31'",
      ),
    );
  });

  it('should handle fontawesome icons', () => {
    const result = getBlockConfigFromTypeScript({
      webpack: '',
      output: '',
      dir: fixture('fontawesomeParameters'),
      name: '',
      version: '1.33.7',
    });

    expect(result).toStrictEqual({
      actions: undefined,
      events: undefined,
      parameters: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        additionalProperties: false,
        definitions: { IconName: { format: 'fontawesome', type: 'string' } },
        properties: { icon: { $ref: '#/definitions/IconName' } },
        type: 'object',
      },
    });
  });

  it('should handle TypeScript pre emit diagnostics', () => {
    function fn(): void {
      getBlockConfigFromTypeScript({
        name: '',
        layout: 'float',
        version: '1.33.7',
        webpack: '',
        output: '',
        dir: fixture('tsError'),
      });
    }
    expect(fn).toThrow(AppsembleError);
    expect(fn).toThrow(/'unused' is declared but its value is never read/);
  });
});
