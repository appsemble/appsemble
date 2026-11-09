import { type IconReference, type IconRegistry, resolveIconReference } from '@appsemble/lang-sdk';
import { type IconRenderOptions, type RenderableIcon } from '@appsemble/sdk';
import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';

import { fa } from './fa.js';

/**
 * The Font Awesome size modifiers supported by the icon components.
 */
export type IconSizeModifier = NonNullable<IconRenderOptions['iconSize']>;

/**
 * A renderable icon showing an app asset.
 */
export type AssetIcon = Extract<RenderableIcon, { type: 'asset' }>;

const sizeModifierMap: Partial<Record<BulmaSize, IconSizeModifier>> = {
  medium: 'lg',
  large: '2x',
};

/**
 * The vertical alignment of a custom icon wrapper per Bulma size.
 *
 * An image has no text baseline, so an inline wrapper would stand on the text baseline with its
 * bottom edge. A Font Awesome glyph is centered in its rem-sized wrapper and its baseline lies
 * 0.375× the glyph size below its center, so the wrapper is lowered by half its height minus that.
 */
const assetVerticalAlignMap: Partial<Record<BulmaSize, string>> = {
  small: 'calc(0.375em - 0.5rem)',
  medium: 'calc(0.469em - 1rem)',
  large: 'calc(0.75em - 1.5rem)',
};

/**
 * Get the icon size modifier to use, deriving it from the wrapper size if it isn’t explicit.
 *
 * @param size The Bulma size of the wrapper.
 * @param iconSize The explicit size modifier.
 * @returns The size modifier to apply, if any.
 */
export function getIconSizeModifier(
  size?: BulmaSize,
  iconSize?: IconSizeModifier,
): IconSizeModifier | undefined {
  return iconSize ?? (size ? sizeModifierMap[size] : undefined);
}

/**
 * The Font Awesome icons that indicate the status of messages and field errors per color.
 *
 * Apps replace these using the `overrides` of their icon registry.
 */
export const messageIcons: Record<'danger' | 'info' | 'success' | 'warning', IconName> = {
  danger: 'circle-xmark',
  info: 'circle-info',
  success: 'circle-check',
  warning: 'triangle-exclamation',
};

/**
 * Get the status icon of a message color.
 *
 * @param color The Bulma color of the message.
 * @returns The icon name, or `undefined` if the color has no status icon.
 */
export function getMessageIcon(color?: BulmaColor): IconName | undefined {
  return color && Object.hasOwn(messageIcons, color)
    ? messageIcons[color as keyof typeof messageIcons]
    : undefined;
}

/**
 * Get an icon asset of an app.
 *
 * The icon is addressed by id when its id is known, because the asset served under an id never
 * changes, so it can be cached for good. The name URL is then its fallback, because the id goes
 * stale when the asset is replaced. Otherwise the icon is addressed by name.
 *
 * @param apiUrl The base URL of the Appsemble API.
 * @param appId The ID of the app owning the asset.
 * @param asset The validated name of the asset.
 * @param assetIds The asset ids of the app’s icon assets, by asset name.
 * @returns The renderable icon of the asset.
 */
export function getIconAsset(
  apiUrl: string,
  appId: number,
  asset: string,
  assetIds?: Record<string, string>,
): AssetIcon {
  const assetsUrl = `${apiUrl}/api/apps/${appId}/assets`;
  const url = `${assetsUrl}/${encodeURIComponent(asset)}`;
  return assetIds && Object.hasOwn(assetIds, asset)
    ? {
        type: 'asset',
        url: `${assetsUrl}/${encodeURIComponent(assetIds[asset])}`,
        fallbackUrl: url,
      }
    : { type: 'asset', url };
}

/**
 * Resolve an icon reference into a Font Awesome name or an asset URL.
 *
 * Invalid references, including registry keys which are missing from the registry, never produce
 * a URL.
 *
 * @param reference The icon reference to resolve.
 * @param registry The icon registry of the app owning the reference.
 * @param getAsset A function to get the renderable icon of an asset by name.
 * @returns The renderable icon.
 */
export function resolveIcon(
  reference: IconReference | string,
  registry?: IconRegistry,
  getAsset?: (asset: string) => AssetIcon,
): RenderableIcon {
  const resolved = resolveIconReference(reference, registry);
  if (resolved.type === 'fontawesome') {
    return resolved;
  }
  if (resolved.type === 'asset' && getAsset) {
    return getAsset(resolved.asset);
  }
  return { type: 'invalid' };
}

/**
 * Apply the styles of a custom icon image to an image element.
 *
 * The image fills its `.icon` wrapper, so the wrapper’s Bulma size determines the rendered size.
 * Inline styles are used so the image renders the same inside block shadow roots.
 *
 * @param img The image element to style.
 */
export function applyIconImageStyle(img: HTMLImageElement): void {
  Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain' });
}

/**
 * Create a DOM element rendering an icon.
 *
 * The result is an `.icon` wrapper containing either a Font Awesome glyph or an image. A failed
 * image loads the fallback URL of the icon, if any, and is hidden when that fails too, leaving the
 * wrapper in place.
 *
 * @param icon The resolved icon to render.
 * @param options Rendering options.
 * @returns A freshly created wrapper element.
 */
export function createIconElement(
  icon: RenderableIcon,
  { className, iconSize: explicitIconSize, size }: IconRenderOptions = {},
): HTMLSpanElement {
  const iconSize = getIconSizeModifier(size, explicitIconSize);
  const wrapper = document.createElement('span');
  wrapper.classList.add('icon');
  if (size) {
    wrapper.classList.add(`is-${size}`);
  }
  if (className) {
    wrapper.classList.add(...className.split(/\s+/).filter(Boolean));
  }
  if (icon.type === 'fontawesome') {
    const glyph = document.createElement('i');
    glyph.className = iconSize ? `${fa(icon.name)} fa-${iconSize}` : fa(icon.name);
    wrapper.append(glyph);
  } else if (icon.type === 'asset') {
    wrapper.style.verticalAlign =
      (size && assetVerticalAlignMap[size]) ?? 'calc(0.375em - 0.75rem)';
    const img = document.createElement('img');
    img.alt = '';
    applyIconImageStyle(img);
    let { fallbackUrl } = icon;
    img.addEventListener('error', () => {
      if (fallbackUrl) {
        img.src = fallbackUrl;
        fallbackUrl = undefined;
      } else {
        img.hidden = true;
      }
    });
    img.src = icon.url;
    wrapper.append(img);
  }
  return wrapper;
}
