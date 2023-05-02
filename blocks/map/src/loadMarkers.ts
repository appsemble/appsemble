import { type BootstrapParams } from '@appsemble/sdk';
import { type LatLngBounds, type LayerGroup, type Map, Marker } from 'leaflet';

import { createIcon } from './createIcon.js';

export function makeFilter(fields: [string, string], bounds: LatLngBounds): string {
  const [lon, lat] = fields;
  const east = bounds.getEast();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const west = bounds.getWest();

  return `${lat} gt ${west} and ${lat} lt ${east} and ${lon} gt ${south} and ${lon} lt ${north}`;
}

interface BlockMarker {
  id: number;
}

export function loadMarkers(
  markers: BlockMarker[],
  fetched: Set<number>,
  data: any,
  params: BootstrapParams,
  target: LayerGroup | Map,
): void {
  if (!Array.isArray(markers)) {
    return;
  }
  for (const marker of markers) {
    if (fetched.has(marker.id)) {
      return;
    }
    fetched.add(marker.id);
    const lat = params.utils.remap(params.parameters.latitude, marker) as number;
    const lng = params.utils.remap(params.parameters.longitude, marker) as number;
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return;
    }
    createIcon(params, data && data.id === marker.id).then((icon) =>
      new Marker([lat, lng], { icon })
        .on('click', () => params.actions.onMarkerClick(marker))
        .addTo(target),
    );
  }
}
