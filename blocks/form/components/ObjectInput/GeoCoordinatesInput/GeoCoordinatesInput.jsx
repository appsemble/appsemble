import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Point } from 'leaflet/src/geometry';
import { Icon, Marker, TileLayer } from 'leaflet/src/layer';
import { Map } from 'leaflet/src/map';
import React from 'react';

import styles from './GeoCoordinatesInput.css';


const MARKER_ICON_WIDTH = 25;
const MARKER_ICON_HEIGHT = 41;


/**
 * An input element for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default class GeoCoordinatesInput extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The current value.
     */
    value: PropTypes.shape(),
  };

  static defaultProps = {
    name: null,
    value: {},
  };

  marker = new Marker(null, {
    icon: new Icon({
      iconUrl,
      iconRetinaUrl,
      iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
      shadowUrl,
    }),
  });

  ref = React.createRef();

  componentDidMount() {
    const {
      name,
      onChange,
    } = this.props;

    const map = new Map(this.ref.current, { attributionControl: false }).locate({ setView: true });
    new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    map.on('click', ({ latlng }) => {
      onChange({ target: { name } }, {
        latitude: latlng.lat,
        longitude: latlng.lng,
      });
    });
    this.map = map;
  }

  componentDidUpdate() {
    const {
      value,
    } = this.props;

    if (value?.latitude && value.longitude) {
      this.marker.setLatLng([value.latitude, value.longitude]).addTo(this.map);
    } else {
      this.marker.remove();
    }
  }

  render() {
    return (
      <div className={styles.root} ref={this.ref} />
    );
  }
}
