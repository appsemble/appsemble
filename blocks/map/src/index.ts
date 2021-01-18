import 'leaflet/dist/leaflet.css';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.css';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.Default.css';
import './index.css';

import { attach } from '@appsemble/sdk';
import { MarkerClusterGroup } from '@wesselkuipers/leaflet.markercluster';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';

import { loadMarkers, makeFilter } from './loadMarkers';

attach((params) => {
  const {
    data,
    events,
    parameters,
    shadowRoot,
    theme: { primaryColor, tileLayer },
    utils: { addCleanup, remap, showMessage },
  } = params;
  const node = document.createElement('div');
  shadowRoot.append(node);
  const fetched = new Set<number>();

  const latitude = data && remap(parameters.latitude, data);
  const longitude = data && remap(parameters.longitude, data);
  const hasExplicitCenter = Number.isFinite(longitude) && Number.isFinite(latitude);
  const locationMarker = new CircleMarker(null, {
    color: primaryColor,
  });
  const {
    defaultLocation = [51.476_852, 0],
    filterLatitudeName = 'lat',
    filterLongitudeName = 'lng',
    locationError = 'Couldn’t find your location. Are location services enabled?',
  } = parameters;

  const map = new Map(node, {
    attributionControl: false,
    layers: [new TileLayer(tileLayer)],
    center: hasExplicitCenter ? [latitude, longitude] : defaultLocation,
    zoom: 16,
  });

  // Make sure tile layers are properly loaded.
  // https://github.com/Leaflet/Leaflet/issues/694
  setTimeout(() => map.invalidateSize(), 0);

  // Cleanup the map when the block gets removed.
  addCleanup(() => map.remove());

  map
    /**
     * When the user has moved the map, fetch new relevant markers.
     */
    .on('moveend', () => {
      events.emit.move({
        $filter: makeFilter([filterLatitudeName, filterLongitudeName], map.getBounds()),
      });
    })

    /**
     * When a location error occurs because location is disabled, show a message to the user.
     */
    .once('locationerror', (error) => {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
      if (error?.code === 1) {
        showMessage({ body: remap(locationError, {}) });
      }
      // XXX: Handle TIMEOUT. These are thrown in the .locate() call when `watch` is set to true.
    })

    /**
     * Center the map once if location is found.
     */
    .once('locationfound', ({ latlng }: LocationEvent) => {
      if (!hasExplicitCenter) {
        map.setView(latlng, 18);
      }
    })

    /**
     * Update the location marker when the user has been updated.
     */
    .on('locationfound', ({ latlng }: LocationEvent) => {
      locationMarker.setLatLng(latlng).addTo(map);
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
    loadMarkers(d, fetched, data, params, cluster || map);
  });
});
