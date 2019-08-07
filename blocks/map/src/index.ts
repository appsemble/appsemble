import 'leaflet/dist/leaflet.css';
import './index.css';

import { attach } from '@appsemble/sdk';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';

import createGetters, { BlockActions, BlockParameters } from './createGetters';
import loadMarkers from './loadMarkers';

attach<BlockParameters, BlockActions>(
  ({ actions, block, data, shadowRoot, utils, theme: { primaryColor, tileLayer } }) => {
    const node = shadowRoot.appendChild(document.createElement('div'));
    const fetched = new Set<number>();

    const get = createGetters(block.parameters);
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
      .once('locationerror', () => {
        utils.showMessage({
          // XXX Implement i18n.
          body: 'Locatie kon niet worden gevonden. Is de locatievoorziening ingeschakeld?',
        });
      })
      .on('locationfound', ({ latlng }: LocationEvent) => {
        locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate({ watch: true });
    const lat = Number(get.lat(data));
    const lng = Number(get.lng(data));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      map.locate({ setView: true });
    } else {
      map.setView([lat, lng], 18);
    }
  },
);
