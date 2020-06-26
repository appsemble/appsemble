import 'leaflet/dist/leaflet.css';

import { BlockProps, withBlock } from '@appsemble/preact';
import { CircleMarker, LocationEvent, Map, TileLayer } from 'leaflet';
import { Component, createRef, h, VNode } from 'preact';

import type { GeoCoordinatesField, InputProps } from '../../../block';
import styles from './index.css';

type GeoCoordinatesInputProps = InputProps<{}, GeoCoordinatesField> & BlockProps;

/**
 * An input element for an object type schema which implements GeoCoordinates.
 */
class GeoCoordinatesInput extends Component<GeoCoordinatesInputProps> {
  locationMarker = new CircleMarker(null, {
    color: this.props.theme.primaryColor,
  });

  ref = createRef<HTMLDivElement>();

  map: Map;

  componentDidMount(): void {
    const {
      field,
      onInput,
      theme: { tileLayer },
      utils,
    } = this.props;

    const map = new Map(this.ref.current, {
      attributionControl: false,
      layers: [new TileLayer(tileLayer)],
    })
      .once('locationerror', (error) => {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
        if (error.code && error.code === 1) {
          utils.showMessage({
            // XXX Implement i18n.
            body: 'Locatie kon niet worden gevonden. Is de locatievoorziening ingeschakeld?',
          });
          map.setView([0, 0], 18);
        }

        // XXX: Handle TIMEOUT. These are thrown in the .locate() call when `watch` is set to true.
      })
      .on('locationfound', ({ latlng }: LocationEvent) => {
        if (!this.locationMarker.getLatLng()) {
          map.setView(latlng, 18);
        }
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .on('move', () => {
        const { lat, lng } = map.getCenter();
        onInput(({ target: { name: field.name } } as any) as Event, {
          latitude: lat,
          longitude: lng,
        });
      })
      .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });
    this.map = map;
  }

  componentDidUpdate(): void {
    const { disabled } = this.props;
    if (disabled) {
      this.map.dragging.disable();
    } else {
      this.map.dragging.enable();
    }
  }

  onReset = (): void => {
    this.map.setView(this.locationMarker.getLatLng(), 16);
  };

  render(): VNode {
    const { className, disabled } = this.props;
    return (
      <div className={`${styles.root} ${className} is-relative mb-5`}>
        <div ref={this.ref} className={styles.map} />
        <div className={styles.crossHairsOverlay}>
          <i className={`fas fa-crosshairs ${styles.crossHairs}`} />
        </div>
        <button
          className={`button ${styles.resetButton}`}
          disabled={disabled}
          onClick={this.onReset}
          type="button"
        >
          <span className={`icon ${styles.currentlocation}`}>
            <i className="fas fa-crosshairs" />
          </span>
        </button>
      </div>
    );
  }
}

export default withBlock(GeoCoordinatesInput);
