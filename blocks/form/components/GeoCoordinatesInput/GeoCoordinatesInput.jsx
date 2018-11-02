import 'leaflet/dist/leaflet.css';
import { Button, Icon, Fas } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import { TileLayer } from 'leaflet/src/layer';
import { Map } from 'leaflet/src/map';
import { CircleMarker } from 'leaflet/src/layer/vector';
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
  };

  locationMarker = new CircleMarker(null, {
    // eslint-disable-next-line react/destructuring-assignment
    color: getComputedStyle(this.props.reactRoot).getPropertyValue('--primary-color'),
  });

  ref = React.createRef();

  componentDidMount() {
    const { field, onChange, utils } = this.props;

    const map = new Map(this.ref.current, { attributionControl: false })
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
    new TileLayer(
      'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    ).addTo(map);
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
          <Fas className={styles.currentlocation} fa="currentlocation" />
        </div>
        <Button className={styles.resetButton} onClick={this.onReset}>
          <Icon className={styles.currentlocation} fa="currentlocation" />
        </Button>
      </div>
    );
  }
}
