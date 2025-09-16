import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { StringInput } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render the text', () => {
  const onClickMock = vi.fn();
  const onEditMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onEdit = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onEditMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onSubmitChecked = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onSubmitCheckedMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const fields = [
    {
      value: 'test',
      string: {
        name: 'testEdit',
        onEdit: 'onEdit',
      },
    },
  ];
  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields,
    },
    actions: {
      onClick,
      onSubmitChecked,
      onEdit,
    },
  };

  const { container } = render(
    <Context.Provider value={props}>
      <StringInput field={fields[0]} index={0} item={{ foo: 'bar' }} repeatedIndex={0} />
    </Context.Provider>,
  );
  expect(container).toMatchInlineSnapshot(`
    <div>
      <input
        class="input"
      />
    </div>
  `);
});

it('should render a textarea', () => {
  const onClickMock = vi.fn();
  const onEditMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onEdit = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onEditMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onSubmitChecked = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onSubmitCheckedMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const fields = [
    {
      value: 'test',
      string: {
        name: 'testEdit',
        onEdit: 'onEdit',
        multiline: true,
      },
    },
  ];
  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields,
    },
    actions: {
      onClick,
      onSubmitChecked,
      onEdit,
    },
  };

  const { container } = render(
    <Context.Provider value={props}>
      <StringInput field={fields[0]} index={0} item={{ foo: 'bar' }} repeatedIndex={0} />
    </Context.Provider>,
  );
  expect(container).toMatchInlineSnapshot(`
    <div>
      <textarea
        class="textarea"
      />
    </div>
  `);
});
