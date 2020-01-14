import getAppBlocks from './getAppBlocks';

describe('getAppBlocks', () => {
  it('should create a mapping of blocks paths to the actual block', () => {
    const definition = {
      pages: [
        {
          blocks: [{ type: 'test' }, { type: 'test' }],
        },
      ],
    };
    const result = getAppBlocks(definition);
    expect(result).toStrictEqual({
      'pages.0.blocks.0': {
        type: 'test',
      },
      'pages.0.blocks.1': {
        type: 'test',
      },
    });
    expect(result['pages.0.blocks.0']).toBe(definition.pages[0].blocks[0]);
    expect(result['pages.0.blocks.1']).toBe(definition.pages[0].blocks[1]);
  });

  it('should handle blocks nested by actions', () => {
    const definition = {
      pages: [
        {
          blocks: [
            {
              actions: {
                onSomeAction: {
                  blocks: [{ type: 'test' }, { type: 'test' }],
                },
              },
            },
          ],
        },
      ],
    };
    const result = getAppBlocks(definition);
    expect(result).toStrictEqual({
      'pages.0.blocks.0': {
        actions: {
          onSomeAction: {
            blocks: [
              {
                type: 'test',
              },
              {
                type: 'test',
              },
            ],
          },
        },
      },
      'pages.0.blocks.0.actions.onSomeAction.blocks.0': { type: 'test' },
      'pages.0.blocks.0.actions.onSomeAction.blocks.1': { type: 'test' },
    });
    expect(result['pages.0.blocks.0']).toBe(definition.pages[0].blocks[0]);
    expect(result['pages.0.blocks.0.actions.onSomeAction.blocks.0']).toBe(
      definition.pages[0].blocks[0].actions.onSomeAction.blocks[0],
    );
    expect(result['pages.0.blocks.0.actions.onSomeAction.blocks.1']).toBe(
      definition.pages[0].blocks[0].actions.onSomeAction.blocks[1],
    );
  });
});
