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
  const map = new Map(node, { attributionControl: false })
    .on('locationfound', ({ latlng }) => {
      locationMarker.setLatLng(latlng).addTo(map);
    })
    .setView([52.3960472, 4.8948808], 14);
  const layer = new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  map.locate({ setView: true });
  layer.addTo(map);

  loadMarkers(map, actions, resources, block.parameters);
});
