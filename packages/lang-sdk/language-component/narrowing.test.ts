import { describe, expect, it } from 'vitest';

import { compileAppsembleDialect, appsembleCompletionDefs } from '../appsembleDialect.js';
import { type Completion, LanguageCtx, scan } from './index.js';
import { miniSchemas } from './stress-test-schemas/schemas.js';

/*
 * A node answers to every component it resolved to, however the schema wraps them: a discriminated
 * page in an anonymous union, an action kind below a tagged allOf. `is`/`as`/`nearest` and binding
 * dispatch all depend on it. The tiny app mirrors the real shapes; the last block holds the real
 * dialect to the same promises, so the two cannot drift apart.
 */

const block = { type: 'button', version: '1.0.0' };
const flowStep = (name: string): unknown => ({ name, blocks: [block] });
const app = (pages: unknown[]): unknown => ({ name: 'App', defaultPage: 'a', pages });
const appCtx = LanguageCtx.compile(miniSchemas, 'Root');

describe('component narrowing', () => {
  it('should name the page kind a discriminator selects', () => {
    const root = appCtx.root(
      app([
        { name: 'a', blocks: [block] },
        { name: 'b', type: 'flow', steps: [] },
      ]),
    );

    expect(root.cursorAt(['pages', 0])?.is('PageDefinition')).toBe(true);
    expect(root.cursorAt(['pages', 0])?.is('FlowPageDefinition')).toBe(false);
    expect(root.cursorAt(['pages', 1])?.as('FlowPageDefinition')?.val).toMatchObject({ name: 'b' });
    expect(root.cursorAt(['pages', 1])?.as('PageDefinition')).toBeNull();
  });

  it('should answer to both a wrapper and the kind inside it', () => {
    const page = { name: 'a', blocks: [{ ...block, onClick: { type: 'link', to: 'b' } }] };
    const action = appCtx.root(app([page])).cursorAt(['pages', 0, 'blocks', 0, 'onClick']);

    expect(action?.is('ActionDefinition')).toBe(true);
    expect(action?.is('LinkActionDefinition')).toBe(true);
    expect(action?.is('DialogActionDefinition')).toBe(false);
  });

  it('should find an enclosing component through a union', () => {
    const page = { name: 'a', type: 'flow', steps: [{ name: 's', blocks: [block] }] };
    const step = appCtx.root(app([page])).cursorAt(['pages', 0, 'steps', 0, 'blocks', 0]);

    expect(step?.nearest('FlowPageDefinition')?.val).toMatchObject({ name: 'a' });
  });

  it('should not name a candidate the engine refused to choose', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'AmbiguousButton');
    const root = ctx.root({ type: 'button', text: 'hi', icon: 'star' });

    expect(root.identity?.kind).toBe('unresolved');
    expect(root.is('ButtonWidget')).toBe(false);
  });
});

describe('a value the discriminator decided but which is not finished', () => {
  it('should keep the selected branch and report the value as locally invalid', () => {
    const page = appCtx.root(app([{ type: 'flow' }])).cursorAt(['pages', 0]);

    expect(page?.is('FlowPageDefinition')).toBe(true);
    expect(page?.localValid).toBe(false);
  });

  it('should keep the action kind when the selected action is incomplete', () => {
    const page = { name: 'a', blocks: [{ ...block, onClick: { type: 'link' } }] };
    const action = appCtx.root(app([page])).cursorAt(['pages', 0, 'blocks', 0, 'onClick']);

    expect(action?.is('ActionDefinition')).toBe(true);
    expect(action?.is('LinkActionDefinition')).toBe(true);
    expect(action?.localValid).toBe(false);
  });

  it('should keep descending into the selected branch', () => {
    const page = { type: 'flow', steps: [{ name: 's', blocks: [block] }] };
    const step = appCtx.root(app([page])).cursorAt(['pages', 0, 'steps', 0]);

    expect(step?.is('PageDefinition')).toBe(true);
  });

  it('should still fail an unknown discriminant', () => {
    const page = appCtx.root(app([{ type: 'nope' }])).cursorAt(['pages', 0]);

    expect(page?.is('PageDefinition')).toBe(false);
    expect(page?.is('FlowPageDefinition')).toBe(false);
    expect(page?.localValid).toBe(false);
  });

  it('should not change whether the document is valid', () => {
    expect(scan(appCtx, app([{ type: 'flow' }])).documentValid).toBe(false);
  });
});

describe('asLocalValid', () => {
  it('should return a node whose own shape passes', () => {
    const page = appCtx.root(app([{ name: 'a', blocks: [block] }])).cursorAt(['pages', 0]);

    expect(page?.asLocalValid('PageDefinition')?.val).toMatchObject({ name: 'a' });
  });

  it('should refuse a half-written value that as() accepts', () => {
    const page = appCtx.root(app([{ type: 'flow' }])).cursorAt(['pages', 0]);

    expect(page?.as('FlowPageDefinition')).not.toBeNull();
    expect(page?.asLocalValid('FlowPageDefinition')).toBeNull();
  });

  it('should refuse a component the node is not', () => {
    const page = appCtx.root(app([{ name: 'a', blocks: [block] }])).cursorAt(['pages', 0]);

    expect(page?.asLocalValid('FlowPageDefinition')).toBeNull();
  });

  it('should not vouch for nested components', () => {
    const page = appCtx
      .root(app([{ name: 'a', blocks: [{ type: 'button' }] }]))
      .cursorAt(['pages', 0]);

    expect(page?.asLocalValid('PageDefinition')).not.toBeNull();
    expect(page?.cursorAt(['blocks', 0])?.asLocalValid('BlockDefinition')).toBeNull();
  });
});

