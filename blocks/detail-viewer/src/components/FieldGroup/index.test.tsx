import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { FieldGroup } from './index.js';

const context = createExampleContext(new URL('https://example.com/en/example'), 'en');
const block = {
  utils: {
    asset: (id: string) => id,
    formatMessage: (message: string) => message,
    remap: (remapper: Remapper, data: unknown) => remap(remapper, data, context),
  },
} as BlockProps;

it('nests field labels below the group label by default', () => {
  render(
    <Context.Provider value={block}>
      <FieldGroup
        data={{ name: 'Alice' }}
        field={{ label: 'Contact', fields: [{ label: 'Name', value: { prop: 'name' } }] }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('heading', { level: 5, name: 'Contact' })).toBeDefined();
  expect(screen.getByRole('heading', { level: 6, name: 'Name' })).toBeDefined();
});

it('uses the configured heading levels', () => {
  render(
    <Context.Provider value={block}>
      <FieldGroup
        data={{ name: 'Alice' }}
        field={{
          label: 'Contact',
          labelLevel: 2,
          fields: [{ label: 'Name', labelLevel: 3, value: { prop: 'name' } }],
        }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('heading', { level: 2, name: 'Contact' })).toBeDefined();
  expect(screen.getByRole('heading', { level: 3, name: 'Name' })).toBeDefined();
});
