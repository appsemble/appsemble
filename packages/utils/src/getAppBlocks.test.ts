import type { AppDefinition } from '@appsemble/types';

import { getAppBlocks } from './getAppBlocks';

describe('getAppBlocks', () => {
  it('should create a mapping of blocks paths to the actual block', () => {
    const definition = {
      defaultPage: '',
      name: '',
      pages: [
        {
          name: '',
          blocks: [
            { type: 'test', version: '0.0.0' },
            { type: 'test', version: '0.0.0' },
          ],
        },
      ],
    };
    const result = getAppBlocks(definition);
    expect(result).toStrictEqual({
      'pages.0.blocks.0': { type: 'test', version: '0.0.0' },
      'pages.0.blocks.1': { type: 'test', version: '0.0.0' },
    });
    expect(result['pages.0.blocks.0']).toBe(definition.pages[0].blocks[0]);
    expect(result['pages.0.blocks.1']).toBe(definition.pages[0].blocks[1]);
  });

  it('should handle flow and tabs pages', () => {
    const definition = {
      defaultPage: '',
      name: '',
      pages: [
        {
          name: '',
          type: 'flow',
          subPages: [
            {
              name: '',
              blocks: [
                { type: 'test', version: '0.0.0' },
                { type: 'test', version: '0.0.0' },
              ],
            },
          ],
        },
      ],
    };
    const result = getAppBlocks(definition as AppDefinition);
    expect(result).toStrictEqual({
      'pages.0.subPages.0.blocks.0': definition.pages[0].subPages[0].blocks[0],
      'pages.0.subPages.0.blocks.1': definition.pages[0].subPages[0].blocks[1],
    });
  });

  it('should handle blocks nested by actions', () => {
    const definition = {
      defaultPage: '',
      name: '',
      pages: [
        {
          name: '',
          blocks: [
            {
              type: 'test',
              version: '0.0.0',
              actions: {
                onSomeAction: {
                  type: 'dialog' as const,
                  blocks: [
                    { type: 'test', version: '0.0.0' },
                    { type: 'test', version: '0.0.0' },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
    const result = getAppBlocks(definition);
    expect(result).toStrictEqual({
      'pages.0.blocks.0': definition.pages[0].blocks[0],
      'pages.0.blocks.0.actions.onSomeAction.blocks.0':
        definition.pages[0].blocks[0].actions.onSomeAction.blocks[0],
      'pages.0.blocks.0.actions.onSomeAction.blocks.1':
        definition.pages[0].blocks[0].actions.onSomeAction.blocks[1],
    });
  });

  it('should handle sub blocks in sub pages', () => {
    const definition = {
      defaultPage: '',
      name: '',
      pages: [
        {
          name: '',
          type: 'flow',
          subPages: [
            {
              name: '',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                  actions: {
                    onSomeAction: {
                      type: 'dialog',
                      blocks: [
                        { type: 'test', version: '0.0.0' },
                        { type: 'test', version: '0.0.0' },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const result = getAppBlocks(definition as AppDefinition);
    expect(result).toStrictEqual({
      'pages.0.subPages.0.blocks.0': definition.pages[0].subPages[0].blocks[0],
      'pages.0.subPages.0.blocks.0.actions.onSomeAction.blocks.0':
        definition.pages[0].subPages[0].blocks[0].actions.onSomeAction.blocks[0],
      'pages.0.subPages.0.blocks.0.actions.onSomeAction.blocks.1':
        definition.pages[0].subPages[0].blocks[0].actions.onSomeAction.blocks[1],
    });
  });
});
