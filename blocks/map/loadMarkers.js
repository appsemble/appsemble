import { compileFilters } from '@appsemble/utils/remap';
import { Point } from 'leaflet/src/geometry';
import { Icon, Marker } from 'leaflet/src/layer';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


const MARKER_ICON_WIDTH = 25;
const MARKER_ICON_HEIGHT = 41;


export default async function loadMarkers(map, actions, resources, parameters) {
  const getLatitude = parameters.latitude == null ? (
    data => data.latitude
  ) : (
    compileFilters(parameters.latitude)
  );
  const getLongitude = parameters.longitude == null ? (
    data => data.longitude
  ) : (
    compileFilters(parameters.longitude)
  );
  const response = await resources.marker.query();

  response.data.forEach((data) => {
    new Marker([getLatitude(data), getLongitude(data)], {
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
