import { App } from '@appsemble/types';
import classNames from 'classnames';
import React from 'react';
import { WrappedComponentProps } from 'react-intl';

import messages from './messages';
import styles from './SideMenuButton.css';

export interface SideMenuButtonProps {
  app: App;
  isOpen: boolean;
  openMenu: () => void;
}

/**
 * A toolbar button which can be used to open the side menu.
 */
export default class SideMenuButton extends React.Component<
  SideMenuButtonProps & WrappedComponentProps
> {
  render(): React.ReactNode {
    const { app, intl, isOpen, openMenu } = this.props;

    if (!app || app.navigation) {
      return null;
    }

    return (
      <button
        aria-label={intl.formatMessage(messages.label)}
        className={classNames('navbar-burger', { 'is-active': isOpen }, styles.root)}
        onClick={openMenu}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    );
  }
}
