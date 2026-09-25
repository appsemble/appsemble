// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type IconRegistry, resolveIconReference } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen, within } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { GeoCoordinatesInput } from './index.js';
import { type GeoCoordinatesField } from '../../../block.js';

// Leaflet loads map tiles and asks for the device location.
vi.mock('leaflet', () => {
  class Map {
    dragging = { disable: vi.fn(), enable: vi.fn() };

    locate(): this {
      return this;
    }

    off(): this {
      return this;
    }

    on(): this {
      return this;
    }

    once(): this {
      return this;
    }
  }
  return { CircleMarker: vi.fn(), Map, TileLayer: vi.fn() };
});

const field: GeoCoordinatesField = {
  type: 'geocoordinates',
  name: 'location',
  label: 'Location',
};

function renderGeoCoordinatesInput(registry?: IconRegistry): void {
  const params = getDefaultBootstrapParams();
  const props = {
    ...params,
    utils: {
      ...params.utils,
      resolveIcon(reference: string) {
        const resolved = resolveIconReference(reference, registry);
        return resolved.type === 'asset'
          ? { type: 'asset', url: `https://example.com/assets/${resolved.asset}` }
          : resolved;
      },
    },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <GeoCoordinatesInput
        error={null}
        field={field}
        formValues={{}}
        name="location"
        onChange={vi.fn()}
      />
    </Context.Provider>,
  );
}

it('should render the app’s override for the crosshairs icons', () => {
  renderGeoCoordinatesInput({ target: { asset: 'target', overrides: ['crosshairs'] } });

  const button = screen.getByRole('button', { name: 'resetLocation' });
  expect(within(button).getByAltText('')).toHaveProperty(
    'src',
    'https://example.com/assets/target',
  );
  expect(screen.getAllByAltText('').map((image) => image.getAttribute('src'))).toStrictEqual([
    'https://example.com/assets/target',
    'https://example.com/assets/target',
  ]);
});

it('should not render an image for the crosshairs icons without an override', () => {
  renderGeoCoordinatesInput();

  expect(screen.queryAllByAltText('')).toStrictEqual([]);
});
