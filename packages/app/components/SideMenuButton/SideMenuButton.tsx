import { AppDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';
import { WrappedComponentProps } from 'react-intl';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import messages from './messages';
import styles from './SideMenuButton.css';

export interface SideMenuButtonProps {
  definition: AppDefinition;
  isOpen: boolean;
  openMenu: () => void;
}

/**
 * A toolbar button which can be used to open the side menu.
 */
export default function SideMenuButton({
  definition,
  intl,
  isOpen,
  openMenu,
}: SideMenuButtonProps & WrappedComponentProps & RouteComponentProps): React.ReactElement {
  const location = useLocation();

  if (!definition) {
    return null;
  }

  const currentPage = definition.pages.find(
    p => normalize(p.name) === location.pathname.split('/')[1],
  );

  const navigation =
    (currentPage && currentPage.navigation) || definition.navigation || 'left-menu';
  if (navigation !== 'left-menu') {
    return null;
  }

  return (
    <button
      aria-label={intl.formatMessage(messages.label)}
      className={classNames('navbar-burger', { 'is-active': isOpen }, styles.root)}
      onClick={openMenu}
      type="button"
    >
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </button>
  );
}
