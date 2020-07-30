import type { ActionDefinition, BlockDefinition, PageDefinition } from '@appsemble/types';

import { iterAction, iterBlock, iterBlockList, iterPage } from './iterApp';

describe('iterAction', () => {
  it('should call the appropriate callbacks', () => {
    const onAction = jest.fn();
    const onBlockList = jest.fn();

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).toHaveBeenCalledWith(action.blocks, ['blocks']);
    expect(result).toBe(false);
  });

  it('should abort if the onAction callback returns true', () => {
    const onAction = jest.fn().mockReturnValue(true);
    const onBlockList = jest.fn();

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return the return value of iterBlockList', () => {
    const onAction = jest.fn();
    const onBlockList = jest.fn().mockReturnValue(true);

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, {
      onAction,
      onBlockList,
    });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).toHaveBeenCalledWith(action.blocks, ['blocks']);
    expect(result).toBe(true);
  });

  it('should not call iterBlockList if the action has no blocks', () => {
    const onAction = jest.fn();
    const onBlockList = jest.fn();

    const action: ActionDefinition = {
      type: 'log',
    };

    const result = iterAction(action, {
      onAction,
      onBlockList,
    });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

describe('iterBlock', () => {
  it('should call the appropriate callbacks', () => {
    const onAction = jest.fn();
    const onBlock = jest.fn();

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).toHaveBeenCalledWith(block.actions.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(false);
  });

  it('should abort if onBlock returns true', () => {
    const onAction = jest.fn();
    const onBlock = jest.fn().mockReturnValue(true);

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).not.toHaveBeenCalled();
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(true);
  });

  it('should return the return value of onAction', () => {
    const onAction = jest.fn().mockReturnValue(true);
    const onBlock = jest.fn();

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).toHaveBeenCalledWith(block.actions.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(true);
  });
});

describe('iterBlockList', () => {
  it('should call the appropriate callbacks', () => {
    const onBlock = jest.fn();
    const onBlockList = jest.fn();

    const blocks: BlockDefinition[] = [
      {
        type: 'list',
        version: '1.2.3',
        actions: {
          onClick: {
            type: 'log',
          },
        },
      },
    ];

    const result = iterBlockList(blocks, { onBlockList, onBlock });

    expect(onBlockList).toHaveBeenCalledWith(blocks, []);
    expect(onBlock).toHaveBeenCalledWith(blocks[0], [0]);
    expect(result).toBe(false);
  });

  it('should abort if onBlockList returns true', () => {
    const onBlock = jest.fn();
    const onBlockList = jest.fn().mockReturnValue(true);

    const blocks: BlockDefinition[] = [
      {
        type: 'list',
        version: '1.2.3',
        actions: {
          onClick: {
            type: 'log',
          },
        },
      },
    ];

    const result = iterBlockList(blocks, { onBlockList, onBlock });

    expect(onBlockList).toHaveBeenCalledWith(blocks, []);
    expect(onBlock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

describe('iterPage', () => {
  it('should iterate over a page', () => {
    const onBlockList = jest.fn();
    const onPage = jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      blocks: [],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.blocks, ['blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should abort if onPage returns true', () => {
    const onBlockList = jest.fn();
    const onPage = jest.fn().mockReturnValue(true);

    const page: PageDefinition = {
      name: 'Page',
      blocks: [],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).not.toHaveBeenCalled();
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(true);
  });

  it('should iterate a flow page', () => {
    const onBlockList = jest.fn();
    const onPage = jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      type: 'flow',
      subPages: [
        {
          name: 'Flow page 1',
          blocks: [],
        },
      ],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.subPages[0].blocks, ['subPages', 0, 'blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should iterate a tabs page', () => {
    const onBlockList = jest.fn();
    const onPage = jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      type: 'tabs',
      subPages: [
        {
          name: 'Tabs page 1',
          blocks: [],
        },
      ],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.subPages[0].blocks, ['subPages', 0, 'blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should call onAction for page actions', () => {
    const onAction = jest.fn();
    const onPage = jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      type: 'flow',
      actions: {
        'flow.finish': {
          type: 'log',
        },
      },
      subPages: [],
    };

    const result = iterPage(page, { onAction, onPage });

    expect(onAction).toHaveBeenCalledWith(page.actions['flow.finish'], ['actions', 'flow.finish']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });
});
