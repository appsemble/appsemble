import classNames from 'classnames';
import {
  Collapse,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './FormError.css';


/**
 * Show a material design form error.
 */
export default class FormError extends React.Component {
  static propTypes = {
    /**
     * The error message to render. If not defined, the error box will be hidden.
     */
    children: PropTypes.node,
    classes: PropTypes.shape().isRequired,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    const {
      children,
      classes,
    } = this.props;

    return (
      <Collapse in={!!children}>
        <Typography
          className={classNames(classes.root, styles.root)}
        >
          {children}
        </Typography>
      </Collapse>
    );
  }
}
