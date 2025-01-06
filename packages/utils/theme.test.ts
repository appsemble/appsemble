import bulmaPkg from 'bulma/package.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';

import { createThemeURL, mergeThemes } from './theme.js';

describe('mergeThemes', () => {
  it('should use the base theme as default', () => {
    const result = mergeThemes({ primaryColor: '#123456', successColor: '#789abc' });
    expect(result).toStrictEqual({
      dangerColor: '#ff2800',
      font: {
        family: 'Open Sans',
        source: 'google',
      },
      infoColor: '#a7d0ff',
      linkColor: '#0440ad',
      primaryColor: '#123456',
      splashColor: '#ffffff',
      successColor: '#789abc',
      themeColor: '#ffffff',
      tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      warningColor: '#fed719',
    });
  });

  it('should fill in the default font source', () => {
    const result = mergeThemes({ font: { family: 'Lato' } });
    expect(result).toStrictEqual({
      dangerColor: '#ff2800',
      font: {
        family: 'Lato',
        source: 'google',
      },
      infoColor: '#a7d0ff',
      linkColor: '#0440ad',
      primaryColor: '#5393ff',
      splashColor: '#ffffff',
      successColor: '#1fd25b',
      themeColor: '#ffffff',
      tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      warningColor: '#fed719',
    });
  });

  it('should combine multiple themes', () => {
    const result = mergeThemes(
      { primaryColor: '#123456', successColor: '#789abc' },
      { successColor: '#abcdef' },
    );
    expect(result).toStrictEqual({
      dangerColor: '#ff2800',
      font: {
        family: 'Open Sans',
        source: 'google',
      },
      infoColor: '#a7d0ff',
      linkColor: '#0440ad',
      primaryColor: '#123456',
      splashColor: '#ffffff',
      successColor: '#abcdef',
      themeColor: '#ffffff',
      tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      warningColor: '#fed719',
    });
  });
});

describe('createThemeURL', () => {
  it('should create the URL of a theme including correct query parameters and bulma version', () => {
    const result = createThemeURL({
      dangerColor: '#ff2800',
      font: {
        family: 'Open Sans',
        source: 'google',
      },
      infoColor: '#a7d0ff',
      linkColor: '#0440ad',
      primaryColor: '#123456',
      splashColor: '#ffffff',
      successColor: '#abcdef',
      themeColor: '#ffffff',
      tileLayer: 'https://example.com',
      warningColor: '#fed719',
    });
    expect(result).toBe(
      `/bulma/${bulmaPkg.version}/bulma.min.css` +
        '?dangerColor=%23ff2800' +
        '&fontFamily=Open+Sans' +
        '&fontSource=google' +
        '&infoColor=%23a7d0ff' +
        '&linkColor=%230440ad' +
        '&primaryColor=%23123456' +
        '&splashColor=%23ffffff' +
        '&successColor=%23abcdef' +
        '&themeColor=%23ffffff' +
        '&tileLayer=https%3A%2F%2Fexample.com' +
        '&warningColor=%23fed719',
    );
  });
});
