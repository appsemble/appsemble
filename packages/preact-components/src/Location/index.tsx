import 'leaflet/dist/leaflet.css';

import { BlockProps, withBlock } from '@appsemble/preact';
import type { Theme } from '@appsemble/sdk';
import {
  CircleMarker,
  DivIcon,
  Icon,
  LocationEvent,
  Map,
  MapOptions,
  Marker,
  Point,
  TileLayer,
} from 'leaflet';
import { Component, createRef, h, VNode } from 'preact';

export interface LocationProps {
  className?: string;
  iconHeight: number;
  iconUrl: string;
  iconWidth: number;
  latitude: number;
  longitude: number;
  mapOptions?: MapOptions;
  theme: Theme;
  marker?: Icon | DivIcon;
}

/**
 * Render a location based marker based on leaflet.
 */
class Location extends Component<LocationProps & BlockProps> {
  ref = createRef<HTMLDivElement>();

  componentDidMount(): void {
    const {
      iconHeight,
      iconUrl,
      iconWidth,
      latitude,
      longitude,
      mapOptions,
      marker,
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
          icon:
            marker ||
            new Icon({
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
      .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });
  }

  render(): VNode {
    const { className } = this.props;
    return <div ref={this.ref} className={className} />;
  }
}

export default withBlock<LocationProps>(Location);
