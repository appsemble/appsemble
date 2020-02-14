// eslint-disable-next-line simple-import-sort/sort
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import './index.css';

import { attach } from '@appsemble/sdk';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import createGetters, { BlockActions, BlockParameters, Events } from './createGetters';
import loadMarkers, { makeFilter } from './loadMarkers';

const { CircleMarker, Map, TileLayer, markerClusterGroup } = L;

attach<BlockParameters, BlockActions, Events>(
  ({ actions, block, data, events, shadowRoot, theme: { primaryColor, tileLayer }, utils }) => {
    const node = shadowRoot.appendChild(document.createElement('div'));
    const fetched = new Set<number>();

    const get = createGetters(block.parameters);
    const lat = Number(get.lat(data));
    const lng = Number(get.lng(data));
    const locationMarker = new CircleMarker(null, {
      color: primaryColor,
    });

    const map = new Map(node, {
      attributionControl: false,
      layers: [new TileLayer(tileLayer)],
    })
      .on('moveend', () => {
        events.emit.move({
          $filter: makeFilter(
            [block.parameters.latitude || 'latitude', block.parameters.longitude || 'longitude'],
            map.getBounds(),
          ),
        });
      })
      .once('locationerror', error => {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
        if (error.code && error.code === 1) {
          utils.showMessage({
            // XXX Implement i18n.
            body: 'Locatie kon niet worden gevonden. Is de locatievoorziening ingeschakeld?',
          });
          map.setView([0, 0], 18);
        }

        // XXX: Handle TIMEOUT. These are thrown in the .locate() call when `watch` is set to true.
      })
      .on('locationfound', ({ latlng }: L.LocationEvent) => {
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          map.setView(latlng, 18);
        }
        locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], 18);
    }

    const cluster = markerClusterGroup({ chunkedLoading: true });
    map.addLayer(cluster);

    events.on.data(d => {
      loadMarkers(d, fetched, get, data, actions, cluster);
    });
  },
);
