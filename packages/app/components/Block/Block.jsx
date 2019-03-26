import qs from 'querystring';
import URL from 'url';

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

const FA_URL = Array.prototype.find.call(document.styleSheets, sheet =>
  sheet.href.startsWith(`${window.location.origin}/fa/`),
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
    data: PropTypes.shape(),
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    showDialog: PropTypes.func,
    showMessage: PropTypes.func.isRequired,
  };

  static defaultProps = {
    actionCreators: null,
    blockDef: null,
    data: undefined,
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

    const [bulmaUrl] = BULMA_URL.split('?');
    const bulmaUrlParams = qs.stringify({
      ...qs.parse(URL.parse(BULMA_URL).query),
      ...(block.theme && block.theme),
    });

    await Promise.all(
      [
        `${bulmaUrl}?${bulmaUrlParams}`,
        FA_URL,
        ...blockDef.files.filter(url => url.endsWith('.css')).map(url => prefixURL(block, url)),
        `${window.location.origin}/api/organizations/${app.organizationId}/style/shared`,
        `${window.location.origin}/api/organizations/${app.organizationId}/style/block/${
          blockDef.name
        }`,
        `${window.location.origin}/api/apps/${app.id}/style/block/${blockDef.name}`,
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
    );

    const sharedStyle = document.getElementById('appsemble-style-shared');
    if (sharedStyle) {
      const cloneNode = sharedStyle.cloneNode(true);
      cloneNode.removeAttribute('id');
      shadowRoot.appendChild(cloneNode);
    }

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
