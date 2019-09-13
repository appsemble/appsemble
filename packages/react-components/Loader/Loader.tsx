import classNames from 'classnames';
import * as React from 'react';

import styles from './Loader.css';

export interface LoaderProps {
  className?: string;
  component?: React.ElementType;
}

export default class Loader extends React.Component<LoaderProps> {
  static defaultProps: LoaderProps = {
    className: null,
    component: 'div',
  };

  render(): React.ReactNode {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames(styles.loader, className)} {...props} />;
  }
}
