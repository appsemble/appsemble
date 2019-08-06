import { BlockProps } from '@appsemble/react';
import { Location } from '@appsemble/react-components';
import { remapData } from '@appsemble/utils';
import React from 'react';

import iconUrl from '../../../../../../themes/amsterdam/core/marker.svg';
import { Field } from '../../../../block';
import styles from './GeoCoordinatesRenderer.css';

export interface GeoCoordinatesRendererProps extends Partial<BlockProps> {
  /**
   * The current value.
   */
  value: any;

  /**
   * Structure used to define this field.
   */
  field: Field;

  data: any;
}

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default class GeoCoordinatesRenderer extends React.Component<GeoCoordinatesRendererProps> {
  static defaultProps = {
    value: {},
  };

  render(): JSX.Element {
    const {
      data,
      field: { label, latitude, longitude },
      value,
      theme,
    } = this.props;

    let lat: number;
    let lng: number;

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
