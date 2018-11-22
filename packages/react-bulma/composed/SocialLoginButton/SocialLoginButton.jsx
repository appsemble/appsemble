import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { Fab } from '../../index';

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
    const { className, providerUri, iconClass, children, props } = this.props;

    return (
      <a className={classNames('button', className)} href={providerUri} {...props}>
        <span className="icon">
          <Fab fa={iconClass} />
        </span>
        <span>{children}</span>
      </a>
    );
  }
}
