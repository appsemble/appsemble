import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ImageField } from './index.js';
import { type Image } from '../../../block.js';

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
          alt="enlargeImage"
          class="img"
          src="https://appsemble.app/api/apps/70/assets/test-asset"
        />
      </figure>
    </button>
  `);
});

function renderImage(field: Image, item: unknown): void {
  const props = {
    ...defaultBootstrapParams,
    parameters: { fields: [field] },
    utils: {
      ...defaultBootstrapParams.utils,
      formatMessage: (id: string, values?: { name: string }) =>
        values ? `${id} ${values.name}` : id,
    },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <ImageField field={field} index={0} item={item} repeatedIndex={0} />
    </Context.Provider>,
  );
}

it('should name the enlarge button and the enlarged image by the image alt of the row', () => {
  renderImage(
    { label: 'Photo', image: { alt: { prop: 'name' }, file: 'https://example.com/bike.png' } },
    { name: 'Red bike' },
  );

  fireEvent.click(screen.getByRole('button', { name: 'enlargeNamedImage Red bike' }));

  expect(screen.getByRole('img', { name: 'Red bike' })).toBeDefined();
});

it('should name the enlarge button by the column label without an image alt', () => {
  renderImage({ label: 'Photo', image: { file: 'https://example.com/bike.png' } }, {});

  expect(screen.getByRole('button', { name: 'enlargeNamedImage Photo' })).toBeDefined();
});
