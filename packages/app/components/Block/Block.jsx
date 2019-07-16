import normalize from '@appsemble/utils/normalize';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import { prefixURL } from '../../utils/blockUtils';
import { callBootstrap } from '../../utils/bootstrapper';
import makeActions from '../../utils/makeActions';
import styles from './Block.css';

const FA_URL = Array.from(document.styleSheets, sheet => sheet.href).find(href =>
  href?.startsWith(`${window.location.origin}/fa/`),
);

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
    /**
     * A function for emitting an event.
     */
    emitEvent: PropTypes.func.isRequired,
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    flowActions: PropTypes.shape().isRequired,
    /**
     * A function to deregister an event listener.
     */
    offEvent: PropTypes.func.isRequired,
    /**
     * A function to register an event listener.
     */
    onEvent: PropTypes.func.isRequired,
    showDialog: PropTypes.func,
    showMessage: PropTypes.func.isRequired,
  };

  static defaultProps = {
    actionCreators: null,
    blockDef: null,
    data: undefined,
    showDialog: null,
  };

  cleanups = [];

  componentWillUnmount() {
    // Run all cleanups asynchronously, so they are run in parallel, and a failing cleanup won’t
    // block the others.
    this.cleanups.forEach(async fn => fn());
  }

  addCleanup = fn => {
    this.cleanups.push(fn);
  };

  ref = async div => {
    const {
      actionCreators,
      app,
      block,
      blockDef,
      emitEvent,
      history,
      location,
      data = location.state,
      match,
      offEvent,
      onEvent,
      showDialog,
      showMessage,
      flowActions,
    } = this.props;

    if (div == null) {
      return;
    }

    if (this.attached) {
      return;
    }

    this.attached = true;
    const shadowRoot = div.attachShadow({ mode: 'closed' });
    const events = {
      emit: emitEvent,
      off: offEvent,
      on: onEvent,
    };

    const actions = makeActions(
      blockDef,
      app,
      block,
      history,
      showDialog,
      events,
      actionCreators,
      flowActions,
    );
    const { theme: pageTheme } = app.pages.find(
      page => normalize(page.name) === match.path.slice(1).split('/')[0],
    );
    const BULMA_URL = document.querySelector('#bulma-style-app');
    const [bulmaBase] = BULMA_URL.href.split('?');
    const bulmaParams = {
      ...app.theme,
      ...pageTheme,
      ...block.theme,
    };

    const urlParams = new URLSearchParams(bulmaParams);
    urlParams.sort();

    const bulmaUrl =
      app.theme || pageTheme || block.theme ? `${bulmaBase}?${urlParams}` : bulmaBase;

    await Promise.all(
      [
        bulmaUrl,
        FA_URL,
        ...blockDef.files.filter(url => url.endsWith('.css')).map(url => prefixURL(block, url)),
        `${window.location.origin}/api/organizations/${app.organizationId}/style/shared`,
        `${window.location.origin}/api/organizations/${app.organizationId}/style/block/${blockDef.name}`,
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
      addCleanup: this.addCleanup,
    };
    await callBootstrap(blockDef, {
      actions,
      block,
      data,
      events,
      pageParameters: match.params,
      shadowRoot,
      utils,
    });
  };

  render() {
    const { blockDef } = this.props;

    if (blockDef == null) {
      return null;
    }

    switch (blockDef.layout) {
      case 'float':
        return ReactDOM.createPortal(
          <div ref={this.ref} className={styles.float} />,
          document.body,
        );
      case 'static':
        return <div ref={this.ref} className={styles.static} />;
      default:
        return <div ref={this.ref} className={styles.grow} />;
    }
  }
}