describe('binding dispatch through a union', () => {
  const describePage = (): string => 'a flow page';

  it('should reach a binding on the selected branch', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'Root', {
      binds: new Map([['FlowPageDefinition', { describe: describePage }]]),
    });
    const tree = scan(ctx, app([{ name: 'b', type: 'flow', steps: [] }]));

    expect(tree.callBindingAt(['pages', 0], 'describe')).toBe('a flow page');
    expect(tree.bindingContextAt(['pages', 0, 'steps'])?.relativePath).toStrictEqual(['steps']);
  });

  it('should prefer the most specific binding on one node', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'Root', {
      binds: new Map([
        ['ActionDefinition', { describe: () => 'any action' }],
        ['LinkActionDefinition', { describe: () => 'a link' }],
      ]),
    });
    const page = { name: 'a', blocks: [{ ...block, onClick: { type: 'link', to: 'b' } }] };

    expect(
      scan(ctx, app([page])).callBindingAt(['pages', 0, 'blocks', 0, 'onClick'], 'describe'),
    ).toBe('a link');
  });
});

describe('binding context', () => {
  const describeApp = (): string => 'the app';
  const completeBlock = (): [] => [];

  it('should skip a nearer component that lacks the hook', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'Root', {
      binds: new Map([
        ['AppDefinition', { describe: describeApp }],
        ['PageDefinition', { complete: completeBlock }],
      ]),
    });
    const tree = scan(ctx, app([{ name: 'a', blocks: [block] }]));

    expect(tree.callBindingAt(['pages', 0], 'describe')).toBe('the app');
    expect(tree.bindingContextAt(['pages', 0], 'describe')?.componentPath).toStrictEqual([]);
  });

  it('should keep the relative path of a position past the document', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'Root', {
      binds: new Map([['PageDefinition', { describe: describeApp }]]),
    });
    const tree = scan(ctx, app([{ name: 'a', blocks: [block] }]));

    expect(tree.bindingContextAt(['pages', 0, 'unknown', 3])?.relativePath).toStrictEqual([
      'unknown',
      3,
    ]);
  });

  it('should find the same context from a node, without a tree', () => {
    const ctx = LanguageCtx.compile(miniSchemas, 'Root', {
      binds: new Map([['PageDefinition', { describe: describeApp }]]),
    });
    const node = ctx
      .root(app([{ name: 'a', blocks: [block] }]))
      .cursorAt(['pages', 0, 'blocks', 0]);

    expect(ctx.bindingContextFor(node!)?.componentPath).toStrictEqual(['pages', 0]);
    expect(ctx.bindingContextFor(node!)?.relativePath).toStrictEqual(['blocks', 0]);
  });
});

describe('page role completion', () => {
  const ctx = compileAppsembleDialect(appsembleCompletionDefs());
  const definition = {
    name: 'App',
    defaultPage: 'a',
    security: { default: { role: 'Reader' }, roles: { Reader: {}, Writer: {} } },
    pages: [
      { name: 'a', roles: ['Reader'], blocks: [block] },
      { name: 'b', type: 'tabs', tabs: [{ name: 't', blocks: [block] }] },
    ],
  };
  const labels = (path: (number | string)[]): unknown => {
    const completions = scan(ctx, definition).callBindingAt(path, 'complete') as Completion[];
    return completions.map(({ label }) => label);
  };

  it('should offer declared roles not yet listed, at the next element', () => {
    expect(labels(['pages', 0, 'roles', 1])).toContain('Writer');
    expect(labels(['pages', 0, 'roles', 1])).toContain('$guest');
    expect(labels(['pages', 0, 'roles', 1])).not.toContain('Reader');
  });

  it('should work on every page kind', () => {
    expect(labels(['pages', 1, 'roles', 0])).toContain('Reader');
  });

  it('should offer nothing outside the roles list', () => {
    expect(labels(['pages', 0, 'name'])).toStrictEqual([]);
  });

  it('should still answer for a half-written page and an app with no roles', () => {
    const tree = scan(ctx, { pages: [{ type: 'flow', roles: [] }] });
    const completions = tree.callBindingAt(['pages', 0, 'roles', 0], 'complete') as Completion[];

    expect(completions.map(({ label }) => label)).toContain('$guest');
  });
});

describe('the Appsemble dialect', () => {
  const ctx = compileAppsembleDialect();
  const definition = (pages: unknown[]): unknown => ({ name: 'App', defaultPage: 'a', pages });

  it.each([
    ['PageDefinition', { name: 'a', blocks: [block] }],
    ['TabsPageDefinition', { name: 'a', type: 'tabs', tabs: [{ name: 't', blocks: [block] }] }],
    ['FlowPageDefinition', { name: 'a', type: 'flow', steps: [flowStep('s'), flowStep('t')] }],
  ])('should name a %s', (name, page) => {
    const node = ctx.root(definition([page])).cursorAt(['pages', 0]);

    expect(node?.is(name)).toBe(true);
    expect(node?.localValid).toBe(true);
  });

  it('should keep the kind of a half-written page', () => {
    const node = ctx.root(definition([{ type: 'flow' }])).cursorAt(['pages', 0]);

    expect(node?.is('FlowPageDefinition')).toBe(true);
    expect(node?.localValid).toBe(false);
  });

  it('should name an action kind, finished or not', () => {
    const finished = { ...block, actions: { onClick: { type: 'link', to: 'b' } } };
    const unfinished = { ...block, actions: { onClick: { type: 'link' } } };
    const path = ['pages', 0, 'blocks', 0, 'actions', 'onClick'];

    for (const candidate of [finished, unfinished]) {
      const action = ctx.root(definition([{ name: 'a', blocks: [candidate] }])).cursorAt(path);

      expect(action?.is('ActionDefinition')).toBe(true);
      expect(action?.is('LinkActionDefinition')).toBe(true);
    }
  });
});
