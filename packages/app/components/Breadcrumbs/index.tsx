import {
  breadcrumbsGridArea,
  getPageAncestors,
  getPageDisplayName,
  getPagePathSegment,
  type PageDefinition,
  type Remapper,
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
   * Whether the trail is rendered as a child of the grid of the page.
   */
  readonly inGrid?: boolean;

  /**
   * The page the breadcrumbs are rendered on.
   */
  readonly pageDefinition: PageDefinition;

  /**
   * Remap a remapper against the page context.
   */
  readonly remap: (remapper: Remapper, input: unknown) => unknown;

  /**
   * The name of the addressable sub page the page is showing.
   *
   * It takes the last position in the trail, which moves the page itself up into it as a link. The
   * name is passed in by the component that renders the sub pages, because it owns both the data
   * the names are remapped against and the translations the routes are built from.
   */
  readonly subPageName?: string;
}

/**
 * The breadcrumb trail of the current page, built from the `parent` of each page.
 */
export function Breadcrumbs({
  data,
  inGrid,
  pageDefinition,
  remap,
  subPageName,
}: BreadcrumbsProps): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const { formatMessage } = useIntl();
  const { lang } = useParams<{ lang: string }>();

  if (!definition.layout?.breadcrumbs) {
    return null;
  }

  const getLabel = (page: PageDefinition, input: unknown): string =>
    (page.navTitle ? (remap(page.navTitle, input) as string) : '') ||
    getPageDisplayName(page, getAppMessage);

  const ancestors = getPageAncestors(definition.pages, pageDefinition, appMemberRoles).filter(
    (page) => checkPagePermissions(page, definition, appMemberRoles, appMemberSelectedGroup),
  );

  // A page the member is not on has no data of its own, so its `navTitle` is remapped without one.
  const trail: [page: PageDefinition, input: unknown][] = ancestors.map((page) => [page, null]);

  if (subPageName) {
    trail.push([pageDefinition, data]);
  }

  // A single crumb naming the page the member is already on carries no navigation.
  if (!trail.length) {
    return null;
  }

  return (
    <nav
      aria-label={formatMessage(messages.breadcrumbs)}
      className="breadcrumb"
      // eslint-disable-next-line react/forbid-dom-props
      style={inGrid ? { gridArea: breadcrumbsGridArea } : undefined}
    >
      <ul>
        {trail.map(([page, input]) => (
          <li key={page.name}>
            {/* A container has no page of its own; its URL only redirects to its first sub-page. */}
            {page.type === 'container' ? (
              <span>{getLabel(page, input)}</span>
            ) : (
              <Link to={`/${lang}/${getPagePathSegment(page)}`}>{getLabel(page, input)}</Link>
            )}
          </li>
        ))}
        <li aria-current="page" className="is-active">
          <span>{subPageName ?? getLabel(pageDefinition, data)}</span>
        </li>
      </ul>
    </nav>
  );
}
