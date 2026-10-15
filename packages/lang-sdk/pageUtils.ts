import { findPageByName } from './findPageByName.js';
import { normalize } from './normalize.js';
import { type MessageGetter } from './remap.js';
import { type PageDefinition, type PageParentDefinition, type Remapper } from './types/index.js';

type NamedPage = Pick<PageDefinition, 'name'>;

/**
 * The built-in routes whose URL segment an app may translate through a `routes.<Name>` message.
 */
export const translatableRoutes = [
  'Login',
  'Register',
  'Settings',
  'Reset-Password',
  'Edit-Password',
  'Verify',
  'Group-Invite',
  'App-Invite',
  'Feedback',
] as const;

export type TranslatableRoute = (typeof translatableRoutes)[number];

export function getPageMessageId(pageName: string): string {
  return `pages.${normalize(pageName)}`;
}

export function getRouteMessageId(name: TranslatableRoute): string {
  return `routes.${name}`;
}

export function getPageDisplayName(page: NamedPage, getAppMessage: MessageGetter): string {
  return getAppMessage({
    id: getPageMessageId(page.name),
    defaultMessage: page.name,
  }).format() as string;
}

/**
 * Get the URL segment of a page in the current language.
 *
 * @param page The page to get the segment of.
 * @param getAppMessage The app message getter of the current language.
 * @returns The normalized translated page name. It equals the canonical segment
 *   `normalize(page.name)` when the page name is untranslated, or when the translated name has no
 *   Latin letters or digits to build a segment from.
 */
export function getPagePathSegment(page: NamedPage, getAppMessage: MessageGetter): string {
  return normalize(getPageDisplayName(page, getAppMessage)) || normalize(page.name);
}

/**
 * Get the URL segment of a built-in route in the current language.
 *
 * @param name The English name of the built-in route.
 * @param getAppMessage The app message getter of the current language.
 * @returns The `routes.<name>` message as written, falling back to the English name.
 */
export function getRouteSegment(name: TranslatableRoute, getAppMessage: MessageGetter): string {
  return getAppMessage({ id: getRouteMessageId(name), defaultMessage: name }).format() as string;
}

function findPage(
  pages: PageDefinition[],
  matches: (page: PageDefinition) => boolean,
): PageDefinition | null {
  for (const page of pages) {
    if (matches(page)) {
      return page;
    }

    if (page.type === 'container') {
      const foundPage = findPage(page.pages, matches);

      if (foundPage) {
        return foundPage;
      }
    }
  }

  return null;
}

/**
 * Find a page by the `:pageId` URL segment.
 *
 * Translated segments are matched before canonical ones, so a link generated in the current
 * language always resolves to the page it was generated for. The canonical segment is an alias.
 *
 * @param pages The pages of the app, containers included.
 * @param normalizedPageId The normalized `:pageId` URL segment.
 * @param getAppMessage The app message getter of the current language.
 * @returns The matching page, or null if no page has the segment.
 */
export function findPageById(
  pages: PageDefinition[],
  normalizedPageId: string,
  getAppMessage: MessageGetter,
): PageDefinition | null {
  return (
    findPage(pages, (page) => getPagePathSegment(page, getAppMessage) === normalizedPageId) ??
    findPage(pages, (page) => normalize(page.name) === normalizedPageId)
  );
}

/**
 * Resolve which parent page applies to a member.
 *
 * @param parent The `parent` of a page, in any of its accepted forms.
 * @param appMemberRoles The roles held by the app member.
 * @returns The name of the applicable parent page, if any.
 */
function resolveParentName(
  parent: PageParentDefinition | PageParentDefinition[] | undefined,
  appMemberRoles: string[],
): string | undefined {
  for (const entry of ([] as PageParentDefinition[]).concat(parent ?? [])) {
    if (typeof entry === 'string') {
      return entry;
    }

    if (!entry.roles || entry.roles.some((role) => appMemberRoles.includes(role))) {
      return entry.page;
    }
  }
}

/**
 * Collect the pages a page sits under, by following `parent` upwards.
 *
 * @param pages The pages of the app.
 * @param page The page to collect the ancestors of.
 * @param appMemberRoles The roles held by the app member, used to resolve role-scoped parents.
 * @returns The ancestors, root first, excluding the page itself.
 */
export function getPageAncestors(
  pages: PageDefinition[],
  page: PageDefinition,
  appMemberRoles: string[] = [],
): PageDefinition[] {
  const ancestors: PageDefinition[] = [];
  const visited = new Set([page.name]);
  let current = page;

  for (
    let parentName = resolveParentName(current.parent, appMemberRoles);
    parentName;
    parentName = resolveParentName(current.parent, appMemberRoles)
  ) {
    const parent = findPageByName(pages, parentName);

    if (!parent || visited.has(parent.name)) {
      break;
    }

    visited.add(parent.name);
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

/**
 * Check whether or not the given link represents a link related to the Appsemble core.
 *
 * @param link The link to check
 * @returns Whether or not the given link represents a link related to the Appsemble core.
 */
export function isAppLink(link: Remapper | string[] | string): link is `/${TranslatableRoute}` {
  return (
    link === '/Login' || link === '/Settings' || link === '/Register' || link === '/Reset-Password'
  );
}
