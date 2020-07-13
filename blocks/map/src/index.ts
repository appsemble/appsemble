import 'leaflet/dist/leaflet.css';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.css';
import '@wesselkuipers/leaflet.markercluster/dist/MarkerCluster.Default.css';
import './index.css';

import { attach } from '@appsemble/sdk';
import { MarkerClusterGroup } from '@wesselkuipers/leaflet.markercluster';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';

import createGetters from './createGetters';
import loadMarkers, { makeFilter } from './loadMarkers';

attach((params) => {
  const {
    data,
    events,
    parameters,
    shadowRoot,
    theme: { primaryColor, tileLayer },
    utils,
  } = params;
  const node = shadowRoot.appendChild(document.createElement('div'));
  const fetched = new Set<number>();

  const get = createGetters(parameters);
  const lat = Number(get.lat(data));
  const lng = Number(get.lng(data));
  const hasExplicitCenter = Number.isFinite(lat) && Number.isFinite(lng);
  const locationMarker = new CircleMarker(null, {
    color: primaryColor,
  });
  const { defaultLocation = [51.476852, 0] } = parameters;

  const map = new Map(node, {
    attributionControl: false,
    layers: [new TileLayer(tileLayer)],
    center: hasExplicitCenter ? [lat, lng] : defaultLocation,
    zoom: 16,
  });

  // Make sure tile layers are properly loaded.
  // https://github.com/Leaflet/Leaflet/issues/694
  setTimeout(() => map.invalidateSize(), 0);

  // Cleanup the map when the block gets removed.
  utils.addCleanup(() => map.remove());

  map
    /**
     * When the user has moved the map, fetch new relevant markers.
     */
    .on('moveend', () => {
      events.emit.move({
        $filter: makeFilter(
          [parameters.latitude || 'latitude', parameters.longitude || 'longitude'],
          map.getBounds(),
        ),
      });
    })

    /**
     *  When a location error occurs because location is disabled, show a message to the user.
     */
    .once('locationerror', (error) => {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
      if (error?.code === 1) {
        utils.showMessage({
          // XXX Implement i18n.
          body: 'Locatie kon niet worden gevonden. Is de locatievoorziening ingeschakeld?',
        });
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
    loadMarkers(d, fetched, get, data, params, cluster || map);
  });
});
