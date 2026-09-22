import { type IconReference, type IconRegistry, resolveIconReference } from '@appsemble/lang-sdk';
import { type IconRenderOptions, type RenderableIcon } from '@appsemble/sdk';
import { type BulmaSize } from '@appsemble/types';

import { fa } from './fa.js';

/**
 * The Font Awesome size modifiers supported by the icon components.
 */
export type IconSizeModifier = NonNullable<IconRenderOptions['iconSize']>;

const sizeModifierMap: Partial<Record<BulmaSize, IconSizeModifier>> = {
  medium: 'lg',
  large: '2x',
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
 * Build the URL of an icon asset.
 *
 * @param apiUrl The base URL of the Appsemble API.
 * @param appId The ID of the app owning the asset.
 * @param asset The validated name of the asset.
 * @returns The URL the asset is served from.
 */
export function getIconAssetUrl(apiUrl: string, appId: number, asset: string): string {
  return `${apiUrl}/api/apps/${appId}/assets/${encodeURIComponent(asset)}`;
}

/**
 * Resolve an icon reference into a Font Awesome name or an asset URL.
 *
 * Invalid references, including registry keys which are missing from the registry, never produce
 * a URL.
 *
 * @param reference The icon reference to resolve.
 * @param registry The icon registry of the app owning the reference.
 * @param getAssetUrl A function to build the URL of an asset by name.
 * @returns The renderable icon.
 */
export function resolveIcon(
  reference: IconReference | string,
  registry?: IconRegistry,
  getAssetUrl?: (asset: string) => string,
): RenderableIcon {
  const resolved = resolveIconReference(reference, registry);
  if (resolved.type === 'fontawesome') {
    return resolved;
  }
  if (resolved.type === 'asset' && getAssetUrl) {
    return { type: 'asset', url: getAssetUrl(resolved.asset) };
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
 * image is hidden, leaving the wrapper in place.
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
    const img = document.createElement('img');
    img.alt = '';
    applyIconImageStyle(img);
    img.addEventListener('error', () => {
      img.hidden = true;
    });
    img.src = icon.url;
    wrapper.append(img);
  }
  return wrapper;
}
