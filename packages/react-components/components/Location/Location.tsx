import 'leaflet/dist/leaflet.css';
import {
  CircleMarker,
  Icon,
  LocationEvent,
  Map,
  MapOptions,
  Marker,
  Point,
  TileLayer,
} from 'leaflet';
import * as React from 'react';
import { BlockProps } from '@appsemble/react';

export interface LocationProps {
  className?: string;
  iconHeight: number;
  iconUrl: string;
  iconWidth: number;
  latitude: number;
  longitude: number;
  mapOptions: MapOptions;
}

/**
 * Render a location based marker based on leaflet.
 */
export default class Location extends React.Component<LocationProps & BlockProps> {
  ref = React.createRef<HTMLDivElement>();

  componentDidMount(): void {
    const {
      iconHeight,
      iconUrl,
      iconWidth,
      latitude,
      longitude,
      mapOptions,
      reactRoot,
    } = this.props;

    const locationMarker = new CircleMarker(null, {
      color: getComputedStyle(reactRoot).getPropertyValue('--primary-color'),
    });

    const map = new Map(this.ref.current, { attributionControl: false, ...mapOptions })
      .on('locationfound', ({ latlng }: LocationEvent) => {
        locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate()
      .setView([latitude, longitude], 16);
    new TileLayer(
      'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    ).addTo(map);
    new Marker(null, {
      icon: new Icon({
        iconUrl,
        iconAnchor: new Point(iconWidth / 2, iconHeight),
      }),
    })
      .setLatLng([latitude, longitude])
      .addTo(map);
  }

  render(): JSX.Element {
    const { className } = this.props;
    return <div ref={this.ref} className={className} />;
  }
}
