import {
  getPageAncestors,
  getPageDisplayName,
  getPageMessageId,
  getPagePathSegment,
  normalize,
  type PageDefinition,
  type Remapper,
  type SubPageDefinition,
} from '@appsemble/lang-sdk';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { checkPagePermissions } from '../../utils/authorization.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

interface BreadcrumbsProps {
  /**
   * The data of the page the breadcrumbs are rendered on.
   */
  readonly data: unknown;

  /**
   * The page the breadcrumbs are rendered on.
   */
  readonly pageDefinition: PageDefinition;

  /**
   * Remap a remapper against the page context.
   */
  readonly remap: (remapper: Remapper, input: unknown) => unknown;
}

/**
 * The breadcrumb trail of the current page, built from the `parent` of each page.
 */
export function Breadcrumbs({ data, pageDefinition, remap }: BreadcrumbsProps): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const { formatMessage } = useIntl();
  const { lang, '*': wildcard = '' } = useParams<{ lang: string; '*': string }>();

  const ancestors = getPageAncestors(definition.pages, pageDefinition, appMemberRoles).filter(
    (page) => checkPagePermissions(page, definition, appMemberRoles, appMemberSelectedGroup),
  );

  if (!definition.layout?.breadcrumbs) {
    return null;
  }

  // A page the member is not on has no data of its own, so its `navTitle` is remapped without one.
  const getLabel = (page: PageDefinition, input: unknown): string =>
    (page.navTitle ? (remap(page.navTitle, input) as string) : '') ||
    getPageDisplayName(page, getAppMessage);

  // A tab is named by a remapper and addressed by its translated name, the same way `TabsPage`
  // builds its routes.
  const getTabName = (tab: SubPageDefinition, index: number): string =>
    getAppMessage({
      id: `${getPageMessageId(pageDefinition.name)}.tabs.${index}`,
      defaultMessage: typeof tab.name === 'string' ? tab.name : String(remap(tab.name, data)),
    }).format() as string;

  // Only tabs put a sub-page in the URL, so it is the one nesting level the trail can read back.
  const activeTabName =
    pageDefinition.type === 'tabs'
      ? pageDefinition.tabs
          ?.map(getTabName)
          .find((name) => normalize(name) === wildcard.split('/')[0])
      : undefined;

  const trail = [...ancestors, pageDefinition];
  const currentLabel = activeTabName ?? getLabel(trail.pop()!, data);

  return (
    <nav aria-label={formatMessage(messages.breadcrumbs)} className="breadcrumb">
      <ul>
        {trail.map((page) => (
          <li key={page.name}>
            {/* A container has no page of its own; its URL only redirects to its first sub-page. */}
            {page.type === 'container' ? (
              <span>{getLabel(page, null)}</span>
            ) : (
              <Link to={`/${lang}/${getPagePathSegment(page)}`}>{getLabel(page, null)}</Link>
            )}
          </li>
        ))}
        <li aria-current="page" className="is-active">
          <span>{currentLabel}</span>
        </li>
      </ul>
    </nav>
  );
}
