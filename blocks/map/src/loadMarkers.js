import { Icon, Marker } from 'leaflet/src/layer';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


export default async function loadMarkers(map, actions, resources) {
  const response = await resources.marker.query();

  response.data.forEach(({ data, lat, lon }) => {
    new Marker([lat, lon], {
      icon: new Icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
      }),
    })
      .on('click', () => {
        actions.markerClick.dispatch({ data, lat, lon });
      })
      .addTo(map);
  });
}
