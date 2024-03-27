import { useBlock } from '@appsemble/preact';
import { FormComponent, Icon, type SharedFormComponentProps } from '@appsemble/preact-components';
import { CircleMarker, type LocationEvent, Map, TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type GeoCoordinatesField, type InputProps } from '../../../block.js';
import { isRequired } from '../../utils/requirements.js';

type GeoCoordinatesInputProps = InputProps<Record<string, number>, GeoCoordinatesField> &
  SharedFormComponentProps;

/**
 * An input element for an object type schema which implements GeoCoordinates.
 */
export function GeoCoordinatesInput({
  disabled,
  field,
  formValues,
  name,
  onChange,
}: GeoCoordinatesInputProps): VNode {
  const { theme, utils } = useBlock();
  const ref = useRef<HTMLDivElement>();
  const [map, setMap] = useState<Map>(null);
  const [locationMarker, setLocationMarker] = useState<CircleMarker>(null);
  const { icon, label, tag } = field;
  const required = isRequired(field, utils, formValues);

  const {
    defaultLocation: [defaultLat = 51.449_107, defaultLng = 5.457_96] = [],
    locationError = 'Couldn’t find your location. Are location services enabled?',
  } = field;

  const onReset = useCallback((): void => {
    if (!map) {
      return;
    }

    map.setView(locationMarker.getLatLng(), 16);
  }, [locationMarker, map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const marker = new CircleMarker(null, {
      color: theme.primaryColor,
    });

    const onLocationFound = ({ latlng }: LocationEvent): void => {
      if (!marker.getLatLng()) {
        map.setView(latlng, 18);
      }
      marker.setLatLng(latlng).addTo(map);
    };

    map.on('locationfound', onLocationFound);

    setLocationMarker(marker);

    return () => map.off('locationfound', onLocationFound);
  }, [theme, map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const onMove = (): void => {
      const { lat, lng } = map.getCenter();
      onChange({ currentTarget: { name } } as unknown as Event, {
        latitude: lat,
        longitude: lng,
      });
    };

    map.on('move', onMove);

    return () => map.off('move', onMove);
  }, [name, map, onChange]);

  useEffect(() => {
    const m = new Map(ref.current, {
      center: [defaultLat, defaultLng],
      attributionControl: false,
      layers: [new TileLayer(theme.tileLayer)],
    })
      .once('locationerror', (error) => {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/PositionError
        if (error?.code === 1) {
          utils.showMessage({ body: utils.remap(locationError, {}) as string });
        }
        // XXX: Handle TIMEOUT. These are thrown in the .locate() call when `watch` is set to true.
      })
      .locate({ watch: true, timeout: 10e3, maximumAge: 60e3 });

    setMap(m);
  }, [defaultLat, defaultLng, locationError, theme, utils]);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (disabled) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [disabled, map]);

  return (
    <FormComponent required={required}>
      <div className={`appsemble-geocoordinates ${styles.root} is-relative mb-5`}>
        {icon ? (
          // Nested divs are required to properly space the content.
          <div class="is-flex is-justify-content-space-between">
            <div class="is-flex">
              <Icon className="is-left" icon={icon} />
              {label ? <label className="label">{utils.remap(label, {}) as string}</label> : null}
            </div>
            {!required || tag ? (
              <span className="is-pulled-right has-text-weight-normal">
                {(utils.remap(tag, {}) as string) || '(Optional)'}
              </span>
            ) : null}
          </div>
        ) : label ? (
          <div class="is-flex is-justify-content-space-between">
            <label className="label">{utils.remap(label, {}) as string}</label>
            {!required || tag ? (
              <span className="is-pulled-right has-text-weight-normal">
                {(utils.remap(tag, {}) as string) || '(Optional)'}
              </span>
            ) : null}
          </div>
        ) : (
          <div class="is-flex is-justify-content-space-between">
            <label className="label">{name}</label>
            {!required || tag ? (
              <span className="is-pulled-right has-text-weight-normal">
                {(utils.remap(tag, {}) as string) || '(Optional)'}
              </span>
            ) : null}
          </div>
        )}

        <div className={styles.map} ref={ref} />
        <div className={styles.crossHairsOverlay}>
          <i className={`fas fa-crosshairs ${styles.crossHairs}`} />
        </div>
        <button
          className={`button ${styles.resetButton}`}
          disabled={disabled}
          onClick={onReset}
          type="button"
        >
          <span className={`icon ${styles.currentlocation}`}>
            <i className="fas fa-crosshairs" />
          </span>
        </button>
      </div>
    </FormComponent>
  );
}
