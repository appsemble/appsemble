import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import { Point } from 'leaflet/src/geometry';
import { Icon, Marker, TileLayer } from 'leaflet/src/layer';
import { Map } from 'leaflet/src/map';
import { CircleMarker } from 'leaflet/src/layer/vector';
import React from 'react';
import { remapData } from '@appsemble/utils/remap';

import iconUrl from '../../../../../../themes/amsterdam/core/marker.svg';
import styles from './GeoCoordinatesRenderer.css';

const MARKER_ICON_WIDTH = 40;
const MARKER_ICON_HEIGHT = 40;

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default class GeoCoordinatesRenderer extends React.Component {
  static propTypes = {
    reactRoot: PropTypes.instanceOf(HTMLElement).isRequired,
    /**
     * The current value.
     */
    value: PropTypes.shape(),
    /**
     * The data structure to read from.
     */
    data: PropTypes.shape().isRequired,
    /**
     * Structure used to define this field.
     */
    field: PropTypes.shape({
      longitude: PropTypes.string,
      latitude: PropTypes.string,
    }).isRequired,
  };

  static defaultProps = {
    value: {},
  };

  ref = React.createRef();

  locationMarker = new CircleMarker(null, {
    // eslint-disable-next-line react/destructuring-assignment
    color: getComputedStyle(this.props.reactRoot).getPropertyValue('--primary-color'),
  });

  componentDidMount() {
    const {
      value,
      data,
      field: { longitude, latitude },
    } = this.props;

    let lat;
    let lng;

    if (value) {
      // Relative to value
      lat = latitude ? remapData(latitude, value) : value.lat;
      lng = longitude ? remapData(longitude, value) : value.lng;
    } else {
      // Relative to root
      lat = remapData(latitude, data);
      lng = remapData(longitude, data);
    }

    const map = new Map(this.ref.current, { attributionControl: false })
      .on('locationfound', ({ latlng }) => {
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate()
      .setView([lat, lng], 16);
    new TileLayer(
      'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    ).addTo(map);
    new Marker(null, {
      icon: new Icon({
        iconUrl,
        iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
      }),
    })
      .setLatLng([lat, lng])
      .addTo(map);
  }

  render() {
    const {
      field: { label },
    } = this.props;

    return (
      <div className={styles.root}>
        {label && <h1 className="label">{label}</h1>}
        <div ref={this.ref} className={styles.map} />
      </div>
    );
  }
}
