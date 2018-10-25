import { attach } from '@appsemble/sdk';
import 'leaflet/dist/leaflet.css';
import { Map } from 'leaflet/src/map';
import { TileLayer } from 'leaflet/src/layer';
import { CircleMarker } from 'leaflet/src/layer/vector';

import './index.css';
import loadMarkers from './loadMarkers';

attach(function* init({ actions, block, resources }) {
  const node = document.createElement('div');
  yield node;

  const locationMarker = new CircleMarker(null, {
    color: getComputedStyle(node).getPropertyValue('--primary-color'),
  });
  const map = new Map(node, { attributionControl: false }).locate({ setView: true });
  map.on('locationfound', ({ latlng }) => {
    locationMarker.setLatLng(latlng).addTo(map);
    const bounds = map.getBounds();
    loadMarkers(map, actions, resources, block.parameters, bounds);
  });
  map.on('moveend', () => {
    const bounds = map.getBounds();
    loadMarkers(map, actions, resources, block.parameters, bounds);
    console.dir(bounds);
  });
  const layer = new TileLayer(
    'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  );
  layer.addTo(map);

  // loadMarkers(map, actions, resources, block.parameters);
});
