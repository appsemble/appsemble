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
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

import styles from './index.module.css';
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
   * It is used as the page metadata, and as the text of the `title` region if the app defines one.
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
 * Get whether the built-in pages render their name as a heading of their own.
 *
 * @returns Whether the layout of the app names the `title` grid area.
 */
export function useBuiltinPageTitleArea(): boolean {
  return hasBuiltinPagesGridArea(useBuiltinPagesLayout(), builtinPagesTitleGridArea);
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
  state,
  title,
}: BuiltinPageProps): ReactNode {
  const { definition } = useAppDefinition();
  const { hasBottomNavigation } = usePage();
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

  const contentClassName = classNames(className, gridClassName ? undefined : fallbackClassName);
  const content =
    narrow && !gridClassName ? (
      <Content className={contentClassName} data-grid-area={builtinPagesContentGridArea} padding>
        {children}
      </Content>
    ) : (
      <div className={contentClassName} data-grid-area={builtinPagesContentGridArea}>
        {children}
      </div>
    );

  // A grid generates the padding of the root, so it clears the bottom navigation on its own. Without
  // one Main provides the clearance.
  const Root = gridClassName ? 'main' : Main;
  const placesBottomNavigation = hasBuiltinPagesGridArea(layout, bottomNavigationGridArea);

  return (
    <Root
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
    >
      <AppBar>{appBarName}</AppBar>
      {hasBuiltinPagesGridArea(layout, resendBannerGridArea) ? <VerifyBanner inGrid /> : null}
      {hasBuiltinPagesGridArea(layout, builtinPagesTitleGridArea) ? (
        <Title data-grid-area={builtinPagesTitleGridArea} level={1}>
          <FormattedMessage {...title} />
        </Title>
      ) : null}
      {content}
      {placesBottomNavigation ? <BottomNavigation inGrid /> : null}
    </Root>
  );
}
