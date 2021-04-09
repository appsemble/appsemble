import { BootstrapParams } from '@appsemble/sdk';
import { LatLngBounds, LayerGroup, Map, Marker } from 'leaflet';

import { createIcon } from './createIcon';

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
  markers.forEach(async (marker) => {
    if (fetched.has(marker.id)) {
      return;
    }
    fetched.add(marker.id);
    const lat = params.utils.remap(params.parameters.latitude, marker);
    const lng = params.utils.remap(params.parameters.longitude, marker);
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return;
    }
    new Marker([lat, lng], { icon: await createIcon(params, data && data.id === marker.id) })
      .on('click', () => params.actions.onMarkerClick(marker))
      .addTo(target);
  });
}
