import {
  bottomNavigationGridArea,
  type BuiltinPagesLayoutDefinition,
  builtinPagesContentGridArea,
  builtinPagesTitleGridArea,
  getBuiltinPagesDefaultGridLayout,
  hasBuiltinPagesGridArea,
  resendBannerGridArea,
} from '@appsemble/lang-sdk';
import { Content, Loader, Title, useMeta } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';

import styles from './index.module.css';
import { titleBarShowsPageName } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { BottomNavigation } from '../BottomNavigation/index.js';
import { Main } from '../Main/index.js';
import { usePage } from '../MenuProvider/index.js';
import { useGridBreakpoints, useGridCss } from '../PageGridProvider/index.js';
import { AppBar } from '../TitleBar/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';

/**
 * The pages Appsemble renders outside of the pages of the app definition.
 */
export type BuiltinPageName =
  | 'app-invite'
  | 'debug'
  | 'edit-password'
  | 'feedback'
  | 'group-invite'
  | 'login'
  | 'openid-callback'
  | 'page-error'
  | 'register'
  | 'reset-password'
  | 'settings'
  | 'verify';

interface BuiltinPageProps {
  /**
   * The name of the built-in page, rendered as `data-appsemble-page`.
   */
  readonly page: BuiltinPageName;

  /**
   * The state the page is in, rendered as `data-appsemble-page-state`.
   */
  readonly state: string;

  /**
   * The title of the page.
   *
   * It is used as the page metadata and the H1 of the page: in the `title` region if the app defines
   * one, else above the content unless the title bar names the page.
   */
  readonly title: MessageDescriptor;

  /**
   * What to render inside the title bar of the app.
   */
  readonly appBarName?: ReactNode;

  /**
   * An additional class name for the content region, in both modes.
   */
  readonly className?: string;

  /**
   * An additional class name for the content region, only if the app defines no layout.
   *
   * It holds the width, padding, and display helpers of the content region.
   */
  readonly fallbackClassName?: string;

  /**
   * An additional class name for the page root, only if the app defines no layout.
   *
   * It holds the layout of the page root.
   */
  readonly fallbackRootClassName?: string;

  /**
   * Whether to cap the width of the content region if the app defines no layout.
   */
  readonly narrow?: boolean;

  /**
   * Whether to show the title above the content if neither the `title` grid area nor the title bar
   * names the page.
   */
  readonly showTitle?: boolean;

  /**
   * The content of the page.
   */
  readonly children: ReactNode;
}

/**
 * Get the grid layout the app defines for its built-in pages.
 *
 * @returns The layout, if the app defines one.
 */
export function useBuiltinPagesLayout(): BuiltinPagesLayoutDefinition | undefined {
  const { definition } = useAppDefinition();
  return definition.layout?.builtinPages;
}

/**
 * A loader for a built-in page that is still resolving its state.
 */
export function BuiltinPageLoader(): ReactNode {
  const layout = useBuiltinPagesLayout();

  return <Loader className={layout ? styles.loader : undefined} />;
}

/**
 * The root of a page Appsemble renders outside of the pages of the app definition.
 *
 * It renders the title bar, the page markers custom CSS can select, and the grid the app defines
 * for its built-in pages, if any.
 */
export function BuiltinPage({
  appBarName,
  children,
  className,
  fallbackClassName,
  fallbackRootClassName,
  narrow,
  page,
  showTitle,
  state,
  title,
}: BuiltinPageProps): ReactNode {
  const { definition } = useAppDefinition();
  const { hasBottomNavigation } = usePage();
  const { formatMessage } = useIntl();
  useMeta(title);

  const layout = definition.layout?.builtinPages;
  const breakpoints = useGridBreakpoints(definition.layout?.breakpoints);
  const defaultLayout = useMemo(() => getBuiltinPagesDefaultGridLayout(layout), [layout]);
  const gridClassName = useGridCss({
    BREAKPOINTS: breakpoints,
    classNamePrefix: 'builtin-page-grid',
    defaultLayout,
    layout,
    spacingProperty: '--appsemble-builtin-page-grid-spacing-unit',
    stretchArea: builtinPagesContentGridArea,
  });

  const hasTitleArea = hasBuiltinPagesGridArea(layout, builtinPagesTitleGridArea);
  const titleBarNamesPage = appBarName && titleBarShowsPageName(definition);
  // The title area or the title bar renders the H1, if either names the page.
  const heading =
    hasTitleArea || titleBarNamesPage ? null : (
      <Title className={showTitle ? undefined : 'is-sr-only'}>
        <FormattedMessage {...title} />
      </Title>
    );

  const contentClassName = classNames(className, gridClassName ? undefined : fallbackClassName);
  const content =
    narrow && !gridClassName ? (
      <Content className={contentClassName} data-grid-area={builtinPagesContentGridArea} padding>
        {heading}
        {children}
      </Content>
    ) : (
      <div className={contentClassName} data-grid-area={builtinPagesContentGridArea}>
        {heading}
        {children}
      </div>
    );

  // A grid generates the padding of the root, so it clears the bottom navigation on its own. Without
  // one Main provides the clearance.
  const Root = gridClassName ? 'main' : Main;
  const placesBottomNavigation = hasBuiltinPagesGridArea(layout, bottomNavigationGridArea);

  return (
    <Root
      aria-label={formatMessage(title)}
      className={
        gridClassName
          ? classNames(gridClassName, {
              // A grid that places the bottom navigation flows around it, so it needs no clearance.
              [styles.gridHasBottomNavigation]: hasBottomNavigation && !placesBottomNavigation,
            })
          : fallbackRootClassName
      }
      data-appsemble-page={page}
      data-appsemble-page-state={state}
      tabIndex={-1}
    >
      <AppBar hasPageHeading={hasTitleArea}>{appBarName}</AppBar>
      {hasBuiltinPagesGridArea(layout, resendBannerGridArea) ? <VerifyBanner inGrid /> : null}
      {hasTitleArea ? (
        <Title data-grid-area={builtinPagesTitleGridArea} level={1}>
          <FormattedMessage {...title} />
        </Title>
      ) : null}
      {content}
      {placesBottomNavigation ? <BottomNavigation inGrid /> : null}
    </Root>
  );
}
