/** @jsx h */
import 'leaflet/dist/leaflet.css';

import { BlockProps } from '@appsemble/preact';
import classNames from 'classnames';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';
import { Component, createRef, h, VNode } from 'preact';

import { GeoCoordinatesField, InputProps } from '../../../block';
import styles from './GeoCoordinatesInput.css';

type GeoCoordinatesInputProps = InputProps<{}, GeoCoordinatesField> & BlockProps;

/**
 * An input element for an object type schema which implements GeoCoordinates.
 */
export default class GeoCoordinatesInput extends Component<GeoCoordinatesInputProps> {
  locationMarker = new CircleMarker(null, {
    color: this.props.theme.primaryColor,
  });

  ref = createRef<HTMLDivElement>();

  map: Map;

  componentDidMount(): void {
    const {
      field,
      onInput,
      utils,
      theme: { tileLayer },
    } = this.props;

    const map = new Map(this.ref.current, {
      attributionControl: false,
      layers: [new TileLayer(tileLayer)],
    })
      .once('locationerror', () => {
        utils.showMessage({
          // XXX Implement i18n.
          body: 'Locatie kon niet worden gevonden. Is de locatievoorziening ingeschakeld?',
        });
      })
      .on('locationfound', ({ latlng }: LocationEvent) => {
        if (!this.locationMarker.getLatLng()) {
          map.setView(latlng, 18);
        }
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .on('move', () => {
        const { lng, lat } = map.getCenter();
        onInput(({ target: { name: field.name } } as any) as Event, {
          latitude: lat,
          longitude: lng,
        });
      })
      .locate({ watch: true, timeout: 1e3, maximumAge: 60e3 });
    this.map = map;
  }

  onReset = (): void => {
    this.map.setView(this.locationMarker.getLatLng(), 16);
  };

  render(): VNode {
    return (
      <div className={styles.root}>
        <div ref={this.ref} className={styles.map} />
        <div className={styles.crossHairsOverlay}>
          <i className={classNames('fas', 'fa-crosshairs', styles.crossHairs)} />
        </div>
        <button
          className={classNames('button', styles.resetButton)}
          onClick={this.onReset}
          type="button"
        >
          <span className={classNames('icon', styles.currentlocation)}>
            <i className="fas fa-crosshairs" />
          </span>
        </button>
      </div>
    );
  }
}
