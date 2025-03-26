import { ActionError } from '@appsemble/types';
import { identity, remap } from '@appsemble/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeActions, type MakeActionsParams } from './makeActions.js';

describe('makeActions', () => {
  let testDefaults: Omit<MakeActionsParams, 'actions'>;
  let pageReady: () => void;

  beforeEach(() => {
    testDefaults = {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      appDefinition: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      appStorage: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      context: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      ee: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      extraCreators: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      flowActions: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMessage: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      navigate: null,
      pageReady: new Promise((resolve) => {
        pageReady = resolve;
      }),
      prefix: 'pages.test-page.blocks.0',
      prefixIndex: 'pages.0.blocks.0',
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      pushNotifications: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      remap,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      params: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      showDialog: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      showShareDialog: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      showMessage: null,
      appMemberGroups: [],
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      addAppMemberGroup: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberInfo: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      passwordLogin: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      passwordLogout: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      setAppMemberInfo: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      refetchDemoAppMembers: null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberSelectedGroup: null,
    };
  });

  afterEach(() => {
    // Prevent vitest from detecting pending promises.
    pageReady();
  });

  it('should create a mapping of actions', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'static', value: 'Test value' } } },
    });
    expect(actions).toStrictEqual({ onClick: expect.any(Function) });
    expect(actions.onClick.type).toBe('static');
  });

  it('should set proper metadata on the created actions', () => {
    const dialogOk = vi.fn().mockImplementation(identity);
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
    });
    expect(actions.onClick.name).toBe('dialog.ok[wrapper]');
    expect(dialogOk.name).toBe('dialog.ok[implementation]');
  });

  it('should define dispatch for backwards compatibility with @appsemble/sdk < 0.18.6', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
    });
    // @ts-expect-error we’re deliberately testing outdated syntax here.
    expect(actions.onClick.dispatch).toBe(actions.onClick);
  });

  it('should create a noop action by default', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
    });
    expect(actions).toStrictEqual({ onClick: expect.any(Function) });
    expect(actions.onClick.type).toBe('noop');
  });

  it('should ignore extraneous action definitions', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: {},
      context: { actions: { extra: { type: 'noop' } } },
    });
    expect(actions).toStrictEqual({});
  });

  it('should should allow any actions if $any is defined', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: { $any: {} },
      context: { actions: { extra: { type: 'noop' } } },
    });
    expect(actions).toStrictEqual({ extra: expect.any(Function) });
    expect(actions.extra.type).toBe('noop');
  });

  it('should should be possible to combine predefined actions and $any', () => {
    const actions = makeActions({
      ...testDefaults,
      actions: { predefined: {}, $any: {} },
      context: { actions: { extra: { type: 'noop' } } },
    });
    expect(actions).toStrictEqual({
      extra: expect.any(Function),
      predefined: expect.any(Function),
    });
    expect(actions.extra.type).toBe('noop');
    expect(actions.predefined.type).toBe('noop');
  });

  it('should wait until the page is ready before executing actions', async () => {
    const dialogOk = vi.fn().mockReturnValue('dialog.ok return value');
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
    });
    const promise = actions.onClick('input', {});
    expect(dialogOk).not.toHaveBeenCalled();
    pageReady();
    const result = await promise;
    expect(result).toBe('dialog.ok return value');
    expect(dialogOk).toHaveBeenCalledWith('input', { history: ['input'] });
  });

  it('should reject the action call if the implementation rejects', async () => {
    pageReady();
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'throw' } } },
    });
    await expect(actions.onClick('input')).rejects.toThrow(
      new ActionError({ cause: null, data: null, definition: { type: 'throw' } }),
    );
  });

  it('should call onSuccess on success if it’s defined', async () => {
    pageReady();
    const dialogOk = vi.fn().mockReturnValue('dialog.ok return value');
    const dialogError = vi.fn().mockReturnValue('dialog.error return value');
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok', onSuccess: { type: 'dialog.error' } } } },
      extraCreators: { 'dialog.ok': () => [dialogOk], 'dialog.error': () => [dialogError] },
    });
    const result = await actions.onClick('input', {});
    expect(dialogError).toHaveBeenCalledWith('dialog.ok return value', {
      history: ['input', 'dialog.ok return value'],
    });
    expect(result).toBe('dialog.error return value');
  });

  it('should call onError on error if it’s defined', async () => {
    pageReady();
    const dialogOk = vi.fn().mockRejectedValue('dialog.ok rejected value');
    const dialogError = vi.fn().mockReturnValue('dialog.error return value');
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok', onError: { type: 'dialog.error' } } } },
      extraCreators: { 'dialog.ok': () => [dialogOk], 'dialog.error': () => [dialogError] },
    });
    const result = await actions.onClick('input', {});
    expect(dialogError).toHaveBeenCalledWith('dialog.ok rejected value', {
      history: ['input', 'dialog.ok rejected value'],
    });
    expect(result).toBe('dialog.error return value');
  });

  it('should remap input values', async () => {
    pageReady();
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'noop', remap: { prop: 'foo' } } } },
    });
    const result = await actions.onClick({ foo: 'bar' });
    expect(result).toBe('bar');
  });

  it('should output the result before passing it to next action', async () => {
    pageReady();
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: {
        actions: {
          onClick: {
            type: 'noop',
            remapBefore: { prop: 'foo' },
            remapAfter: { prop: 0 },
          },
        },
      },
    });
    const result = await actions.onClick({ foo: 'bar' });
    expect(result).toBe('b');
  });

  it('should update the prefix for actions', async () => {
    pageReady();
    let prefix: string;
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: {
        'dialog.ok'(params) {
          ({ prefix } = params);
          return [identity];
        },
      },
    });
    await actions.onClick('input');
    // @ts-expect-error Used before assigned
    expect(prefix).toBe('pages.test-page.blocks.0.actions.onClick');
  });
});
