import { Icon, Marker } from 'leaflet/src/layer';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


export default async function loadMarkers(map, resources) {
  const { data } = await resources.marker.query();

  data.forEach(({ lat, lon }) => {
    new Marker([lat, lon], {
      icon: new Icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
      }),
    }).addTo(map);
  });
}
