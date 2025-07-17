import { describe, expect, it, vi } from 'vitest';

import { iterAction, iterApp, iterBlock, iterBlockList, iterPage } from './iterApp.js';
import {
  type ActionDefinition,
  type AppDefinition,
  type BasicPageDefinition,
  type BlockDefinition,
  type PageDefinition,
} from './types/index.js';

describe('iterAction', () => {
  it('should call the appropriate callbacks', () => {
    const onAction = vi.fn();
    const onBlockList = vi.fn();

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
    const onAction = vi.fn().mockReturnValue(true);
    const onBlockList = vi.fn();

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should call onAction for onSuccess', () => {
    const onAction = vi.fn();
    const onBlockList = vi.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onSuccess: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onSuccess, ['onSuccess']);
    expect(result).toBe(false);
  });

  it('should return true if onAction returns true for onSuccess', () => {
    const onAction = vi.fn().mockImplementation((a, [prefix]) => prefix === 'onSuccess');
    const onBlockList = vi.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onSuccess: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onSuccess, ['onSuccess']);
    expect(result).toBe(true);
  });

  it('should call onAction for onError', () => {
    const onAction = vi.fn();
    const onBlockList = vi.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onError: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onError, ['onError']);
    expect(result).toBe(false);
  });

  it('should return true if onAction returns true for onError', () => {
    const onAction = vi.fn().mockImplementation((a, [prefix]) => prefix === 'onError');
    const onBlockList = vi.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onError: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onError, ['onError']);
    expect(result).toBe(true);
  });

  it('should call then and else for conditional actions', () => {
    const onAction = vi.fn();

    const action: ActionDefinition = {
      type: 'condition',
      if: true,
      then: { type: 'noop' },
      else: { type: 'noop' },
    };

    const result = iterAction(action, { onAction });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.then, ['then']);
    expect(onAction).toHaveBeenCalledWith(action.else, ['else']);
    expect(result).toBe(false);
  });

  it('should return the return value of iterBlockList', () => {
    const onAction = vi.fn();
    const onBlockList = vi.fn().mockReturnValue(true);

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
    const onAction = vi.fn();
    const onBlockList = vi.fn();

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
    const onAction = vi.fn();
    const onBlock = vi.fn();

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

    expect(onAction).toHaveBeenCalledWith(block.actions?.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(false);
  });

  it('should abort if onBlock returns true', () => {
    const onAction = vi.fn();
    const onBlock = vi.fn().mockReturnValue(true);

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
    const onAction = vi.fn().mockReturnValue(true);
    const onBlock = vi.fn();

    const block = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    } satisfies BlockDefinition;

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).toHaveBeenCalledWith(block.actions.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(true);
  });
});

