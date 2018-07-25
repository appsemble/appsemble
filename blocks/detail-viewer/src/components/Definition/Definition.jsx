import {
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './Definition.css';


/**
 * Render a description title and definition for a JSON schema definition.
 *
 * This should be nested in a `<dl />` tag.
 */
export default class Definition extends React.Component {
  static propTypes = {
    /**
     * The element to render to represent the value.
     */
    children: PropTypes.node,
    /**
     * The name to render.
     */
    name: PropTypes.string.isRequired,
    /**
     * The JSON schema for which to render the definition. If the schema has a title, this will take
     * precedence over the name.
     */
    schema: PropTypes.shape().isRequired,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    const {
      children,
      name,
      schema,
    } = this.props;

    return (
      <React.Fragment>
        <Typography component="dt" variant="body2">
          {schema.title || name}
        </Typography>
        <Typography component="dd" className={styles.dd}>
          {children}
        </Typography>
      </React.Fragment>
    );
  }
}
