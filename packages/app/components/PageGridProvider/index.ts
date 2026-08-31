import {
  type GridLayoutDefinition,
  type PageLayoutDefinition,
  type ResponsiveGridLayoutDefinition,
} from '@appsemble/lang-sdk';
import { useEffect, useId, useRef } from 'react';

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

const DEFAULT_LAYOUT = {
  columns: 1,
  template: ['main'],
};

const DEVICE_ORDER: DeviceName[] = ['mobile', 'tablet', 'desktop'];

export function useGridCss({
  BREAKPOINTS,
  classNamePrefix,
  defaultLayout = DEFAULT_LAYOUT,
  layout,
  spacingProperty,
}: {
  BREAKPOINTS?: Record<DeviceName, number>;
  classNamePrefix: string;
  defaultLayout?: GridLayoutDefinition;
  layout?: ResponsiveGridLayoutDefinition;
  spacingProperty: `--${string}`;
}): string | undefined {
  const id = useId();
  const className = `${classNamePrefix}${id.replaceAll(':', '-')}`;
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
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
        css += `
@media (min-width: ${minWidth}px) {
  .${className} {
    ${spacingProperty}: ${unit};
    padding: calc(${padding} * var(${spacingProperty}));
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
    grid-template-areas: ${templateString};
    gap: calc(${gap} * var(${spacingProperty}));
  }
}
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
  }, [layout, BREAKPOINTS, className, defaultLayout, spacingProperty]);

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
