import {
  type DeviceGridLayoutDefinition,
  type GridLayoutDefinition,
  type PageDefinition,
  type PageLayoutDefinition,
  type ResponsiveGridLayoutDefinition,
} from './types/index.js';

/**
 * The template area a page grid layout uses to place the breadcrumb trail.
 */
export const breadcrumbsGridArea = 'breadcrumbs';

/**
 * The devices a responsive grid layout is defined for, from the smallest breakpoint up.
 */
export const gridDeviceOrder = ['mobile', 'tablet', 'desktop'] as const;

/**
 * One of the devices a responsive grid layout is defined for.
 */
export type GridDeviceName = (typeof gridDeviceOrder)[number];

/**
 * The grid a device falls back to when neither it nor a smaller device defines one.
 */
export const defaultGridLayout: Readonly<GridLayoutDefinition> = {
  columns: 1,
  template: ['main'],
};

function getTemplateAreas(template: string[]): Set<string> {
  const areas = new Set<string>();
  for (const row of template) {
    for (const area of row.split(' ')) {
      if (area && area !== '.') {
        areas.add(area);
      }
    }
  }
  return areas;
}

/**
 * Collect the template areas a responsive grid layout defines.
 *
 * @param layoutDefinition The responsive grid layout to read.
 * @returns Every area named by the template of any device layout, without the `.` placeholder.
 */
export function getGridTemplateAreas(
  layoutDefinition: ResponsiveGridLayoutDefinition | undefined,
): Set<string> {
  const areas = new Set<string>();
  if (!layoutDefinition) {
    return areas;
  }
  for (const deviceDefinition of Object.values(layoutDefinition) as DeviceGridLayoutDefinition[]) {
    for (const area of getTemplateAreas(deviceDefinition?.layout?.template ?? [])) {
      areas.add(area);
    }
  }
  return areas;
}

/**
 * Collect the grid layouts of a page, in definition order.
 *
 * A page type that splits its content over sub pages defines a grid per sub page, so a tab, a step
 * or a loop sub page each carry their own. A basic page has a single grid, and a container page has
 * none of its own.
 *
 * @param page The page to read the grid layouts of.
 * @returns The layout of every sub page the page renders, which is undefined where none is defined.
 */
export function getPageGridLayouts(page: PageDefinition): (PageLayoutDefinition | undefined)[] {
  switch (page.type) {
    case 'container':
      return [];
    case 'flow':
      return page.steps.map((step) => step.layout);
    case 'loop':
      return [page.start, page.foreach, page.end].flatMap((subPage) =>
        subPage ? [subPage.layout] : [],
      );
    case 'tabs':
      return page.tabs
        ? page.tabs.map((tab) => tab.layout)
        : page.definition
          ? [page.definition.foreach.layout]
          : [];
    default:
      return [page.layout];
  }
}

/**
 * Collect the template areas each device renders.
 *
 * A device that defines no template of its own inherits the one of the next smaller device, the way
 * the app applies the grid of a page, down to a fallback of the single `main` area. So the areas a
 * device renders are not the areas its own template names.
 *
 * @param layout The responsive grid layout to read.
 * @returns The areas rendered by each device, keyed by device name.
 */
export function getCascadedGridTemplateAreas(
  layout: ResponsiveGridLayoutDefinition | undefined,
): Record<GridDeviceName, Set<string>> {
  let { template } = defaultGridLayout;
  return Object.fromEntries(
    gridDeviceOrder.map((device) => {
      template = layout?.[device]?.layout?.template ?? template;
      return [device, getTemplateAreas(template)];
    }),
  ) as Record<GridDeviceName, Set<string>>;
}

/**
 * Check whether a grid layout places the breadcrumb trail.
 *
 * Every device has to render the area, since a device that does not would place the trail against
 * implicit grid lines rather than inside the layout.
 *
 * @param layout The responsive grid layout to check.
 * @returns Whether every device renders the breadcrumbs template area.
 */
export function hasBreadcrumbsGridArea(layout: PageLayoutDefinition | undefined): boolean {
  if (!layout) {
    return false;
  }
  return Object.values(getCascadedGridTemplateAreas(layout)).every((areas) =>
    areas.has(breadcrumbsGridArea),
  );
}

/**
 * Check whether a page renders the breadcrumb trail from a grid layout.
 *
 * @param page The page to check the grid layouts of.
 * @returns Whether any grid layout of the page places the breadcrumb trail.
 */
export function pageHasBreadcrumbsGridArea(page: PageDefinition): boolean {
  return getPageGridLayouts(page).some(hasBreadcrumbsGridArea);
}
