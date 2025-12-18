import { type DeviceGridLayoutDefinition, type PageLayoutDefinition } from '@appsemble/lang-sdk';
import { useEffect, useRef } from 'react';

type DeviceName = 'desktop' | 'mobile' | 'tablet';

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
    for (const [bpName, bpDef] of Object.entries(pageLayout) as [
      DeviceName,
      DeviceGridLayoutDefinition,
    ][]) {
      const minWidth = BREAKPOINTS![bpName];
      if (minWidth == null) {
        continue;
      }
      const {
        spacing: { gap, unit, padding },
        layout: { columns, template },
      } = bpDef as DeviceGridLayoutDefinition;
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
  }, [pageLayout, BREAKPOINTS]);
}
