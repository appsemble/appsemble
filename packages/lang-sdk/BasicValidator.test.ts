import { describe, expect, it } from 'vitest';

import { AppValidator } from './BasicValidator.js';

function navErrors(definition: unknown): unknown[] {
  return new AppValidator()
    .validateApp(definition)
    .errors.filter((error) => String(error.property).includes('navigation'));
}

function layoutErrors(definition: unknown): unknown[] {
  return new AppValidator()
    .validateApp(definition)
    .errors.filter((error) => String(error.property).includes('layout'));
}

const baseApp = {
  name: 'Test App',
  defaultPage: 'Page A',
  pages: [
    { name: 'Page A', blocks: [{ type: 'test', version: '0.0.0' }] },
    { name: 'Page B', blocks: [{ type: 'test', version: '0.0.0' }] },
  ],
};

describe('navigation enum', () => {
  it('should accept top as an app-level navigation value', () => {
    expect(navErrors({ ...baseApp, layout: { navigation: 'top' } })).toHaveLength(0);
  });

  it('should accept top as a page-level navigation value', () => {
    const app = {
      ...baseApp,
      pages: [{ name: 'Page A', navigation: 'top', blocks: [{ type: 'test', version: '0.0.0' }] }],
    };
    expect(navErrors(app)).toHaveLength(0);
  });

  it('should reject an unknown navigation value', () => {
    expect(navErrors({ ...baseApp, layout: { navigation: 'nonsense' } }).length).toBeGreaterThan(0);
  });
});

describe('stackedHeader flag', () => {
  it('should accept a boolean stackedHeader', () => {
    expect(
      layoutErrors({ ...baseApp, layout: { navigation: 'top', stackedHeader: true } }),
    ).toHaveLength(0);
  });

  it('should reject a non-boolean stackedHeader', () => {
    expect(layoutErrors({ ...baseApp, layout: { stackedHeader: 'yes' } }).length).toBeGreaterThan(
      0,
    );
  });
});
