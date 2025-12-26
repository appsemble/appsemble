import { type PageLayoutDefinition } from '@appsemble/lang-sdk';
import { useEffect, useRef } from 'react';

type DeviceName = 'desktop' | 'mobile' | 'tablet';

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

export default function usePageGridCss({
  pageLayout,
  BREAKPOINTS,
}: {
  pageLayout?: PageLayoutDefinition;
  BREAKPOINTS?: Record<DeviceName, number>;
}): void {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!styleRef.current) {
      const s = document.createElement('style');
      s.dataset.pageGridCss = 'true';
      document.head.append(s);
      styleRef.current = s;
    }
    const styleEl = styleRef.current!;
    if (!pageLayout) {
      styleEl.textContent = '';
      return;
    }

    let css = '';
    let lastDefinedLayout = DEFAULT_LAYOUT;
    let lastDefinedSpacing = DEFAULT_SPACING;

    for (const bpName of DEVICE_ORDER) {
      const minWidth = BREAKPOINTS![bpName];
      if (minWidth == null) {
        continue;
      }

      const bpDef = pageLayout[bpName];

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
  .page-grid {
    padding: calc(${padding} * ${unit});
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
    grid-template-areas: ${templateString};
    gap: calc(${gap} * ${unit});
  }
}
`;
    }

    styleEl.textContent = css;

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [pageLayout, BREAKPOINTS]);
}
