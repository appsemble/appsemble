import { normalize, type MessageGetter, type PageDefinition } from '@appsemble/lang-sdk';

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
