import { EventEmitter } from 'events';

import { ActionError, remap } from '@appsemble/lang-sdk';
import { identity } from '@appsemble/utils';
import { addBreadcrumb, captureException } from '@sentry/browser';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionOwnerAbortError, makeActions, type MakeActionsParams } from './makeActions.js';

vi.mock('@sentry/browser', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

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
    vi.clearAllMocks();
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
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should add contextual sentry data for unhandled action failures', async () => {
    pageReady();
    const error = Object.assign(new Error('Request failed'), {
      config: { method: 'patch', url: 'https://example.com/api/apps/42/members/current' },
      response: {
        data: { error: 'Invalid input', password: 'secret value' },
        status: 400,
      },
    });
    const dialogOk = vi.fn().mockRejectedValue(error);
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: {
        actions: {
          onClick: {
            type: 'dialog.ok',
            remapBefore: {
              'object.from': {
                password: { prop: 'password' },
                value: { prop: 'value' },
              },
            },
          },
        },
      },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
      getAppMemberInfo: () =>
        ({
          role: 'Staff',
          sub: 'member-sub',
        }) as any,
      getAppMemberSelectedGroup: () =>
        ({
          id: 123,
          role: 'Manager',
        }) as any,
    });

    await expect(
      actions.onClick({ password: 'secret value', value: 'safe value' }, { history: ['before'] }),
    ).rejects.toThrow(ActionError);

    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        contexts: {
          appsembleAction: expect.objectContaining({
            contextHistoryLength: 2,
            error: {
              hasResponseBody: true,
              method: 'patch',
              responseStatus: 400,
              url: 'https://example.com/api/apps/42/members/current',
            },
            hasOnError: false,
            hasOnSuccess: false,
            input: { keys: ['password', 'value'], type: 'object' },
            path: 'pages.test-page.blocks.0.actions.onClick',
            pathIndex: 'pages.0.blocks.0.actions.onClick',
            remappedInput: { keys: ['password', 'value'], type: 'object' },
            type: 'dialog.ok',
          }),
          appsembleAppMember: {
            id: 'member-sub',
            role: 'Staff',
            selectedGroupId: 123,
            selectedGroupRole: 'Manager',
          },
        },
        tags: {
          actionPath: 'pages.test-page.blocks.0.actions.onClick',
          actionType: 'dialog.ok',
          appId: '42',
        },
      }),
    );
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'appsemble.action',
        data: expect.objectContaining({
          failed: 'dialog.ok',
          path: 'pages.test-page.blocks.0.actions.onClick',
          pathIndex: 'pages.0.blocks.0.actions.onClick',
        }),
        level: 'warning',
      }),
    );
  });

  it('should not report unhandled network action failures to Sentry', async () => {
    pageReady();
    const error = new AxiosError(
      'Network Error',
      AxiosError.ERR_NETWORK,
      {
        headers: {},
        method: 'get',
        url: 'https://appsemble.app/api/apps/42/members?roles=Staff,Manager',
      } as InternalAxiosRequestConfig,
      {},
    );
    const dialogOk = vi.fn().mockRejectedValue(error);
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
    });

    await expect(actions.onClick('input')).rejects.toThrow(ActionError);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should not report unhandled cancelled action failures to Sentry', async () => {
    pageReady();
    const error = new AxiosError(
      'canceled',
      AxiosError.ERR_CANCELED,
      {
        headers: {},
        method: 'get',
        url: 'https://appsemble.app/api/apps/42/resources/course/3772',
      } as InternalAxiosRequestConfig,
      {},
    );
    const dialogOk = vi.fn().mockRejectedValue(error);
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
    });

    await expect(actions.onClick('input')).rejects.toThrow(ActionError);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should not report a dialog closed by the user to Sentry', async () => {
    pageReady();
    // Closing a dialog rejects the action with no reason.
    // eslint-disable-next-line prefer-promise-reject-errors
    const dialogOk = vi.fn().mockImplementation(() => Promise.reject());
    const actions = makeActions({
      ...testDefaults,
      actions: { onClick: {} },
      context: { actions: { onClick: { type: 'dialog.ok' } } },
      extraCreators: { 'dialog.ok': () => [dialogOk] },
    });

    await expect(actions.onClick('input')).rejects.toThrow(ActionError);
    expect(captureException).not.toHaveBeenCalled();
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

  describe('abort', () => {
    let ee: EventEmitter;

    beforeEach(() => {
      // eslint-disable-next-line unicorn/prefer-event-target
      ee = new EventEmitter();
      vi.spyOn(ee, 'emit');
    });

    afterEach(() => {
      ee.removeAllListeners();
    });

    it('should not emit events when the signal is already aborted, but complete the chain', async () => {
      pageReady();
      const controller = new AbortController();
      controller.abort();
      const listener = vi.fn();
      ee.on('foo', listener);
      const actions = makeActions({
        ...testDefaults,
        ee,
        signal: controller.signal,
        actions: { onClick: {} },
        context: {
          actions: {
            onClick: { type: 'event', event: 'foo', onSuccess: { type: 'static', value: 'after' } },
          },
        },
      });
      const result = await actions.onClick({ test: 'data' });
      expect(result).toBe('after');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should complete in-flight dispatches and their onSuccess after the signal is aborted', async () => {
      pageReady();
      const controller = new AbortController();
      let resolveDispatch: (value: unknown) => void;
      const actions = makeActions({
        ...testDefaults,
        ee,
        signal: controller.signal,
        actions: { onClick: {} },
        context: {
          actions: {
            onClick: { type: 'dialog.ok', onSuccess: { type: 'static', value: 'saved' } },
          },
        },
        extraCreators: {
          'dialog.ok': () => [
            () =>
              new Promise((resolve) => {
                resolveDispatch = resolve;
              }),
          ],
        },
      });
      const promise = actions.onClick('input');
      // Wait a tick so the dispatch is in flight.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      controller.abort();
      // @ts-expect-error Used before assigned
      resolveDispatch('written');
      expect(await promise).toBe('saved');
    });

    it('should reject the chain when the signal is aborted during dispatch', async () => {
      pageReady();
      const controller = new AbortController();
      const onBaz = vi.fn();
      const onBoo = vi.fn();
      ee.on('baz', onBaz);
      ee.on('boo', onBoo);
      const actions = makeActions({
        ...testDefaults,
        ee,
        signal: controller.signal,
        actions: { onClick: {} },
        context: {
          actions: {
            onClick: {
              type: 'event',
              event: 'foo',
              waitFor: 'bar',
              onSuccess: { type: 'event', event: 'baz' },
              onError: { type: 'event', event: 'boo' },
            },
          },
        },
      });
      const promise = actions.onClick({ test: 'data' });
      // Wait 1 tick so the waitFor listener is registered.
      await Promise.resolve();
      controller.abort();
      await expect(promise).rejects.toThrow(ActionOwnerAbortError);
      expect(ee.emit).toHaveBeenCalledWith('foo', { test: 'data' });
      expect(onBaz).not.toHaveBeenCalled();
      expect(onBoo).not.toHaveBeenCalled();
      expect(captureException).not.toHaveBeenCalled();
    });

    it('should still handle non-abort failures after the signal is aborted', async () => {
      pageReady();
      const controller = new AbortController();
      let rejectDispatch: (reason: unknown) => void;
      const error = new Error('Saved action failed');
      const onError = vi.fn().mockReturnValue('handled');
      const actions = makeActions({
        ...testDefaults,
        ee,
        signal: controller.signal,
        actions: { onClick: {} },
        context: {
          actions: {
            onClick: { type: 'dialog.ok', onError: { type: 'dialog.error' } },
          },
        },
        extraCreators: {
          'dialog.ok': () => [
            () =>
              new Promise((resolve, reject) => {
                rejectDispatch = reject;
              }),
          ],
          'dialog.error': () => [onError],
        },
      });
      const promise = actions.onClick('input');
      // Wait a tick so the dispatch is in flight.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      controller.abort();
      // @ts-expect-error Used before assigned
      rejectDispatch(error);
      expect(await promise).toBe('handled');
      expect(onError).toHaveBeenCalledWith(error, { history: ['input', error] });
      expect(captureException).not.toHaveBeenCalled();
    });

    it('should remove the waitFor listener when the signal is aborted', async () => {
      pageReady();
      const controller = new AbortController();
      const actions = makeActions({
        ...testDefaults,
        ee,
        signal: controller.signal,
        actions: { onClick: {} },
        context: {
          actions: { onClick: { type: 'event', event: 'foo', waitFor: 'bar' } },
        },
      });
      const promise = actions.onClick({ test: 'data' });
      await Promise.resolve();
      expect(ee.listenerCount('bar')).toBe(1);
      controller.abort();
      await expect(promise).rejects.toThrow(ActionOwnerAbortError);
      expect(ee.listenerCount('bar')).toBe(0);
    });
  });
});
