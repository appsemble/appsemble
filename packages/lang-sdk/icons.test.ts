import { describe, expect, it } from 'vitest';

import {
  isCustomIconReference,
  isValidIconName,
  isValidIconReference,
  parseIconReference,
  resolveIconReference,
} from './icons.js';

describe('isValidIconName', () => {
  it.each(['dossier', 'dossier-icon', 'a1', '0', 'a-b-c'])('should accept %j', (name) => {
    expect(isValidIconName(name)).toBe(true);
  });

  it.each([
    '',
    'Dossier',
    'dossier_icon',
    '-dossier',
    'dossier-',
    'dossier--icon',
    'dossier icon',
    'dossier/icon',
    'dossier.svg',
    'https://example.com/icon.svg',
    'icon:dossier',
    42,
    null,
    undefined,
  ])('should reject %j', (name) => {
    expect(isValidIconName(name)).toBe(false);
  });
});

describe('parseIconReference', () => {
  it('should treat bare names as Font Awesome names', () => {
    expect(parseIconReference('home')).toStrictEqual({ type: 'fontawesome', name: 'home' });
  });

  it('should not check bare names against the Font Awesome icon set', () => {
    expect(parseIconReference('not-a-real-icon')).toStrictEqual({
      type: 'fontawesome',
      name: 'not-a-real-icon',
    });
  });

  it('should parse custom icon references', () => {
    expect(parseIconReference('icon:dossier')).toStrictEqual({ type: 'custom', key: 'dossier' });
  });

  it('should reject non-string values', () => {
    expect(parseIconReference(42)).toStrictEqual({ type: 'invalid', reason: 'must be a string' });
  });

  it('should reject empty strings', () => {
    expect(parseIconReference('')).toStrictEqual({ type: 'invalid', reason: 'must not be empty' });
  });

  it('should reject invalid custom icon keys', () => {
    expect(parseIconReference('icon:')).toMatchObject({ type: 'invalid' });
    expect(parseIconReference('icon:Dossier')).toMatchObject({ type: 'invalid' });
    expect(parseIconReference('icon:dossier icon')).toMatchObject({ type: 'invalid' });
    expect(parseIconReference('icon:icon:dossier')).toMatchObject({ type: 'invalid' });
  });

  it('should reject other prefixes', () => {
    expect(parseIconReference('asset:dossier')).toStrictEqual({
      type: 'invalid',
      reason: 'uses the unsupported prefix “asset:”; only “icon:” is supported',
    });
    expect(parseIconReference('fas:home')).toMatchObject({ type: 'invalid' });
  });
});

describe('isValidIconReference', () => {
  it.each(['home', 'circle-check', 'icon:dossier'])('should accept %j', (reference) => {
    expect(isValidIconReference(reference)).toBe(true);
  });

  it.each(['', 'icon:', 'icon:Dossier', 'asset:dossier', 'fa:home', null, 1])(
    'should reject %j',
    (reference) => {
      expect(isValidIconReference(reference)).toBe(false);
    },
  );
});

describe('isCustomIconReference', () => {
  it('should detect the icon prefix', () => {
    expect(isCustomIconReference('icon:dossier')).toBe(true);
    expect(isCustomIconReference('icon:')).toBe(true);
    expect(isCustomIconReference('home')).toBe(false);
    expect(isCustomIconReference(null)).toBe(false);
  });
});

describe('resolveIconReference', () => {
  const registry = { dossier: { asset: 'dossier-icon' }, shared: { asset: 'dossier-icon' } };

  it('should pass Font Awesome names through', () => {
    expect(resolveIconReference('home', registry)).toStrictEqual({
      type: 'fontawesome',
      name: 'home',
    });
  });

  it('should pass Font Awesome names through without a registry', () => {
    expect(resolveIconReference('home')).toStrictEqual({ type: 'fontawesome', name: 'home' });
  });

  it('should resolve registry keys to asset names', () => {
    expect(resolveIconReference('icon:dossier', registry)).toStrictEqual({
      type: 'asset',
      key: 'dossier',
      asset: 'dossier-icon',
    });
  });

  it('should allow several keys to share an asset', () => {
    expect(resolveIconReference('icon:shared', registry)).toStrictEqual({
      type: 'asset',
      key: 'shared',
      asset: 'dossier-icon',
    });
  });

  it('should not fall back to Font Awesome for unknown keys', () => {
    expect(resolveIconReference('icon:home', registry)).toStrictEqual({
      type: 'invalid',
      reason: 'references the unknown icon key “home”',
    });
  });

  it('should report unknown keys without a registry', () => {
    expect(resolveIconReference('icon:dossier')).toMatchObject({ type: 'invalid' });
    expect(resolveIconReference('icon:dossier', null)).toMatchObject({ type: 'invalid' });
    expect(resolveIconReference('icon:dossier', {})).toMatchObject({ type: 'invalid' });
  });

  it('should only count own registry properties', () => {
    expect(resolveIconReference('icon:constructor', registry)).toMatchObject({ type: 'invalid' });
    expect(resolveIconReference('icon:tostring', registry)).toMatchObject({ type: 'invalid' });
  });

  it('should reject entries with invalid asset names', () => {
    expect(
      resolveIconReference('icon:dossier', { dossier: { asset: 'https://example.com/a.svg' } }),
    ).toStrictEqual({
      type: 'invalid',
      reason: 'references the icon key “dossier”, which has an invalid asset name',
    });
    expect(
      resolveIconReference('icon:dossier', { dossier: { asset: 'icon:shared' } }),
    ).toMatchObject({ type: 'invalid' });
    expect(resolveIconReference('icon:dossier', { dossier: 'dossier-icon' as any })).toMatchObject({
      type: 'invalid',
    });
    expect(resolveIconReference('icon:dossier', { dossier: null as any })).toMatchObject({
      type: 'invalid',
    });
  });

  it('should reject invalid references', () => {
    expect(resolveIconReference('asset:dossier', registry)).toMatchObject({ type: 'invalid' });
    expect(resolveIconReference('', registry)).toMatchObject({ type: 'invalid' });
  });
});
