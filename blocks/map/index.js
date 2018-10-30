import { attach } from '@appsemble/sdk';
import 'leaflet/dist/leaflet.css';
import { Map } from 'leaflet/src/map';
import { TileLayer } from 'leaflet/src/layer';
import { CircleMarker } from 'leaflet/src/layer/vector';

import './index.css';
import createGetters from './createGetters';
import loadMarkers from './loadMarkers';

attach(function* init({ actions, block, data, resources }) {
  const node = document.createElement('div');
  const fetched = new Set();
  yield node;

  const get = createGetters(block.parameters);
  const locationMarker = new CircleMarker(null, {
    color: getComputedStyle(node).getPropertyValue('--primary-color'),
  });
  const map = new Map(node, { attributionControl: false })
    .on('moveend', () => {
      loadMarkers(map, actions, resources, block.parameters, fetched, get, data);
    })
    .on('locationfound', ({ latlng }) => {
      locationMarker.setLatLng(latlng).addTo(map);
    });
  const lat = get.lat(data);
  const lng = get.lng(data);
  if (Number.isNaN(Number(lat)) && Number.isNaN(Number(lng))) {
    map.locate().setView([lat, lng]);
  } else {
    map.locate({ setView: true });
  }
  const layer = new TileLayer(
    'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  );
  layer.addTo(map);
});
