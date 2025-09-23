import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ImageField } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a clickable image', () => {
  const onClickMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
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
  const imageField = {
    image: {
      file: 'https://appsemble.app/api/apps/70/assets/test-asset',
    },
  };

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [imageField],
    },
    actions: {
      onClick,
      onSubmitChecked,
    },
  };

  render(
    <Context.Provider value={props}>
      <ImageField field={imageField} index={0} item={{ foo: 'bar' }} repeatedIndex={0} />
    </Context.Provider>,
  );
  const button = screen.getByRole('button');
  expect(button).toMatchInlineSnapshot(`
    <button
      class="button root"
      type="button"
    >
      <figure
        class="mr-3 root"
      >
        <img
          alt="list icon"
          class="img"
          src="https://appsemble.app/api/apps/70/assets/test-asset"
        />
      </figure>
    </button>
  `);
});
