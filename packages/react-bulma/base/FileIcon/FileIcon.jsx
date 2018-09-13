import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Fas from '../Fas';


export default class FileIcon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    fa: PropTypes.string.isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'span',
  };

  render() {
    const {
      className,
      component: Component,
      fa,
      ...props
    } = this.props;

    return (
      <Component className={classNames('file-icon', className)} {...props}>
        <Fas fa={fa} />
      </Component>
    );
  }
}
