import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';
import Fas from '../Fas';


export default class Icon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    fa: PropTypes.string.isRequired,
    position: PropTypes.string,
    size: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    component: 'span',
    position: null,
    size: null,
  };

  render() {
    const {
      className,
      component: Component,
      fa,
      position,
      size,
      ...props
    } = this.props;

    return (
      <Component className={classNames('icon', is(position), is(size), className)} {...props}>
        <Fas fa={fa} />
      </Component>
    );
  }
}
