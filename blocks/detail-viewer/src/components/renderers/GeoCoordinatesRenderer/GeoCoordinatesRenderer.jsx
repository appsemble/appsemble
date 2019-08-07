import { Location } from '@appsemble/react-components';
import { remapData } from '@appsemble/utils/remap';
import PropTypes from 'prop-types';
import React from 'react';

import iconUrl from '../../../../../../themes/amsterdam/core/marker.svg';
import styles from './GeoCoordinatesRenderer.css';

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default class GeoCoordinatesRenderer extends React.Component {
  static propTypes = {
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
      label: PropTypes.string,
    }).isRequired,

    /**
     * The current theme provided by the Appsemble SDK.
     */
    theme: PropTypes.shape().isRequired,
  };

  static defaultProps = {
    value: {},
  };

  render() {
    const {
      data,
      field: { label, latitude, longitude },
      value,
      theme,
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

    return (
      <div className={styles.root}>
        {label && <h1 className="label">{label}</h1>}

        <Location
          className={styles.map}
          iconHeight={40}
          iconUrl={iconUrl}
          iconWidth={40}
          latitude={lat}
          longitude={lng}
          theme={theme}
        />
      </div>
    );
  }
}
