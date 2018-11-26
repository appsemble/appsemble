import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import makeActions from '../../utils/makeActions';
import makeResources from '../../utils/makeResources';
import { prefixURL } from '../../utils/blockUtils';
import { callBootstrap } from '../../utils/bootstrapper';
import styles from './Block.css';

const BULMA_URL = Array.prototype.find.call(document.styleSheets, sheet =>
  sheet.href.startsWith(`${window.location.origin}/bulma/`),
).href;

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export default class Block extends React.Component {
  static propTypes = {
    actionCreators: PropTypes.shape(),
    app: PropTypes.shape().isRequired,
    /**
     * The block to render.
     */
    block: PropTypes.shape().isRequired,
    blockDef: PropTypes.shape(),
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    showDialog: PropTypes.func,
  };

  static defaultProps = {
    actionCreators: null,
    blockDef: null,
    showDialog: null,
  };

  ref = async div => {
    const {
      actionCreators,
      app,
      block,
      blockDef,
      history,
      location,
      data = location.state,
      match,
      showDialog,
      showMessage,
    } = this.props;

    if (div == null) {
      return;
    }

    if (this.attached) {
      return;
    }

    this.attached = true;
    const shadowRoot = div.attachShadow({ mode: 'closed' });
    const actions = makeActions(blockDef, app, block, history, showDialog, actionCreators);
    const resources = makeResources(blockDef, block);
    await Promise.all(
      [
        BULMA_URL,
        ...blockDef.files.filter(url => url.endsWith('.css')).map(url => prefixURL(block, url)),
      ].map(
        url =>
          new Promise(resolve => {
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
          }),
      ),
      new Promise(resolve => {
        const link = document.createElement('link');
        link.addEventListener('load', resolve, {
          capture: true,
          once: true,
          passive: true,
        });
        link.href = `/api/apps/${app.id}/style/shared`;
        link.rel = 'stylesheet';
        shadowRoot.appendChild(link);
      }),
    );
    const utils = {
      showMessage,
    };
    await callBootstrap(blockDef, {
      actions,
      block,
      data,
      pageParameters: match.params,
      resources,
      shadowRoot,
      utils,
    });
  };

  render() {
    const { blockDef } = this.props;

    if (blockDef == null) {
      return null;
    }

    if (blockDef.position === 'float') {
      return ReactDOM.createPortal(<div ref={this.ref} className={styles.float} />, document.body);
    }

    return <div ref={this.ref} className={styles.main} />;
  }
}
