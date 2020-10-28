import 'leaflet/dist/leaflet.css';

// eslint-disable-next-line import/no-deprecated
import { BlockProps, withBlock } from '@appsemble/preact';
import { Theme } from '@appsemble/sdk';
import {
  CircleMarker,
  DivIcon,
  Icon,
  LocationEvent,
  Map,
  MapOptions,
  Marker,
  TileLayer,
} from 'leaflet';
import { Component, createRef, h, VNode } from 'preact';

export interface LocationProps {
  className?: string;
  latitude: number;
  longitude: number;
  mapOptions?: MapOptions;
  theme: Theme;
  marker?: Icon | DivIcon;
}

/**
 * Render a location based marker based on leaflet.
 */
class LocationComponent extends Component<LocationProps & BlockProps> {
  ref = createRef<HTMLDivElement>();

  componentDidMount(): void {
    const {
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
          icon: marker,
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
    return <div className={className} ref={this.ref} />;
  }
}

// eslint-disable-next-line import/no-deprecated
export const Location = withBlock<LocationProps>(LocationComponent);
