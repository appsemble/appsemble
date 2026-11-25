import { type IconRegistry } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import {
  type AssetIcon,
  createIconElement,
  getIconAsset,
  getIconSizeModifier,
  resolveIcon,
} from './icon.js';

const registry: IconRegistry = { logo: { asset: 'company-logo' } };
const getAsset = (asset: string): AssetIcon => ({
  type: 'asset',
  url: `https://example.com/assets/${asset}`,
});

describe('getIconSizeModifier', () => {
  it('should prefer an explicit icon size', () => {
    expect(getIconSizeModifier('large', '3x')).toBe('3x');
  });

  it('should derive the icon size from the wrapper size', () => {
    expect(getIconSizeModifier('medium')).toBe('lg');
    expect(getIconSizeModifier('large')).toBe('2x');
  });

  it('should not derive an icon size for other wrapper sizes', () => {
    expect(getIconSizeModifier('small')).toBeUndefined();
    expect(getIconSizeModifier('normal')).toBeUndefined();
    expect(getIconSizeModifier()).toBeUndefined();
  });
});

describe('getIconAsset', () => {
  it('should address the asset by name', () => {
    expect(getIconAsset('https://example.com', 42, 'company-logo')).toStrictEqual({
      type: 'asset',
      url: 'https://example.com/api/apps/42/assets/company-logo',
    });
  });

  it('should encode the asset name', () => {
    expect(getIconAsset('https://example.com', 42, 'a b/c').url).toBe(
      'https://example.com/api/apps/42/assets/a%20b%2Fc',
    );
  });

  it('should address the asset by id with the name as fallback when its id is known', () => {
    expect(
      getIconAsset('https://example.com', 42, 'company-logo', {
        'company-logo': '0f2793d9-e819-4b5c-9d4e-2a1f0c3b7e61',
      }),
    ).toStrictEqual({
      type: 'asset',
      url: 'https://example.com/api/apps/42/assets/0f2793d9-e819-4b5c-9d4e-2a1f0c3b7e61',
      fallbackUrl: 'https://example.com/api/apps/42/assets/company-logo',
    });
  });

  it('should address the asset by name when its id is unknown', () => {
    expect(getIconAsset('https://example.com', 42, 'company-logo', {})).toStrictEqual({
      type: 'asset',
      url: 'https://example.com/api/apps/42/assets/company-logo',
    });
    expect(getIconAsset('https://example.com', 42, 'constructor', {})).toStrictEqual({
      type: 'asset',
      url: 'https://example.com/api/apps/42/assets/constructor',
    });
  });
});

describe('resolveIcon', () => {
  it('should pass through Font Awesome names', () => {
    expect(resolveIcon('home', registry, getAsset)).toStrictEqual({
      type: 'fontawesome',
      name: 'home',
    });
  });

  it('should resolve registry references to asset URLs', () => {
    expect(resolveIcon('icon:logo', registry, getAsset)).toStrictEqual({
      type: 'asset',
      url: 'https://example.com/assets/company-logo',
    });
  });

  it('should be invalid for unknown keys', () => {
    expect(resolveIcon('icon:missing', registry, getAsset)).toStrictEqual({ type: 'invalid' });
  });

  it('should be invalid without a registry', () => {
    expect(resolveIcon('icon:logo', undefined, getAsset)).toStrictEqual({ type: 'invalid' });
  });

  it('should be invalid without a URL resolver', () => {
    expect(resolveIcon('icon:logo', registry)).toStrictEqual({ type: 'invalid' });
  });

  it('should be invalid for malformed references', () => {
    expect(resolveIcon('icon:Bad Key', registry, getAsset)).toStrictEqual({ type: 'invalid' });
    expect(resolveIcon('', registry, getAsset)).toStrictEqual({ type: 'invalid' });
  });
});

describe('createIconElement', () => {
  it('should render Font Awesome glyphs like before', () => {
    const element = createIconElement({ type: 'fontawesome', name: 'home' });
    expect(element.outerHTML).toBe('<span class="icon"><i class="fas fa-home"></i></span>');
  });

  it('should apply wrapper and glyph sizes', () => {
    const element = createIconElement(
      { type: 'fontawesome', name: 'home' },
      { className: 'foo  bar', size: 'large' },
    );
    expect(element.outerHTML).toBe(
      '<span class="icon is-large foo bar"><i class="fas fa-home fa-2x"></i></span>',
    );
  });

  it('should prefer an explicit icon size', () => {
    const element = createIconElement(
      { type: 'fontawesome', name: 'home' },
      { iconSize: '3x', size: 'medium' },
    );
    expect(element.querySelector('i')?.className).toBe('fas fa-home fa-3x');
  });

  it('should render custom icons as decorative images', () => {
    const element = createIconElement({ type: 'asset', url: 'https://example.com/logo' });
    expect(element.className).toBe('icon');
    const img = element.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('src')).toBe('https://example.com/logo');
    expect(img?.style.width).toBe('100%');
    expect(img?.style.height).toBe('100%');
    expect(img?.style.objectFit).toBe('contain');
  });

  it('should size custom icons by the wrapper', () => {
    const element = createIconElement(
      { type: 'asset', url: 'https://example.com/logo' },
      { iconSize: '3x', size: 'large' },
    );
    expect(element.className).toBe('icon is-large');
    expect(element.querySelector('img')?.style.width).toBe('100%');
  });

  it('should hide failed images but keep the wrapper', () => {
    const element = createIconElement({ type: 'asset', url: 'https://example.com/logo' });
    const img = element.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    expect(img.hidden).toBe(true);
    expect(element.classList.contains('icon')).toBe(true);
  });

  it('should load the fallback URL of a failed image before hiding it', () => {
    const element = createIconElement({
      type: 'asset',
      url: 'https://example.com/assets/0f2793d9',
      fallbackUrl: 'https://example.com/assets/logo',
    });
    const img = element.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe('https://example.com/assets/logo');
    expect(img.hidden).toBe(false);

    img.dispatchEvent(new Event('error'));
    expect(img.hidden).toBe(true);
  });

  it('should render invalid icons as empty boxes', () => {
    const element = createIconElement({ type: 'invalid' }, { size: 'small' });
    expect(element.outerHTML).toBe('<span class="icon is-small"></span>');
  });

  it('should create a fresh element each call', () => {
    const icon = { type: 'fontawesome', name: 'home' } as const;
    expect(createIconElement(icon)).not.toBe(createIconElement(icon));
  });
});
