import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class WebLink extends React.Component {
  static propTypes = {
    classes: PropTypes.shape().isRequired,
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    className: null,
    component: 'a',
  };

  render() {
    const {
      classes,
      className,
      component: Component,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(classes.root, className)}
        {...props}
      />
    );
  }
}
