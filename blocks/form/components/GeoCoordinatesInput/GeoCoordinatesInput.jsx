import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import { Point } from 'leaflet/src/geometry';
import { Icon, Marker, TileLayer } from 'leaflet/src/layer';
import { Map } from 'leaflet/src/map';
import { CircleMarker } from 'leaflet/src/layer/vector';
import React from 'react';

import iconUrl from '../../../../apps/unlittered/marker.svg';
import styles from './GeoCoordinatesInput.css';

const MARKER_ICON_WIDTH = 39;
const MARKER_ICON_HEIGHT = 39;

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
    /**
     * The current value.
     */
    value: PropTypes.shape(),
  };

  static defaultProps = {
    value: {},
  };

  marker = new Marker(null, {
    icon: new Icon({
      iconUrl,
      iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
    }),
  });

  locationMarker = new CircleMarker(null, {
    // eslint-disable-next-line react/destructuring-assignment
    color: getComputedStyle(this.props.reactRoot).getPropertyValue('--primary-color'),
  });

  ref = React.createRef();

  componentDidMount() {
    const { field, onChange } = this.props;

    const map = new Map(this.ref.current, { attributionControl: false })
      .on('locationfound', ({ latlng }) => {
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .on('click', ({ latlng }) => {
        onChange(
          { target: { name: field.name } },
          {
            latitude: latlng.lat,
            longitude: latlng.lng,
          },
        );
      })
      .locate({ setView: true });
    new TileLayer(
      'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    ).addTo(map);
    this.map = map;
  }

  componentDidUpdate() {
    const { value } = this.props;

    if (value?.latitude && value.longitude) {
      this.marker.setLatLng([value.latitude, value.longitude]).addTo(this.map);
    } else {
      this.marker.remove();
    }
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.map} ref={this.ref} />
      </div>
    );
  }
}
