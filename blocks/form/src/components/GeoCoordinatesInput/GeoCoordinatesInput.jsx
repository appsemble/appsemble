import 'leaflet/dist/leaflet.css';

import classNames from 'classnames';
import { TileLayer } from 'leaflet/src/layer';
import { CircleMarker } from 'leaflet/src/layer/vector';
import { Map } from 'leaflet/src/map';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './GeoCoordinatesInput.css';

/**
 * An input element for an object type schema which implements GeoCoordinates.
 */
export default class GeoCoordinatesInput extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    field: PropTypes.shape().isRequired,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    reactRoot: PropTypes.instanceOf(HTMLElement).isRequired,
    utils: PropTypes.shape().isRequired,
    theme: PropTypes.shape().isRequired,
  };

  locationMarker = new CircleMarker(null, {
    color: getComputedStyle(this.props.reactRoot).getPropertyValue('--primary-color'),
  });

  ref = React.createRef();

  componentDidMount() {
    const {
      field,
      onChange,
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
      .on('locationfound', ({ latlng }) => {
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .on('move', () => {
        const { lng, lat } = map.getCenter();
        onChange(
          { target: { name: field.name } },
          {
            latitude: lat,
            longitude: lng,
          },
        );
      })
      .locate({ setView: true });
    this.map = map;
  }

  onReset = () => {
    this.map.setView(this.locationMarker.getLatLng());
  };

  render() {
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
