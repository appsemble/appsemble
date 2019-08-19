import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class SocialLoginButton extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    providerUri: PropTypes.string.isRequired,
    iconClass: PropTypes.string.isRequired,
  };

  static defaultProps = {
    className: null,
  };

  render() {
    const { className, providerUri, iconClass, children, ...props } = this.props;

    return (
      <a className={classNames('button', className)} href={providerUri} {...props}>
        <Icon icon={iconClass} prefix="fab" />
        <span>{children}</span>
      </a>
    );
  }
}
