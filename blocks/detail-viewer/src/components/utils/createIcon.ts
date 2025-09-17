import { type BootstrapParams } from '@appsemble/sdk';
import { DivIcon, Icon } from 'leaflet';

import styles from './createIcon.module.css';

/**
 * A set of Font Awesome markers known to represent a pin.
 *
 * These icons get special treatment when for their positioning.
 */
const KNOWN_MARKER_ICONS = new Set(['map-marker', 'map-marker-alt', 'map-pin', 'thumbtack']);

const sizeMap = new Map<string, Promise<[number, number]>>();

/**
 * Get the natural width and height of an image url as a tuple.
 *
 * The value is memoized.
 *
 * @param url The URL for which to get the image dimensions.
 * @returns The natural width and height as a tuple.
 */
function getIconSize(url: string): Promise<[number, number]> {
  if (!sizeMap.has(url)) {
    sizeMap.set(
      url,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
        image.onerror = reject;
        image.src = url;
      }),
    );
  }
  return sizeMap.get(url)!;
}

/**
 * Create a leaflet icon based on an asset id or a font awesome icon.
 *
 * @param blockParams The block parameters.
 * @returns The leaflet icon.
 */
export async function createIcon({
  parameters: { icons = {} },
  utils,
}: BootstrapParams): Promise<DivIcon | Icon> {
  const { anchor, size = 28 } = icons;
  if ('asset' in icons) {
    const iconUrl = utils.asset(icons.asset);
    const [naturalWidth, naturalHeight] = await getIconSize(iconUrl);
    const width = (size * naturalWidth) / naturalHeight;
    return new Icon({
      iconUrl,
      iconAnchor: anchor || [width / 2, size / 2],
      iconSize: [width, size],
    });
  }

  const { icon = 'map-marker-alt' } = icons;
  const html = document.createElement('i');
  html.className = `${utils.fa(icon)} has-text-${icons.color || 'primary'}`;
  html.style.fontSize = `${size}px`;
  return new DivIcon({
    className: styles.fontawesomeMarker,
    html,
    iconAnchor: anchor || [size / 2, KNOWN_MARKER_ICONS.has(icon) ? size : size / 2],
    iconSize: [size, size],
  });
}
