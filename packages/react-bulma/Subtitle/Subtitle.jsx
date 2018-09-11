import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class Subtitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    is: PropTypes.number.isRequired,
  };

  static defaultProps = {
    className: null,
  };

  render() {
    const {
      className,
      is,
      ...props
    } = this.props;

    const Component = `h${is}`;
    const classIs = `is-${is}`;

    return <Component className={classNames('subtitle', classIs, className)} {...props} />;
  }
}
