import { describe, expect, it } from 'vitest';

import {
  getCascadedGridTemplateAreas,
  getGridTemplateAreas,
  getPageGridLayouts,
  hasBreadcrumbsGridArea,
  pageHasBreadcrumbsGridArea,
} from './gridUtils.js';
import {
  type PageDefinition,
  type PageLayoutDefinition,
  type ResponsiveGridLayoutDefinition,
} from './types/index.js';

describe('getGridTemplateAreas', () => {
  it('should collect the areas of every device layout', () => {
    const layout = {
      mobile: { layout: { columns: 1, template: ['breadcrumbs', 'main'] } },
      desktop: { layout: { columns: 2, template: ['main sidebar'] } },
    } as ResponsiveGridLayoutDefinition;

    expect(getGridTemplateAreas(layout)).toStrictEqual(new Set(['breadcrumbs', 'main', 'sidebar']));
  });

  it('should leave out empty cells', () => {
    const layout = {
      desktop: { layout: { columns: 3, template: ['. main .'] } },
    } as ResponsiveGridLayoutDefinition;

    expect(getGridTemplateAreas(layout)).toStrictEqual(new Set(['main']));
  });

  it('should return no areas for a layout that defines none', () => {
    const missingLayout: ResponsiveGridLayoutDefinition | undefined = undefined;

    expect(getGridTemplateAreas(missingLayout)).toStrictEqual(new Set());
    expect(getGridTemplateAreas({ desktop: {} })).toStrictEqual(new Set());
  });
});

describe('getPageGridLayouts', () => {
  const layout = {
    desktop: { layout: { columns: 1, template: ['main'] } },
  } as ResponsiveGridLayoutDefinition;

  it('should return the single grid of a basic page', () => {
    const page = { name: 'Home', blocks: [], layout } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([layout]);
  });

  it('should return a grid per tab', () => {
    const page = {
      name: 'Lot Details',
      type: 'tabs',
      tabs: [
        { name: 'Overview', blocks: [], layout },
        { name: 'Documents', blocks: [] },
      ],
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([layout, undefined]);
  });

  it('should return the grid of the tab template of a generated tabs page', () => {
    const page = {
      name: 'Lot Details',
      type: 'tabs',
      definition: { foreach: { name: 'Tab', blocks: [], layout }, events: {} },
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([layout]);
  });

  it('should return a grid per flow step', () => {
    const page = {
      name: 'Register',
      type: 'flow',
      steps: [
        { name: 'Step A', blocks: [] },
        { name: 'Step B', blocks: [], layout },
      ],
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([undefined, layout]);
  });

  it('should return a grid per loop sub page, including the start', () => {
    const start = {
      mobile: { layout: { columns: 1, template: ['breadcrumbs'] } },
    } as ResponsiveGridLayoutDefinition;
    const page = {
      name: 'Loop',
      type: 'loop',
      start: { name: 'Intro', blocks: [], layout: start },
      foreach: { name: 'Item', blocks: [], layout },
      end: { name: 'Done', blocks: [], layout },
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([start, layout, layout]);
  });

  it('should leave out the sub pages a loop page does not define', () => {
    const page = {
      name: 'Loop',
      type: 'loop',
      foreach: { name: 'Item', blocks: [], layout },
      end: { name: 'Done', blocks: [] },
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([layout, undefined]);
  });

  it('should return no grids for a container page', () => {
    const page = {
      name: 'Container',
      type: 'container',
      pages: [{ name: 'Grouped', blocks: [], layout }],
    } as unknown as PageDefinition;

    expect(getPageGridLayouts(page)).toStrictEqual([]);
  });
});

describe('getCascadedGridTemplateAreas', () => {
  it('should let a device without a template inherit the next smaller one', () => {
    const layout = {
      tablet: { layout: { columns: 2, template: ['main aside'] } },
    } as ResponsiveGridLayoutDefinition;

    expect(getCascadedGridTemplateAreas(layout)).toStrictEqual({
      mobile: new Set(['main']),
      tablet: new Set(['main', 'aside']),
      desktop: new Set(['main', 'aside']),
    });
  });

  it('should keep the inherited template when a device only changes the column count', () => {
    const layout = {
      mobile: { layout: { columns: 1, template: ['breadcrumbs', 'main'] } },
      desktop: { layout: { columns: 2 } },
    } as ResponsiveGridLayoutDefinition;

    expect(getCascadedGridTemplateAreas(layout).desktop).toStrictEqual(
      new Set(['breadcrumbs', 'main']),
    );
  });

  it('should fall back to the single main area below the smallest defined template', () => {
    const missingLayout: ResponsiveGridLayoutDefinition | undefined = undefined;

    expect(getCascadedGridTemplateAreas(missingLayout).mobile).toStrictEqual(new Set(['main']));
  });
});

describe('hasBreadcrumbsGridArea', () => {
  it('should hold when the smallest device defines the area', () => {
    const layout = {
      mobile: { layout: { columns: 1, template: ['breadcrumbs', 'main'] } },
      desktop: { layout: { columns: 2, template: ['breadcrumbs breadcrumbs', 'main aside'] } },
    } as PageLayoutDefinition;

    expect(hasBreadcrumbsGridArea(layout)).toBe(true);
  });

  it('should not hold when a smaller device renders a template without the area', () => {
    const layout = {
      mobile: { layout: { columns: 1, template: ['main'] } },
      desktop: { layout: { columns: 2, template: ['breadcrumbs breadcrumbs', 'main aside'] } },
    } as PageLayoutDefinition;

    expect(hasBreadcrumbsGridArea(layout)).toBe(false);
  });

  it('should not hold for a layout that defines no area at all', () => {
    const missingLayout: PageLayoutDefinition | undefined = undefined;

    expect(hasBreadcrumbsGridArea(missingLayout)).toBe(false);
  });
});

describe('pageHasBreadcrumbsGridArea', () => {
  const layout = {
    mobile: { layout: { columns: 1, template: ['breadcrumbs', 'main'] } },
  } as ResponsiveGridLayoutDefinition;

  it('should hold for a basic page placing the trail', () => {
    const page = { name: 'Home', blocks: [], layout } as unknown as PageDefinition;

    expect(pageHasBreadcrumbsGridArea(page)).toBe(true);
  });

  it('should hold for a tabs page whose tabs place the trail', () => {
    const page = {
      name: 'Lot Details',
      type: 'tabs',
      tabs: [{ name: 'Overview', blocks: [], layout }],
    } as unknown as PageDefinition;

    expect(pageHasBreadcrumbsGridArea(page)).toBe(true);
  });

  it('should not hold for a page whose grid leaves the trail out', () => {
    const page = {
      name: 'Home',
      blocks: [],
      layout: { mobile: { layout: { columns: 1, template: ['main'] } } },
    } as unknown as PageDefinition;

    expect(pageHasBreadcrumbsGridArea(page)).toBe(false);
  });
});
