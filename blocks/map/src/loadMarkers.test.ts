// @vitest-environment jsdom

import { type BootstrapParams, type Remapper } from '@appsemble/sdk';
import { screen } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { Map } from 'leaflet';
import { afterEach, expect, it, vi } from 'vitest';

import { loadMarkers } from './loadMarkers.js';

afterEach(() => document.body.replaceChildren());

function renderMarkers(
  markerLabel?: Remapper,
): ReturnType<typeof vi.fn<(marker: unknown) => void>> {
  const onMarkerClick = vi.fn<(marker: unknown) => void>();
  const node = document.createElement('div');
  document.body.append(node);
  const map = new Map(node, { center: [52, 5], zoom: 16 });
  const params = {
    actions: { onMarkerClick },
    parameters: { latitude: { prop: 'lat' }, longitude: { prop: 'lng' }, markerLabel },
    utils: {
      fa: (icon: string) => `fas fa-${icon}`,
      formatMessage: (message: string) => message,
      // The markers only use prop remappers, so this stands in for the host's remapper.
      remap: (remapper: { prop: string } | undefined, data: Record<string, unknown>) =>
        remapper && data[remapper.prop],
      resolveIcon: () => ({ type: 'fontawesome' }),
    },
  } as unknown as BootstrapParams;

  loadMarkers(
    [{ id: 1, lat: 52, lng: 5, name: 'Town hall' }] as never,
    new Set(),
    null,
    params,
    map,
  );
  return onMarkerClick;
}

it('names each marker after the marker data', async () => {
  renderMarkers({ prop: 'name' });

  expect(await screen.findByRole('button', { name: 'Town hall' })).toBeDefined();
});

it('gives markers a generic name without a markerLabel', async () => {
  renderMarkers();

  expect(await screen.findByRole('button', { name: 'marker' })).toBeDefined();
  expect(screen.queryByTitle('marker')).toBeNull();
});

it.each(['{Enter}', ' '])('activates a marker with the keyboard (%s)', async (key) => {
  const onMarkerClick = renderMarkers({ prop: 'name' });

  (await screen.findByRole('button', { name: 'Town hall' })).focus();
  await userEvent.keyboard(key);

  expect(onMarkerClick).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: 'Town hall' }),
  );
});
