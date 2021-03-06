import './index.css';

import { useBlock } from '@appsemble/preact';
import { Location } from '@appsemble/preact-components';
import { DivIcon, Icon } from 'leaflet';
import { VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { GeoCoordinatesField, RendererProps } from '../../../block';
import { createIcon } from '../utils/createIcon';
import styles from './index.module.css';

/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export function GeoCoordinatesRenderer({ data, field }: RendererProps<GeoCoordinatesField>): VNode {
  const block = useBlock();
  const { theme, utils } = block;

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);
  const lat = field.latitude ? utils.remap(field.latitude, value ?? data) : value.lat;
  const lng = field.longitude ? utils.remap(field.longitude, value ?? data) : value.lng;
  const [marker, setMarker] = useState<DivIcon | Icon>(null);

  useEffect(() => {
    createIcon(block).then(setMarker);
  }, [block]);

  return (
    <div className={`appsemble-geocoordinates ${styles.root}`}>
      {label && <h1 className="label">{label}</h1>}

      {marker && (
        <Location
          className={styles.map}
          latitude={lat}
          longitude={lng}
          marker={marker}
          theme={theme}
        />
      )}
    </div>
  );
}
