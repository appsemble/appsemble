import {
  defaultGridLayout,
  type GridBreakpointsDefinition,
  type GridLayoutDefinition,
  type PageLayoutDefinition,
  type ResponsiveGridLayoutDefinition,
} from '@appsemble/lang-sdk';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';

type DeviceName = 'desktop' | 'mobile' | 'tablet';

export const DEFAULT_BREAKPOINTS: Record<DeviceName, number> = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
};

const DEFAULT_SPACING = {
  unit: '1rem',
  gap: 1,
  padding: 1,
};

const DEVICE_ORDER: DeviceName[] = ['mobile', 'tablet', 'desktop'];

/**
 * Resolve the breakpoints of the app to the widths every responsive grid layout breaks at.
 *
 * The grid CSS is injected from a layout effect, so callers pass a stable object rather than
 * rebuilding it on every render.
 *
 * @param breakpoints The breakpoints the app definition defines, if any.
 * @returns The minimum viewport width of each device.
 */
export function useGridBreakpoints(
  breakpoints?: GridBreakpointsDefinition,
): Record<DeviceName, number> {
  return useMemo(() => ({ ...DEFAULT_BREAKPOINTS, ...breakpoints }), [breakpoints]);
}

export function useGridCss({
  BREAKPOINTS,
  classNamePrefix,
  defaultLayout = defaultGridLayout,
  layout,
  spacingProperty,
  stretchArea,
}: {
  BREAKPOINTS?: Record<DeviceName, number>;
  classNamePrefix: string;
  defaultLayout?: GridLayoutDefinition;
  layout?: ResponsiveGridLayoutDefinition;
  spacingProperty: `--${string}`;

  /**
   * The template area whose rows take the height the root has left.
   *
   * Passing it makes the root at least as tall as its parent, sizes every row that does not name
   * the area to its content, and places each area of the template on the `data-grid-area` element
   * that names it. Without it no `grid-area` is mapped, so an element has to be placed by CSS of
   * its own.
   */
  stretchArea?: string;
}): string | undefined {
  const id = useId();
  const className = `${classNamePrefix}${id.replaceAll(':', '-')}`;
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useLayoutEffect(() => {
    if (!styleRef.current) {
      const s = document.createElement('style');
      s.dataset.pageGridCss = className;
      document.head.append(s);
      styleRef.current = s;
    }
    const styleEl = styleRef.current;

    if (layout) {
      let css = '';
      let lastDefinedLayout = defaultLayout;
      let lastDefinedSpacing = DEFAULT_SPACING;

      for (const bpName of DEVICE_ORDER) {
        const minWidth = BREAKPOINTS?.[bpName];
        if (minWidth == null) {
          continue;
        }

        const bpDef = layout[bpName];

        if (bpDef?.layout) {
          lastDefinedLayout = { ...lastDefinedLayout, ...bpDef.layout };
        }
        if (bpDef?.spacing) {
          lastDefinedSpacing = { ...lastDefinedSpacing, ...bpDef.spacing };
        }

        const { gap, unit, padding } = lastDefinedSpacing;
        const { columns, template } = lastDefinedLayout;

        const templateString = template.map((r) => `"${r}"`).join(' ');
        const areas = new Set(
          template.flatMap((row) => row.split(' ')).filter((area) => area && area !== '.'),
        );
        const rows = stretchArea
          ? `
    grid-template-rows: ${template
      .map((row) => (row.split(' ').includes(stretchArea) ? '1fr' : 'auto'))
      .join(' ')};
    min-height: 100%;`
          : '';
        css += `
@media (min-width: ${minWidth}px) {
  .${className} {
    ${spacingProperty}: ${unit};
    padding: calc(${padding} * var(${spacingProperty}));
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
    grid-template-areas: ${templateString};
    gap: calc(${gap} * var(${spacingProperty}));${rows}
  }
${
  stretchArea
    ? [...areas]
        .map(
          (area) => `
  .${className} > [data-grid-area="${area}"] {
    grid-area: ${area};
  }
`,
        )
        .join('')
    : ''
}}
`;
      }

      styleEl.textContent = css;
    } else {
      styleEl.textContent = '';
    }

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [layout, BREAKPOINTS, className, defaultLayout, spacingProperty, stretchArea]);

  return layout ? className : undefined;
}

export default function usePageGridCss({
  pageLayout,
  BREAKPOINTS,
}: {
  pageLayout?: PageLayoutDefinition;
  BREAKPOINTS?: Record<DeviceName, number>;
}): string | undefined {
  return useGridCss({
    BREAKPOINTS,
    classNamePrefix: 'page-grid',
    layout: pageLayout,
    spacingProperty: '--appsemble-page-grid-spacing-unit',
  });
}
