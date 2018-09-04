import {
  Portal,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import makeActions from '../../utils/makeActions';
import makeResources from '../../utils/makeResources';
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
    app: PropTypes.shape().isRequired,
    /**
     * The block to render.
     */
    block: PropTypes.shape().isRequired,
    blockDef: PropTypes.shape(),
    history: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  static defaultProps = {
    blockDef: null,
  };

  ref = async (div) => {
    const {
      app,
      block,
      blockDef,
      history,
      match,
    } = this.props;

    if (div == null) {
      return;
    }

    if (this.attached) {
      return;
    }

    this.attached = true;
    const shadowRoot = div.attachShadow({ mode: 'closed' });
    const actions = makeActions(blockDef, app, block, history);
    const resources = makeResources(blockDef, block);
    await Promise.all(blockDef.files
      .filter(url => url.endsWith('.css'))
      .map(url => new Promise((resolve) => {
        const link = document.createElement('link');
        // Make sure all CSS is loaded before any JavaScript is executed on the shadow root.
        link.addEventListener('load', resolve, {
          capture: true,
          once: true,
          passive: true,
        });
        link.href = url;
        link.rel = 'stylesheet';
        shadowRoot.appendChild(link);
      })));
    await callBootstrap(blockDef, {
      actions,
      block,
      pageParameters: match.params,
      resources,
      shadowRoot,
    });
  };

  render() {
    const {
      blockDef,
    } = this.props;

    if (blockDef == null) {
      return null;
    }

    if (blockDef.position === 'float') {
      return (
        <Portal>
          <div
            ref={this.ref}
            className={styles.float}
          />
        </Portal>
      );
    }

    return (
      <div
        ref={this.ref}
        className={styles.main}
      />
    );
  }
}
