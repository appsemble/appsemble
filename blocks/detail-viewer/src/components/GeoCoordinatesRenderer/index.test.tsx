import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { GeoCoordinatesRenderer } from './index.js';

const context = createExampleContext(new URL('https://example.com/en/example'), 'en');
const block = {
  parameters: { icons: { asset: 'marker' } },
  theme: { tileLayer: 'https://example.com/{z}/{x}/{y}.png' },
  utils: {
    asset: (id: string) => id,
    formatMessage: (message: string) => message,
    remap: (remapper: Remapper, data: unknown) => remap(remapper, data, context),
  },
} as unknown as BlockProps;

it.each([
  [undefined, 6],
  [3, 3],
] as const)('labels the map with a heading (labelLevel: %s)', (labelLevel, level) => {
  render(
    <Context.Provider value={block}>
      <GeoCoordinatesRenderer
        data={{ location: { lat: 52, lng: 5 } }}
        field={{
          type: 'geocoordinates',
          label: 'Location',
          labelLevel,
          value: { prop: 'location' },
        }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('heading', { level, name: 'Location' })).toBeDefined();
});
