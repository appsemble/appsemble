import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class FileInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
    innerRef: PropTypes.func,
  };

  static defaultProps = {
    className: null,
    component: 'input',
    innerRef: null,
  };

  render() {
    const { className, component: Component, innerRef, ...props } = this.props;

    return (
      <Component
        ref={innerRef}
        className={classNames('file-input', className)}
        type="file"
        {...props}
      />
    );
  }
}
