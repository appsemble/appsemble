import { bootstrap } from '@appsemble/sdk';
import { MarkerClusterGroup } from '@wesselkuipers/leaflet.markercluster';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.css';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CircleMarker, type LatLngExpression, type LocationEvent, Map, TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import './index.css';
import { loadMarkers, makeFilter } from './loadMarkers.js';

bootstrap((params) => {
  const {
    data,
    events,
    parameters,
    shadowRoot,
    theme: { primaryColor, tileLayer },
    utils: { addCleanup, formatMessage, remap, showMessage },
  } = params;
  const node = document.createElement('div');
  shadowRoot.append(node);
  const fetched = new Set<number>();

  const latitude = data && (remap(parameters.latitude, data) as number);
  const longitude = data && (remap(parameters.longitude, data) as number);
  const hasExplicitCenter = Number.isFinite(latitude) && Number.isFinite(longitude);
  // @ts-expect-error strictNullCheck
  const locationMarker = new CircleMarker(null, {
    color: primaryColor,
    radius: 10,
  });
  const {
    defaultLocation = [51.476_852, 0],
    filterLatitudeName = 'lat',
    filterLongitudeName = 'lng',
  } = parameters;

  let following = false;

  const map = new Map(node, {
    attributionControl: false,
    layers: [new TileLayer(tileLayer)],
    center: hasExplicitCenter ? ([latitude, longitude] as LatLngExpression) : defaultLocation,
    zoom: 16,
  });

  // Make sure tile layers are properly loaded.
  // https://github.com/Leaflet/Leaflet/issues/694
  setTimeout(() => map.invalidateSize(), 0);

  // Cleanup the map when the block gets removed.
  addCleanup(() => map.remove());

  map
    // When the user has moved the map, fetch new relevant markers.
    .on('moveend', () => {
      events.emit.move({
        $filter: makeFilter([filterLatitudeName, filterLongitudeName], map.getBounds()),
      });
    })

    // When a location error occurs because location is disabled, show a message to the user.
    .once('locationerror', (error) => {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
      if (error?.code === 1) {
        showMessage({ body: formatMessage('locationError') });
      }
      // XXX: Handle TIMEOUT. These are thrown in the .locate() call when `watch` is set to true.
    })

    // Center the map once if location is found.
    .once('locationfound', ({ latlng }: LocationEvent) => {
      if (!hasExplicitCenter) {
        map.setView(latlng, 18);
      }
    })

    // Update the location marker when the user has been updated.
    .on('locationfound', ({ latlng }: LocationEvent) => {
      locationMarker.setLatLng(latlng).addTo(map);

      if (following) {
        map.setView(latlng, map.getZoom());
      }
    })

    // Start locating the map.
    .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });

  let cluster: MarkerClusterGroup;

  if (!parameters.disableClustering) {
    cluster = new MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: parameters.maxClusterRadius ?? 80,
    });
    map.addLayer(cluster);
  }

  events.on.data((d) => {
    loadMarkers(d as any, fetched, data, params, cluster || map);
  });

  events.on.center(() => {
    map.setView(locationMarker.getLatLng(), 18);
  });

  events.on.follow((d) => {
    if (typeof d === 'boolean') {
      following = d;
      return;
    }

    following = !following;

    if (following) {
      map.setView(locationMarker.getLatLng(), 18);
    }
  });
});
