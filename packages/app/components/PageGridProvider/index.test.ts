import { type PageLayoutDefinition } from '@appsemble/lang-sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import usePageGridCss, { useGridCss } from './index.js';

afterEach(() => {
  for (const element of document.head.querySelectorAll('[data-page-grid-css]')) {
    element.remove();
  }
});

describe('usePageGridCss', () => {
  it('should expose the default spacing unit', async () => {
    const { result } = renderHook(() =>
      usePageGridCss({
        BREAKPOINTS: {
          desktop: 1024,
          mobile: 0,
          tablet: 768,
        },
        pageLayout: {
          mobile: {
            layout: {
              columns: 1,
              template: ['main'],
            },
          },
        } as PageLayoutDefinition,
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('--appsemble-page-grid-spacing-unit: 1rem;');
    expect(css).toContain('padding: calc(1 * var(--appsemble-page-grid-spacing-unit));');
    expect(css).toContain('gap: calc(1 * var(--appsemble-page-grid-spacing-unit));');
  });

  it('should expose the resolved spacing unit and use it for grid spacing at every breakpoint', async () => {
    const pageLayout = {
      mobile: {
        spacing: {
          unit: '4px',
        },
      },
      desktop: {
        spacing: {
          unit: '0.5rem',
        },
      },
    } as PageLayoutDefinition;

    const { result } = renderHook(() =>
      usePageGridCss({
        BREAKPOINTS: {
          desktop: 1024,
          mobile: 0,
          tablet: 768,
        },
        pageLayout,
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain(`
@media (min-width: 0px) {
  .${result.current} {
    --appsemble-page-grid-spacing-unit: 4px;
    padding: calc(1 * var(--appsemble-page-grid-spacing-unit));
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    grid-template-areas: "main";
    gap: calc(1 * var(--appsemble-page-grid-spacing-unit));
  }
}`);
    expect(css).toContain(`
@media (min-width: 768px) {
  .${result.current} {
    --appsemble-page-grid-spacing-unit: 4px;
    padding: calc(1 * var(--appsemble-page-grid-spacing-unit));`);
    expect(css).toContain(`
@media (min-width: 1024px) {
  .${result.current} {
    --appsemble-page-grid-spacing-unit: 0.5rem;
    padding: calc(1 * var(--appsemble-page-grid-spacing-unit));`);
  });

  it('should use a custom property as the grid spacing unit', async () => {
    const { result } = renderHook(() =>
      usePageGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        pageLayout: {
          mobile: {
            spacing: { gap: 0.5, padding: 0.5, unit: 'var(--ribbon-width)' },
          },
        } as PageLayoutDefinition,
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('--appsemble-page-grid-spacing-unit: var(--ribbon-width)');
    expect(css).toContain('gap: calc(0.5 * var(--appsemble-page-grid-spacing-unit))');
    expect(css).toContain('padding: calc(0.5 * var(--appsemble-page-grid-spacing-unit))');
  });

  it('should expose a responsive navbar grid', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'navbar-grid',
        layout: {
          mobile: {
            layout: {
              columns: 4,
              template: ['. logo logo .', 'name navigation controls controls'],
            },
            spacing: { gap: 0.5, padding: 0.25, unit: '1rem' },
          },
        },
        spacingProperty: '--appsemble-navbar-grid-spacing-unit',
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('--appsemble-navbar-grid-spacing-unit: 1rem');
    expect(css).toContain(
      'grid-template-areas: ". logo logo ." "name navigation controls controls"',
    );
    expect(css).toContain('gap: calc(0.5 * var(--appsemble-navbar-grid-spacing-unit))');
    expect(css).toContain('padding: calc(0.25 * var(--appsemble-navbar-grid-spacing-unit))');
  });

  it('should expose distinct mobile, tablet and desktop navbar templates', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'navbar-grid',
        layout: {
          desktop: {
            layout: {
              columns: 3,
              template: ['logo logo logo', 'name navigation controls'],
            },
          },
          mobile: {
            layout: {
              columns: 1,
              template: ['logo', 'name', 'navigation', 'controls'],
            },
          },
          tablet: {
            layout: {
              columns: 2,
              template: ['logo logo', 'name controls', 'navigation navigation'],
            },
          },
        },
        spacingProperty: '--appsemble-navbar-grid-spacing-unit',
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain(`@media (min-width: 0px) {`);
    expect(css).toContain('grid-template-areas: "logo" "name" "navigation" "controls"');
    expect(css).toContain(`@media (min-width: 640px) {`);
    expect(css).toContain(
      'grid-template-areas: "logo logo" "name controls" "navigation navigation"',
    );
    expect(css).toContain(`@media (min-width: 1024px) {`);
    expect(css).toContain('grid-template-areas: "logo logo logo" "name navigation controls"');
  });

  it('should use the provided default layout for breakpoints below the smallest defined one', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'navbar-grid',
        layout: {
          desktop: {
            layout: {
              columns: 4,
              template: ['logo name navigation controls'],
            },
            spacing: { gap: 1, padding: 1, unit: '1rem' },
          },
        },
        spacingProperty: '--appsemble-navbar-grid-spacing-unit',
        defaultLayout: {
          columns: 3,
          template: ['name navigation controls'],
        },
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('grid-template-areas: "name navigation controls"');
    expect(css).not.toContain('grid-template-areas: "main"');
    expect(css).toContain('grid-template-areas: "logo name navigation controls"');
  });
});
