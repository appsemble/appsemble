import { Point } from 'leaflet/src/geometry';
import { Icon, Marker } from 'leaflet/src/layer';

import iconUrl from '../../../apps/unlittered/marker.svg';

const MARKER_ICON_WIDTH = 39;
const MARKER_ICON_HEIGHT = 39;
const ACTIVE_MARKER_ICON_WIDTH = 64;
const ACTIVE_MARKER_ICON_HEIGHT = 64;

function makeFilter(fields, bounds) {
  const [lon, lat] = fields;
  const east = bounds.getEast();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const west = bounds.getWest();

  return `${lat} gt ${west} and ${lat} lt ${east} and ${lon} gt ${south} and ${lon} lt ${north}`;
}

export default async function loadMarkers(map, actions, resources, parameters, fetched, get, data) {
  const response = await resources.marker.query({
    $filter: makeFilter(
      [parameters.latitude || 'latitude', parameters.longitude || 'longitude'],
      map.getBounds(),
    ),
  });

  response.data.forEach(marker => {
    if (fetched.has(marker.id)) {
      return;
    }
    fetched.add(marker.id);
    const lat = get.lat(marker);
    const lng = get.lng(marker);
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return;
    }
    new Marker([lat, lng], {
      icon:
        data && data.id === marker.id
          ? new Icon({
              iconUrl,
              iconSize: new Point(ACTIVE_MARKER_ICON_WIDTH, ACTIVE_MARKER_ICON_HEIGHT),
              iconAnchor: new Point(ACTIVE_MARKER_ICON_WIDTH / 2, ACTIVE_MARKER_ICON_HEIGHT),
            })
          : new Icon({
              iconUrl,
              iconSize: new Point(MARKER_ICON_WIDTH, MARKER_ICON_HEIGHT),
              iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
            }),
    })
      .on('click', actions.markerClick.dispatch.bind(null, marker))
      .addTo(map);
  });
}
