// TODO: don't depend on this, declare your own type
import { type Theme } from '@appsemble/lang-sdk';
import { type BlockProps, withBlock } from '@appsemble/preact';
import {
  CircleMarker,
  type DivIcon,
  type Icon,
  type LocationEvent,
  Map,
  type MapOptions,
  Marker,
  TileLayer,
} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Component, createRef, type VNode } from 'preact';

export interface LocationProps {
  className?: string;

  /**
   * The accessible name of the map.
   */
  label: string;

  latitude: number;
  longitude: number;
  radius: number;
  mapOptions?: MapOptions;
  theme: Theme;
  marker?: DivIcon | Icon;
}

/**
 * Render a location based marker based on leaflet.
 */
class LocationComponent extends Component<BlockProps & LocationProps> {
  ref = createRef<HTMLElement>();

  componentDidMount(): void {
    const {
      latitude,
      longitude,
      mapOptions,
      marker,
      radius,
      theme: { primaryColor, tileLayer },
    } = this.props;

    // @ts-expect-error strictNullChecks not assignable to type
    const locationMarker = new CircleMarker(null, {
      color: primaryColor,
      radius,
    });

    const map = new Map(this.ref.current as HTMLElement, {
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
    const { className, label } = this.props;
    return <section aria-label={label} className={className} ref={this.ref} />;
  }
}

export const Location = withBlock<LocationProps>(LocationComponent);
