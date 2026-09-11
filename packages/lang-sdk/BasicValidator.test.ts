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

describe('grid spacing unit', () => {
  function createApp(unit: string): unknown {
    return {
      ...baseApp,
      pages: [
        {
          ...baseApp.pages[0],
          layout: {
            mobile: {
              layout: { columns: 1, template: ['main'] },
              spacing: { gap: 0.5, padding: 0.5, unit },
            },
          },
        },
      ],
    };
  }

  it('should accept a custom property', () => {
    expect(layoutErrors(createApp('var(--ribbon-width)'))).toHaveLength(0);
  });

  it.each(['var(--ribbon-width, 40px)', 'calc(1rem + 1px)', 'var(--ribbon-width); color: red'])(
    'should reject unsupported CSS expression %s',
    (unit) => {
      expect(layoutErrors(createApp(unit)).length).toBeGreaterThan(0);
    },
  );
});

describe('loop page boundaries', () => {
  const loopPage = {
    name: 'Page A',
    type: 'loop',
    actions: { onLoad: { type: 'noop' } },
    foreach: { blocks: [{ type: 'test', version: '0.0.0' }] },
  };

  it('accepts start and end sub pages', () => {
    const app = {
      ...baseApp,
      pages: [
        {
          ...loopPage,
          start: { name: 'Introduction', blocks: [{ type: 'test', version: '0.0.0' }] },
          end: { name: 'Complete', blocks: [{ type: 'test', version: '0.0.0' }] },
        },
      ],
    };

    expect(new AppValidator().validateApp(app).errors).toHaveLength(0);
  });
});
