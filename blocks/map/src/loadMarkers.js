import { Point } from 'leaflet/src/geometry';
import { Icon, Marker } from 'leaflet/src/layer';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


const MARKER_ICON_WIDTH = 25;
const MARKER_ICON_HEIGHT = 41;


export default async function loadMarkers(map, actions, resources) {
  const response = await resources.marker.query();

  response.data.forEach((data) => {
    new Marker([data.latitude, data.longitude], {
      icon: new Icon({
        iconUrl,
        iconRetinaUrl,
        iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
        shadowUrl,
      }),
    })
      .on('click', actions.markerClick.dispatch.bind(null, data))
      .addTo(map);
  });
}
