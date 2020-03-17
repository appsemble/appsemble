import { BootstrapParams } from '@appsemble/sdk';
import { BaseIconOptions, DivIcon, Icon } from 'leaflet';

import styles from './createMarker.css';

/**
 * A set of Font Awesome markers known to represent a pin.
 *
 * These icons get special treatment when for their positioning.
 */
const KNOWN_MARKER_ICONS = new Set(['map-marker', 'map-marker-alt', 'map-pin', 'thumbtack']);

/**
 * Create an SVG marker based on the coordinates from https://fontawesome.com/icons/map-marker-alt
 *
 * @param parameters Parameters defined by the app creator.
 */
export default function createIcon({
  parameters: { icons = {} },
  theme,
  utils,
}: BootstrapParams): Icon<BaseIconOptions> {
  const { anchor } = icons;
  if ('asset' in icons) {
    return new Icon({
      iconUrl: utils.asset(icons.asset),
      iconAnchor: anchor,
    });
  }
  const { icon = 'map-marker-alt', size = 28 } = icons;
  const html = document.createElement('i');
  html.className = `fas fa-${icon}`;
  html.style.fontSize = `${size}px`;
  html.style.color = theme.primaryColor;
  return new DivIcon({
    className: styles.fontawesomeMarker,
    html,
    iconAnchor: anchor || [size / 2, KNOWN_MARKER_ICONS.has(icon) ? size : size / 2],
    iconSize: [size, size],
  });
}
