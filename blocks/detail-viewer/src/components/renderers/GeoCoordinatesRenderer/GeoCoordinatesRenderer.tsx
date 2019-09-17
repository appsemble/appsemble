/** @jsx h */
import { Location } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';

import iconUrl from '../../../../../../themes/amsterdam/core/marker.svg';
import { GeoCoordinatesField, RendererProps } from '../../../../block';
import styles from './GeoCoordinatesRenderer.css';

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default function GeoCoordinatesRenderer({
  data,
  field: { label, latitude, longitude },
  value = {},
  theme,
}: RendererProps<GeoCoordinatesField>): VNode {
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
