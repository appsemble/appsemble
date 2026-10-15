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
 * Create a leaflet icon from an image.
 *
 * @param iconUrl The URL of the image.
 * @param size The height of the icon in pixels.
 * @param anchor The anchor offset to use instead of the default.
 * @param pin Whether the image represents a pin, which is anchored at its bottom center.
 * @returns The leaflet icon.
 */
async function createImageIcon(
  iconUrl: string,
  size: number,
  anchor: [number, number] | undefined,
  pin: boolean,
): Promise<Icon> {
  const [naturalWidth, naturalHeight] = await getIconSize(iconUrl);
  const width = (size * naturalWidth) / naturalHeight;
  return new Icon({
    iconUrl,
    iconAnchor: anchor || [width / 2, pin ? size : size / 2],
    iconSize: [width, size],
  });
}

/**
 * Create a leaflet icon based on an asset id or a font awesome icon.
 *
 * @param blockParams The block parameters.
 * @param highlight Whether or not the icon should be highlighted/
 * @returns The leaflet icon.
 */
export function createIcon(
  { parameters: { icons = {} }, utils }: BootstrapParams,
  highlight: boolean,
): Promise<DivIcon | Icon> {
  const { activeRatio = 1, anchor, size = 28 } = icons;
  const fullSize = highlight ? size * activeRatio : size;
  if ('asset' in icons) {
    return createImageIcon(utils.asset(icons.asset), fullSize, anchor, false);
  }

  const { icon = 'map-marker-alt' } = icons;
  const resolved = utils.resolveIcon(icon);
  if (resolved.type === 'asset') {
    return createImageIcon(resolved.url, fullSize, anchor, KNOWN_MARKER_ICONS.has(icon));
  }
  const html = document.createElement('i');
  html.className = `${utils.fa(icon)} has-text-${icons.color || 'primary'}`;
  html.style.fontSize = `${size}px`;
  return Promise.resolve(
    new DivIcon({
      className: styles.fontawesomeMarker,
      html,
      iconAnchor: anchor || [fullSize / 2, KNOWN_MARKER_ICONS.has(icon) ? fullSize : fullSize / 2],
      iconSize: [fullSize, fullSize],
    }),
  );
}
