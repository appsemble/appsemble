import {
  findPageById,
  getPageAncestors,
  normalize,
  type PageDefinition,
} from '@appsemble/lang-sdk';
import { useMemo } from 'react';
import { useMatch } from 'react-router-dom';

import { shouldShowPage } from './layout.js';
import { useAppDefinition } from '../components/AppDefinitionProvider/index.js';
import { useAppMember } from '../components/AppMemberProvider/index.js';
import { useAppMessages } from '../components/AppMessagesProvider/index.js';

/**
 * Select the current page or its nearest visible ancestor in the rendered navigation.
 *
 * @param pages The top-level pages rendered by the navigation.
 * @param nested Whether the navigation renders children in containing sections.
 * @returns The aria-current value for each navigation item.
 */
export function useActiveNavigation(
  pages: PageDefinition[],
  nested: boolean,
): (page: PageDefinition) => 'page' | 'location' | false {
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const { appMessageIds, getAppMessage } = useAppMessages();
  const pageId = useMatch('/:lang/:pageId/*')?.params.pageId;

  return useMemo(() => {
    const currentPage = pageId
      ? findPageById(definition.pages, normalize(pageId), appMessageIds, getAppMessage)
      : null;
    const containers = new Map<PageDefinition, PageDefinition[]>();
    const visiblePages = new Set<PageDefinition>();

    const collect = (items: PageDefinition[], parents: PageDefinition[]): void => {
      for (const page of items) {
        if (!shouldShowPage(definition, page, appMemberRoles, appMemberSelectedGroup)) {
          continue;
        }
        visiblePages.add(page);
        containers.set(page, parents);
        if (nested && page.type === 'container') {
          collect(page.pages, [...parents, page]);
        }
      }
    };
    collect(pages, []);

    const selected = currentPage
      ? [
          currentPage,
          ...getPageAncestors(definition.pages, currentPage, appMemberRoles).reverse(),
        ].find((page) => visiblePages.has(page))
      : undefined;

    return (page: PageDefinition) => {
      if (page === selected) {
        return page === currentPage ? 'page' : 'location';
      }
      return Boolean(selected && containers.get(selected)?.includes(page)) && 'location';
    };
  }, [
    pageId,
    definition,
    appMemberRoles,
    appMemberSelectedGroup,
    appMessageIds,
    getAppMessage,
    nested,
    pages,
  ]);
}
