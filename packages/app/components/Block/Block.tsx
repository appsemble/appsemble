import { Events } from '@appsemble/sdk';
import { App, Block as BlockType, BlockDefinition, Message } from '@appsemble/types';
import { baseTheme, normalize } from '@appsemble/utils';
import React from 'react';
import ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router-dom';

import { ShowDialogAction } from '../../types';
import { prefixURL } from '../../utils/blockUtils';
import { callBootstrap } from '../../utils/bootstrapper';
import makeActions from '../../utils/makeActions';
import styles from './Block.css';

const FA_URL = Array.from(document.styleSheets, sheet => sheet.href).find(
  href => href && href.startsWith(`${window.location.origin}/fa/`),
);

export interface BlockProps {
  app: App;
  data?: any;

  /**
   * A function for emitting an event.
   */
  emitEvent: Events['emit'];

  /**
   * A function to deregister an event listener.
   */
  offEvent: Events['off'];

  /**
   * A function to register an event listener.
   */
  onEvent: Events['on'];

  /**
   * XXX: Define this type
   */
  actionCreators: any;

  /**
   * The block to render.
   */
  block: BlockType;
  blockDef: BlockDefinition;

  /**
   * XXX: Define this type
   */
  flowActions: any;

  /**
   * XXX: Define this type
   */
  showDialog: ShowDialogAction;
  showMessage(message: Message): void;
}

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export default class Block extends React.Component<BlockProps & RouteComponentProps> {
  static defaultProps: Partial<BlockProps> = {
    actionCreators: null,
    blockDef: null,
    data: undefined,
    showDialog: null,
  };

  attached: boolean;

  cleanups: Function[] = [];

  componentWillUnmount(): void {
    // Run all cleanups asynchronously, so they are run in parallel, and a failing cleanup won’t
    // block the others.
    this.cleanups.forEach(async fn => fn());
  }

  addCleanup = (fn: Function) => {
    this.cleanups.push(fn);
  };

  ref = async (div: HTMLDivElement) => {
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
      actionCreators,
      flowActions,
    );
    const { theme: pageTheme } = app.pages.find(
      page => normalize(page.name) === match.path.slice(1).split('/')[0],
    );
    const BULMA_URL = document.querySelector('#bulma-style-app') as HTMLLinkElement;
    const [bulmaBase] = BULMA_URL.href.split('?');
    const theme = {
      ...baseTheme,
      ...app.theme,
      ...pageTheme,
      ...block.theme,
    };

    const urlParams = new URLSearchParams(theme);
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
      const cloneNode = sharedStyle.cloneNode(true) as HTMLElement;
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
      theme,
      shadowRoot,
      utils,
    });
  };

  render(): React.ReactNode {
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
