import { ListItem, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';

import styles from './NavListItem.css';

/**
 * Display a router link wrapped in a material-ui list item.
 *
 * The component is styled in such a way that it looks like a normal list item, with the addition
 * that it is highlighted if the current location matches the link.
 */
class NavListItem extends React.Component {
  static propTypes = {
    classes: PropTypes.shape().isRequired,
    children: PropTypes.node.isRequired,
    /**
     * The location to refer to.
     */
    to: PropTypes.string.isRequired,
  };

  render() {
    const { classes, children, to } = this.props;

    return (
      <ListItem className={styles.root} button tabIndex={null} component="li">
        <NavLink
          className={`${classes.anchor} ${styles.anchor}`}
          activeClassName={classes.active}
          to={to}
        >
          {children}
        </NavLink>
      </ListItem>
    );
  }
}

export default withStyles(({ palette }) => ({
  active: {
    backgroundColor: palette.divider,
  },
  anchor: {
    color: palette.text.primary,
  },
}))(NavListItem);
