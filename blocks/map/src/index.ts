import 'leaflet/dist/leaflet.css';
import './index.css';

import { attach } from '@appsemble/sdk';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';

import createGetters, { BlockActions, BlockParameters } from './createGetters';
import loadMarkers from './loadMarkers';

attach<BlockParameters, BlockActions>(
  ({ actions, block, data, shadowRoot, theme: { primaryColor, tileLayer }, utils }) => {
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
        loadMarkers(map, actions, block.parameters, fetched, get, data);
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
      .on('locationfound', ({ latlng }: LocationEvent) => {
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          map.setView(latlng, 18);
        }
        locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], 18);
    }
  },
);
