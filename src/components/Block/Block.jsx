import PropTypes from 'prop-types';
import React from 'react';

import {
  callBootstrap,
} from '../../utils/bootstrapper';
import styles from './Block.css';


/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export default class Block extends React.Component {
  static propTypes = {
    /**
     * The block to render.
     */
    block: PropTypes.shape().isRequired,
    blockDef: PropTypes.shape(),
  };

  static defaultProps = {
    blockDef: null,
  };

  ref = async (div) => {
    const {
      block,
      blockDef,
    } = this.props;

    if (div == null) {
      return;
    }

    if (this.attached) {
      return;
    }

    this.attached = true;
    const shadow = div.attachShadow({ mode: 'closed' });
    blockDef.files
      .filter(url => url.endsWith('.css'))
      .forEach((url) => {
        const link = document.createElement('link');
        link.href = `/blocks/${blockDef.id}/dist/${url}`;
        link.rel = 'stylesheet';
        shadow.appendChild(link);
      });
    await callBootstrap(blockDef, shadow, block);
  };

  render() {
    const {
      blockDef,
    } = this.props;

    if (blockDef == null) {
      return null;
    }

    return (
      <div
        ref={this.ref}
        className={styles.root}
      />
    );
  }
}
