import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useMenu } from '../MenuProvider';
import styles from './index.css';
import { messages } from './messages';

/**
 * A toolbar button which can be used to open the side menu.
 */
export function SideMenuButton(): ReactElement {
  const { definition } = useAppDefinition();
  const location = useLocation();
  const { formatMessage } = useIntl();
  const { enable: openMenu, enabled: isOpen } = useMenu();

  if (!definition) {
    return null;
  }

  const currentPage = definition.pages.find(
    (p) => normalize(p.name) === location.pathname.split('/')[1],
  );

  const navigation = currentPage?.navigation || definition?.layout?.navigation || 'left-menu';
  if (navigation !== 'left-menu') {
    return null;
  }

  return (
    <button
      aria-label={formatMessage(messages.label)}
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
