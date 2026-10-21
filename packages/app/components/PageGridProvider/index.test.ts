import { type PageLayoutDefinition } from '@appsemble/lang-sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import usePageGridCss, { useGridBreakpoints, useGridCss } from './index.js';

afterEach(() => {
  for (const element of document.head.querySelectorAll('[data-page-grid-css]')) {
    element.remove();
  }
});

describe('useGridBreakpoints', () => {
  it('should fall back to the default breakpoints', () => {
    const { result } = renderHook(() => useGridBreakpoints({ tablet: 700 }));

    expect(result.current).toStrictEqual({ mobile: 0, tablet: 700, desktop: 1024 });
  });

  // The grid CSS is injected from a layout effect, so an object rebuilt on every render would
  // replace the style element before every paint.
  it('should keep the same object across rerenders', () => {
    const breakpoints = { tablet: 700 };
    const { rerender, result } = renderHook(() => useGridBreakpoints(breakpoints));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
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

  it('should not place any grid area without the stretch area option', async () => {
    const { result } = renderHook(() =>
      usePageGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        pageLayout: {
          mobile: { layout: { columns: 1, template: ['main'] } },
        } as PageLayoutDefinition,
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).not.toContain('data-grid-area');
    expect(css).not.toContain('grid-template-rows');
    expect(css).not.toContain('min-height');
  });

  it('should stretch the rows of the stretch area and place every area it scopes', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'builtin-page-grid',
        layout: {
          mobile: { layout: { columns: 1, template: ['title', 'content'] } },
        },
        spacingProperty: '--appsemble-builtin-page-grid-spacing-unit',
        stretchArea: 'content',
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('grid-template-rows: auto 1fr;');
    expect(css).toContain('min-height: 100%;');
    expect(css).toContain(`.${result.current} > [data-grid-area="title"] {
    grid-area: title;
  }`);
    expect(css).toContain(`.${result.current} > [data-grid-area="content"] {
    grid-area: content;
  }`);
  });

  it('should stretch every row the stretch area spans', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'builtin-page-grid',
        layout: {
          mobile: {
            layout: { columns: 2, template: ['title title', 'content content', 'content content'] },
          },
        },
        spacingProperty: '--appsemble-builtin-page-grid-spacing-unit',
        stretchArea: 'content',
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    expect(css).toContain('grid-template-rows: auto 1fr 1fr;');
  });

  it('should place the areas of the layout a breakpoint inherits', async () => {
    const { result } = renderHook(() =>
      useGridCss({
        BREAKPOINTS: { desktop: 1024, mobile: 0, tablet: 640 },
        classNamePrefix: 'builtin-page-grid',
        defaultLayout: { columns: 1, template: ['title', 'content'] },
        layout: {
          desktop: { layout: { columns: 2, template: ['title content'] } },
        },
        spacingProperty: '--appsemble-builtin-page-grid-spacing-unit',
        stretchArea: 'content',
      }),
    );

    await waitFor(() => {
      expect(document.head.querySelector(`[data-page-grid-css="${result.current}"]`)).toBeTruthy();
    });

    const css = document.head.querySelector<HTMLStyleElement>(
      `[data-page-grid-css="${result.current}"]`,
    )?.textContent;

    const mobileBlock = css?.slice(
      css.indexOf('@media (min-width: 0px)'),
      css.indexOf('@media (min-width: 640px)'),
    );

    expect(mobileBlock).toContain('grid-template-areas: "title" "content";');
    expect(mobileBlock).toContain('grid-template-rows: auto 1fr;');
    expect(mobileBlock).toContain('grid-area: title;');
    expect(mobileBlock).toContain('grid-area: content;');
  });
});
