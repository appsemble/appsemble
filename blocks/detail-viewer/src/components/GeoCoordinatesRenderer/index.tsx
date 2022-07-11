import { useBlock } from '@appsemble/preact';
import { isPreactChild, Location } from '@appsemble/preact-components';
import { DivIcon, Icon } from 'leaflet';
import { VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { GeoCoordinatesField, RendererProps } from '../../../block';
import { createIcon } from '../utils/createIcon';
import './index.css';
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
  const value = utils.remap(field.value, data) as { lat: number; lng: number } | null;
  const lat = field.latitude ? (utils.remap(field.latitude, value ?? data) as number) : value.lat;
  const lng = field.longitude ? (utils.remap(field.longitude, value ?? data) as number) : value.lng;
  const [marker, setMarker] = useState<DivIcon | Icon>(null);

  useEffect(() => {
    createIcon(block).then(setMarker);
  }, [block]);

  return (
    <div className={`appsemble-geocoordinates ${styles.root}`}>
      {isPreactChild(label) ? <h1 className="label">{label}</h1> : null}

      {marker ? (
        <Location
          className={styles.map}
          latitude={lat}
          longitude={lng}
          marker={marker}
          theme={theme}
        />
      ) : null}
    </div>
  );
}
