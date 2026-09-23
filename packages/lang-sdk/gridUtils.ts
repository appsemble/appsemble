import {
  type BuiltinPagesLayoutDefinition,
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
 * The template area a grid layout uses to place the banner that asks to verify the email address.
 */
export const resendBannerGridArea = 'resend-banner';

/**
 * The template area a grid layout uses to place the bottom navigation.
 */
export const bottomNavigationGridArea = 'bottom-navigation';

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

/**
 * The template area a built-in page grid layout uses to place the heading of the page.
 */
export const builtinPagesTitleGridArea = 'title';

/**
 * The template area a built-in page grid layout uses to place the content of the page.
 */
export const builtinPagesContentGridArea = 'content';

/**
 * The template areas a built-in page grid layout may name, in DOM order.
 */
export const builtinPagesGridAreaOrder = [
  resendBannerGridArea,
  builtinPagesTitleGridArea,
  builtinPagesContentGridArea,
  bottomNavigationGridArea,
] as const;

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
 * the app applies the grid of a page, down to the given default layout: `defaultGridLayout` unless
 * the caller passes its own. So the areas a device renders are not the areas its own template names.
 *
 * @param layout The responsive grid layout to read.
 * @param defaultLayout The grid a device falls back to below the smallest defined template.
 * @returns The areas rendered by each device, keyed by device name.
 */
export function getCascadedGridTemplateAreas(
  layout: ResponsiveGridLayoutDefinition | undefined,
  defaultLayout: Readonly<GridLayoutDefinition> = defaultGridLayout,
): Record<GridDeviceName, Set<string>> {
  let { template } = defaultLayout;
  return Object.fromEntries(
    gridDeviceOrder.map((device) => {
      template = layout?.[device]?.layout?.template ?? template;
      return [device, getTemplateAreas(template)];
    }),
  ) as Record<GridDeviceName, Set<string>>;
}

/**
 * Check whether a built-in page grid layout places an area.
 *
 * An optional area is named by the template of every device or by the template of none, so any
 * device that names it opts every breakpoint in.
 *
 * @param layout The built-in page grid layout to check.
 * @param area The template area to look for.
 * @returns Whether the layout names the template area.
 */
export function hasBuiltinPagesGridArea(
  layout: BuiltinPagesLayoutDefinition | undefined,
  area: string,
): boolean {
  return getGridTemplateAreas(layout).has(area);
}

/**
 * Build the grid built-in pages fall back to below the smallest defined template.
 *
 * `defaultGridLayout` names the `main` area, which no built-in page renders. Built-in pages stack
 * the areas their templates name instead, in DOM order, so an app can define the desktop grid alone
 * without an invalid mobile fallback or an accidental heading.
 *
 * @param layout The built-in page grid layout to read the areas of.
 * @returns A single column grid with one row per area the layout names.
 */
export function getBuiltinPagesDefaultGridLayout(
  layout: BuiltinPagesLayoutDefinition | undefined,
): GridLayoutDefinition {
  const areas = getGridTemplateAreas(layout);
  return {
    columns: 1,
    template: builtinPagesGridAreaOrder.filter(
      (area) => area === builtinPagesContentGridArea || areas.has(area),
    ),
  };
}

/**
 * Check whether a grid layout places an area Appsemble renders itself.
 *
 * Every device has to render the area, since a device that does not would place the element against
 * implicit grid lines rather than inside the layout.
 *
 * @param layout The responsive grid layout to check.
 * @param area The template area to look for.
 * @returns Whether every device renders the template area.
 */
export function hasGridArea(layout: PageLayoutDefinition | undefined, area: string): boolean {
  if (!layout) {
    return false;
  }
  return Object.values(getCascadedGridTemplateAreas(layout)).every((areas) => areas.has(area));
}

/**
 * Check whether a page renders an area Appsemble renders itself from a grid layout.
 *
 * @param page The page to check the grid layouts of.
 * @param area The template area to look for.
 * @returns Whether any grid layout of the page places the area.
 */
export function pageHasGridArea(page: PageDefinition, area: string): boolean {
  return getPageGridLayouts(page).some((layout) => hasGridArea(layout, area));
}
