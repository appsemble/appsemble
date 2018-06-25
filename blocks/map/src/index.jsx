import 'leaflet/dist/leaflet.css';
import leaflet from 'leaflet';

import { bootstrap } from '../../../sdk';
import './index.css';


bootstrap((shadow) => {
  const node = shadow.appendChild(document.createElement('div'));
  const map = leaflet.map(node, { attributionControl: false }).setView([52.3960472, 4.8948808], 14);
  leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
});
