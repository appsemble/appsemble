import { findPageByName } from './findPageByName.js';
import { normalize } from './normalize.js';
import { type MessageGetter } from './remap.js';
import { type PageDefinition, type PageParentDefinition } from './types/index.js';

type NamedPage = Pick<PageDefinition, 'name'>;

export function getPageMessageId(pageName: string): string {
  return `pages.${normalize(pageName)}`;
}

export function getPagePathSegment(page: string | NamedPage): string {
  return normalize(typeof page === 'string' ? page : page.name);
}

export function getPageDisplayName(page: NamedPage, getAppMessage: MessageGetter): string {
  return getAppMessage({
    id: getPageMessageId(page.name),
    defaultMessage: page.name,
  }).format() as string;
}

function matchesPageId(
  page: NamedPage,
  normalizedPageId: string,
  appMessageIds: string[],
  getAppMessage: MessageGetter,
): boolean {
  if (getPagePathSegment(page) === normalizedPageId) {
    return true;
  }

  const pageMessageId = getPageMessageId(page.name);

  if (!appMessageIds.includes(pageMessageId)) {
    return false;
  }

  return normalize(getPageDisplayName(page, getAppMessage)) === normalizedPageId;
}

export function findPageById(
  pages: PageDefinition[],
  normalizedPageId: string,
  appMessageIds: string[],
  getAppMessage: MessageGetter,
): PageDefinition | null {
  for (const page of pages) {
    if (matchesPageId(page, normalizedPageId, appMessageIds, getAppMessage)) {
      return page;
    }

    if (page.type === 'container') {
      const foundPage = findPageById(page.pages, normalizedPageId, appMessageIds, getAppMessage);

      if (foundPage) {
        return foundPage;
      }
    }
  }

  return null;
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
