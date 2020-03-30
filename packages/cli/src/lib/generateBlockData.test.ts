import { AppsembleError } from '@appsemble/node-utils';
import path from 'path';
import * as ts from 'typescript';

import generateBlockData from './generateBlockData';

/**
 * Get the path to a fixture for this file.
 *
 * @param filename The fixture filename to resolve.
 */
function fixture(filename: string): string {
  return path.join(__dirname, '__fixtures__/generateBlockData', filename);
}

describe('generateBlockData', () => {
  it('should extract configuration from a TypeScript project', () => {
    const result = generateBlockData(
      { id: '', layout: 'float', version: '1.33.7', webpack: '', dist: '', output: '', dir: '' },
      path.join(__dirname, '__fixtures__/generateBlockData/valid'),
    );
    expect(result).toStrictEqual({
      description: undefined,
      name: '',
      layout: 'float',
      resources: undefined,
      version: '1.33.7',
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
    const result = generateBlockData(
      {
        actions: {},
        events: { emit: [], listen: [] },
        layout: 'float',
        parameters: { type: 'object' },
        version: '1.33.7',
        webpack: '',
        dist: '',
        output: '',
        dir: '',
        id: '',
      },
      fixture('valid'),
    );

    expect(result).toStrictEqual({
      description: undefined,
      name: '',
      actions: {},
      events: { emit: [], listen: [] },
      layout: 'float',
      parameters: { type: 'object' },
      resources: undefined,
      version: '1.33.7',
    });
    expect(ts.createProgram).not.toHaveBeenCalled();
  });

  it('should prefer actions overrides over TypeScript actions', () => {
    const result = generateBlockData(
      { actions: {}, version: '1.33.7', webpack: '', dist: '', output: '', dir: '', id: '' },
      fixture('valid'),
    );

    expect(result.actions).toStrictEqual({});
  });

  it('should prefer events overrides over TypeScript events', () => {
    const result = generateBlockData(
      {
        events: { emit: ['onSuccess'] },
        version: '1.33.7',
        webpack: '',
        dist: '',
        output: '',
        dir: '',
        id: '',
      },
      fixture('valid'),
    );

    expect(result.events).toStrictEqual({ emit: ['onSuccess'] });
  });

  it('should prefer parameters overrides over TypeScript parameters', () => {
    const result = generateBlockData(
      {
        parameters: { type: 'object' },
        version: '1.33.7',
        webpack: '',
        dist: '',
        output: '',
        dir: '',
        id: '',
      },
      fixture('valid'),
    );

    expect(result.parameters).toStrictEqual({ type: 'object' });
  });

  it('should throw if duplicate Actions are found', () => {
    expect(() =>
      generateBlockData(
        {
          webpack: '',
          dist: '',
          output: '',
          dir: '',
          id: '',
          version: '1.33.7',
        },
        fixture('duplicateActions'),
      ),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'Actions' in 'packages/cli/src/lib/__fixtures__/generateBlockData/duplicateActions/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventEmitters are found', () => {
    expect(() =>
      generateBlockData(
        {
          webpack: '',
          dist: '',
          output: '',
          dir: '',
          id: '',
          version: '1.33.7',
        },
        fixture('duplicateEventEmitters'),
      ),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventEmitters' in 'packages/cli/src/lib/__fixtures__/generateBlockData/duplicateEventEmitters/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventListeners are found', () => {
    expect(() =>
      generateBlockData(
        {
          webpack: '',
          dist: '',
          output: '',
          dir: '',
          id: '',
          version: '1.33.7',
        },
        fixture('duplicateEventListeners'),
      ),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventListeners' in 'packages/cli/src/lib/__fixtures__/generateBlockData/duplicateEventListeners/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate Parameters are found', () => {
    expect(() =>
      generateBlockData(
        {
          webpack: '',
          dist: '',
          output: '',
          dir: '',
          id: '',
          version: '1.33.7',
        },
        fixture('duplicateParameters'),
      ),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'Parameters' in 'packages/cli/src/lib/__fixtures__/generateBlockData/duplicateParameters/index.ts:31'",
      ),
    );
  });

  it('should handle fontawesome icons', () => {
    const result = generateBlockData(
      {
        webpack: '',
        dist: '',
        output: '',
        dir: '',
        id: '',
        version: '1.33.7',
      },
      fixture('fontawesomeParameters'),
    );

    expect(result).toStrictEqual({
      description: undefined,
      name: '',
      layout: undefined,
      resources: undefined,
      version: '1.33.7',
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
      generateBlockData(
        {
          id: '',
          layout: 'float',
          version: '1.33.7',
          webpack: '',
          dist: '',
          output: '',
          dir: '',
        },
        path.join(__dirname, '__fixtures__/generateBlockData/tsError'),
      );
    }
    expect(fn).toThrow(AppsembleError);
    expect(fn).toThrow(/'unused' is declared but its value is never read/);
  });
});