describe('iterBlockList', () => {
  it('should call the appropriate callbacks', () => {
    const onBlock = vi.fn();
    const onBlockList = vi.fn();

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
    const onBlock = vi.fn();
    const onBlockList = vi.fn().mockReturnValue(true);

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
    const onBlockList = vi.fn();
    const onPage = vi.fn();

    const page: PageDefinition = {
      name: 'Page',
      blocks: [],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.blocks, ['blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should iterate over a container page', () => {
    const onBlockList = vi.fn();
    const onPage = vi.fn();

    const page: PageDefinition = {
      name: 'Container Page',
      type: 'container',
      pages: [
        {
          name: 'Page 1',
          blocks: [],
        },
        {
          name: 'Page 2',
          blocks: [],
        },
      ],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith((page.pages[0] as BasicPageDefinition).blocks, [
      'blocks',
    ]);
    expect(onBlockList).toHaveBeenCalledWith((page.pages[1] as BasicPageDefinition).blocks, [
      'blocks',
    ]);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should abort if onPage returns true', () => {
    const onBlockList = vi.fn();
    const onPage = vi.fn().mockReturnValue(true);

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
    const onBlockList = vi.fn();
    const onPage = vi.fn();

    const page: PageDefinition = {
      name: 'Page',
      type: 'flow',
      steps: [
        {
          name: 'Flow page 1',
          blocks: [],
        },
      ],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.steps[0].blocks, ['steps', 0, 'blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should iterate a tabs page', () => {
    const onBlockList = vi.fn();
    const onPage = vi.fn();

    const page = {
      name: 'Page',
      type: 'tabs',
      tabs: [
        {
          name: 'Tabs page 1',
          blocks: [],
        },
      ],
    } satisfies PageDefinition;

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.tabs[0].blocks, ['tabs', 0, 'blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should call onAction for page actions', () => {
    const onAction = vi.fn();
    const onPage = vi.fn();

    const page = {
      name: 'Page',
      type: 'flow',
      actions: {
        onFlowFinish: {
          type: 'log',
        },
      },
      steps: [],
    } satisfies PageDefinition;

    const result = iterPage(page, { onAction, onPage });

    expect(onAction).toHaveBeenCalledWith(page.actions.onFlowFinish, ['actions', 'onFlowFinish']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should call onAction and onBlockList for pages with actions and sub pages', () => {
    const onAction = vi.fn();
    const onPage = vi.fn();
    const onBlockList = vi.fn();

    const page = {
      name: 'Page',
      type: 'flow',
      actions: {
        onFlowFinish: {
          type: 'log',
        },
      },
      steps: [
        {
          name: 'Test Subpage 1',
          blocks: [
            {
              type: 'list',
              version: '1.2.3',
              actions: {
                onClick: {
                  type: 'log',
                },
              },
            },
          ],
        },
      ],
    } satisfies PageDefinition;

    const result = iterPage(page, { onAction, onPage, onBlockList });

    expect(onAction).toHaveBeenCalledWith(page.actions.onFlowFinish, ['actions', 'onFlowFinish']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(onBlockList).toHaveBeenCalledWith(page.steps[0].blocks, ['steps', 0, 'blocks']);
    expect(result).toBe(false);
  });
});

describe('iterApp', () => {
  it('should iterate over the page of an app', () => {
    const onPage = vi.fn();

    const app: AppDefinition = {
      name: 'App',
      defaultPage: 'Page',
      pages: [
        {
          name: 'Page',
          blocks: [],
        },
      ],
    };

    const result = iterApp(app, { onPage });

    expect(onPage).toHaveBeenCalledWith(app.pages[0], ['pages', 0]);
    expect(result).toBe(false);
  });

  it('should abort page iteration if a callback returns true', () => {
    const onPage = vi.fn().mockReturnValue(true);

    const app: AppDefinition = {
      name: 'App',
      defaultPage: 'Page 1',
      pages: [
        {
          name: 'Page 1',
          blocks: [],
        },
        {
          name: 'Page 2',
          blocks: [],
        },
      ],
    };

    const result = iterApp(app, { onPage });

    expect(onPage).toHaveBeenCalledTimes(1);
    expect(onPage).toHaveBeenCalledWith(app.pages[0], ['pages', 0]);
    expect(result).toBe(true);
  });

  it('should iterate over cron jobs', () => {
    const onAction = vi.fn();

    const app: AppDefinition = {
      name: 'App',
      defaultPage: 'Page 1',
      pages: [],
      cron: {
        foo: { schedule: '', action: { type: 'noop' } },
        bar: { schedule: '', action: { type: 'noop' } },
      },
    };

    const result = iterApp(app, { onAction });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(app.cron?.foo.action, ['cron', 'foo', 'action']);
    expect(onAction).toHaveBeenCalledWith(app.cron?.bar.action, ['cron', 'bar', 'action']);
    expect(result).toBe(false);
  });

  it('should abort cron iteration if a callback returns true', () => {
    const onAction = vi.fn().mockReturnValue(true);

    const app: AppDefinition = {
      name: 'App',
      defaultPage: 'Page 1',
      pages: [],
      cron: {
        foo: { schedule: '', action: { type: 'noop' } },
        bar: { schedule: '', action: { type: 'noop' } },
      },
    };

    const result = iterApp(app, { onAction });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(app.cron?.foo.action, ['cron', 'foo', 'action']);
    expect(result).toBe(true);
  });
});
