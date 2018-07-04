import { bootstrap } from '@appsemble/sdk';
import 'leaflet/dist/leaflet.css';
import { Map } from 'leaflet/src/map';
import { TileLayer } from 'leaflet/src/layer';

import './index.css';
import loadMarkers from './loadMarkers';


bootstrap(({ resources, shadowRoot }) => {
  const node = shadowRoot.appendChild(document.createElement('div'));
  const map = new Map(node, { attributionControl: false }).setView([52.3960472, 4.8948808], 14);
  const layer = new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  layer.addTo(map);

  loadMarkers(map, resources);
});
