import { Block, BlockDefinition } from '@appsemble/types';

import reducer, { BlockDefAction, initialState } from './blockDefs';

describe('reducer', () => {
  const exampleBlock: Block = { type: '@appsemble/test', version: '0.0.0' };

  it('returns the default state', () => {
    const result = reducer(undefined, ({} as unknown) as BlockDefAction);
    expect(result).toStrictEqual(initialState);
  });

  it('handles GET_START actions', () => {
    const result = reducer(initialState, { type: 'blockDefs/GET_START', pending: [exampleBlock] });
    expect(result).toStrictEqual({ ...initialState, pending: [exampleBlock] });
  });

  it('handles GET_SUCCESS actions', () => {
    const blockDef: BlockDefinition = {
      name: exampleBlock.type,
      version: exampleBlock.version,
      description: 'This is a test block',
      layout: 'grow',
      files: ['example.js'],
    };

    const result = reducer(
      { ...initialState, pending: [exampleBlock] },
      {
        type: 'blockDefs/GET_SUCCESS',
        blockDef,
      },
    );

    expect(result).toStrictEqual({
      ...initialState,
      pending: [],
      blockDefs: { '@appsemble/test@0.0.0': blockDef },
    });
  });

  it('handles GET_ERROR actions', () => {
    const result = reducer(
      { ...initialState, pending: [exampleBlock] },
      { type: 'blockDefs/GET_ERROR', blockDefId: '@appsemble/test@0.0.0' },
    );

    expect(result).toStrictEqual({
      pending: [exampleBlock],
      blockDefs: {},
      errored: new Set(['@appsemble/test@0.0.0']),
    });
  });
});
