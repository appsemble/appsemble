import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { FileRenderer } from './index.js';
import { type FileField } from '../../../block.js';

const context = createExampleContext(new URL('https://example.com/en/example'), 'en');
const block = {
  utils: {
    asset: (id: string) => id,
    remap: (remapper: Remapper, data: unknown) => remap(remapper, data, context),
  },
} as BlockProps;

it.each([false, true])('shows images when the record allows them (repeated: %s)', (repeated) => {
  const field: FileField = {
    type: 'file',
    label: 'Allergens',
    value: { prop: repeated ? 'images' : 'image' },
    hide: { not: [{ prop: 'showImages' }] },
    repeated,
  };
  const images = ['https://example.com/gluten.png', 'https://example.com/milk.png'];

  render(
    <Context.Provider value={block}>
      <FileRenderer data={{ image: images[0], images, showImages: true }} field={field} />
    </Context.Provider>,
  );

  expect(screen.getByRole('heading', { name: 'Allergens' })).toBeDefined();
  expect(
    screen.getAllByRole('img', { name: 'Allergens' }).map((image) => image.getAttribute('src')),
  ).toStrictEqual(repeated ? images : [images[0]]);
});

it.each([false, true])(
  'hides the complete field when the record requires it (repeated: %s)',
  (repeated) => {
    const field: FileField = {
      type: 'file',
      label: 'Allergens',
      value: { prop: repeated ? 'images' : 'image' },
      hide: { not: [{ prop: 'showImages' }] },
      repeated,
    };

    render(
      <Context.Provider value={block}>
        <FileRenderer
          data={{
            image: 'https://example.com/gluten.png',
            images: ['https://example.com/gluten.png'],
            showImages: false,
          }}
          field={field}
        />
      </Context.Provider>,
    );

    expect(screen.queryByRole('heading', { name: 'Allergens' })).toBeNull();
    expect(screen.queryByRole('img', { name: 'Allergens' })).toBeNull();
  },
);
