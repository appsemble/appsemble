import { useBlock } from '@appsemble/preact';
import { isPreactChild, Location } from '@appsemble/preact-components';
import { type DivIcon, type Icon } from 'leaflet';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import './index.css';
import styles from './index.module.css';
import { type GeoCoordinatesField, type RendererProps } from '../../../block.js';
import { createIcon } from '../utils/createIcon.js';

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
  const hide = utils.remap(field.hide, data);
  const lat = field.latitude ? (utils.remap(field.latitude, value ?? data) as number) : value.lat;
  const lng = field.longitude ? (utils.remap(field.longitude, value ?? data) as number) : value.lng;
  const [marker, setMarker] = useState<DivIcon | Icon>(null);

  useEffect(() => {
    createIcon(block).then(setMarker);
  }, [block]);

  return hide ? null : (
    <div className={`appsemble-geocoordinates ${styles.root}`}>
      {isPreactChild(label) ? <h1 className="label">{label}</h1> : null}

      {marker ? (
        <Location
          className={styles.map}
          latitude={lat}
          longitude={lng}
          marker={marker}
          radius={10}
          theme={theme}
        />
      ) : null}
    </div>
  );
}
