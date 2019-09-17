import 'leaflet/dist/leaflet.css';

import { BlockProps } from '@appsemble/react';
import { Theme } from '@appsemble/types';
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

export interface LocationProps {
  className?: string;
  iconHeight: number;
  iconUrl: string;
  iconWidth: number;
  latitude: number;
  longitude: number;
  mapOptions?: MapOptions;
  theme: Theme;
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
      theme: { primaryColor, tileLayer },
    } = this.props;

    const locationMarker = new CircleMarker(null, {
      color: primaryColor,
    });

    const map = new Map(this.ref.current, {
      attributionControl: false,
      zoom: 16,
      center: [latitude, longitude],
      layers: [
        new TileLayer(tileLayer),
        new Marker([latitude, longitude], {
          icon: new Icon({
            iconUrl,
            iconAnchor: new Point(iconWidth / 2, iconHeight),
          }),
        }),
      ],
      ...mapOptions,
    })
      .on('locationfound', ({ latlng }: LocationEvent) => {
        locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate({ watch: true, timeout: 1e3, maximumAge: 60e3 });
  }

  render(): JSX.Element {
    const { className } = this.props;
    return <div ref={this.ref} className={className} />;
  }
}
