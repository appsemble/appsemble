import { useBlock } from '@appsemble/preact';
import { Location } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';
import type { GeoCoordinatesField, RendererProps } from '../../../block';
import styles from './index.css';

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default function GeoCoordinatesRenderer({
  className,
  data,
  field,
  theme,
}: RendererProps<GeoCoordinatesField>): VNode {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.name, data);
  const lat = field.latitude ? utils.remap(field.latitude, value ?? data) : value.lat;
  const lng = field.longitude ? utils.remap(field.longitude, value ?? data) : value.lng;

  return (
    <div className={`${styles.root} ${className}`}>
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
