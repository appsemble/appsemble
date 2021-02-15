import classNames from 'classnames';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';

import { useMenu } from '../MenuProvider';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * A toolbar button which can be used to open the side menu.
 */
export function SideMenuButton(): ReactElement {
  const { formatMessage } = useIntl();
  const { enable: openMenu, enabled: isOpen } = useMenu();

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
