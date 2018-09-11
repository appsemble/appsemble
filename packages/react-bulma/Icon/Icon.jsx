import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class Icon extends React.Component {
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
      <Component className={classNames('container', className)} {...props}>
        <i className={`fas fa-${fa}`} />
      </Component>
    );
  }
}
