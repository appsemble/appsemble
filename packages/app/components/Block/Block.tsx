import { Events } from '@appsemble/sdk';
import { AppDefinition, Block as BlockType, BlockDefinition, Message } from '@appsemble/types';
import { baseTheme, normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { ShowDialogAction } from '../../types';
import { prefixURL } from '../../utils/blockUtils';
import { callBootstrap } from '../../utils/bootstrapper';
import injectCSS from '../../utils/injectCSS';
import makeActions from '../../utils/makeActions';
import settings from '../../utils/settings';
import styles from './Block.css';

const FA_URL = Array.from(document.styleSheets, sheet => sheet.href).find(
  href => href && href.startsWith(`${window.location.origin}/fa/`),
);

interface BlockProps {
  definition: AppDefinition;
  data?: any;
  className?: string;

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

  showDialog: ShowDialogAction;
  showMessage(message: Message): void;
  ready(): void;
}

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export default function Block({
  actionCreators,
  definition,
  block,
  blockDef,
  className,
  emitEvent,
  data,
  offEvent,
  onEvent,
  showDialog,
  showMessage,
  flowActions,
  ready,
}: BlockProps): React.ReactElement {
  const history = useHistory();
  const match = useRouteMatch();
  const location = useLocation();

  const ref = React.useRef<HTMLDivElement>();
  const cleanups = React.useRef<Function[]>([]);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(
    () => () => {
      cleanups.current.forEach(async fn => fn());
    },
    [],
  );

  React.useEffect(() => {
    const div = ref.current;
    if (initialized || !div) {
      return;
    }
    setInitialized(true);

    const shadowRoot = div.attachShadow({ mode: 'closed' });
    const events = {
      emit: emitEvent,
      off: offEvent,
      on: onEvent,
    };

    const actions = makeActions(
      settings.id,
      blockDef,
      definition,
      block,
      history,
      showDialog,
      actionCreators,
      flowActions,
    );
    const { theme: pageTheme } = definition.pages.find(
      page => normalize(page.name) === match.path.slice(1).split('/')[0],
    );
    const BULMA_URL = document.querySelector('#bulma-style-app') as HTMLLinkElement;
    const [bulmaBase] = BULMA_URL.href.split('?');
    const theme = {
      ...baseTheme,
      ...definition.theme,
      ...pageTheme,
      ...block.theme,
    };

    const urlParams = new URLSearchParams(theme);
    urlParams.sort();

    const bulmaUrl =
      definition.theme || pageTheme || block.theme ? `${bulmaBase}?${urlParams}` : bulmaBase;

    const utils = {
      showMessage,
      addCleanup(fn: Function) {
        cleanups.current.push(fn);
      },
    };

    (async () => {
      await Promise.all(
        [
          bulmaUrl,
          FA_URL,
          ...blockDef.files.filter(url => url.endsWith('.css')).map(url => prefixURL(block, url)),
          `${window.location.origin}/api/organizations/${settings.organizationId}/style/shared`,
          `${window.location.origin}/api/organizations/${settings.organizationId}/style/block/${blockDef.name}`,
          `${window.location.origin}/api/apps/${settings.id}/style/block/${blockDef.name}`,
          (document.getElementById('appsemble-style-shared') as HTMLLinkElement)?.href,
        ].map(url => injectCSS(shadowRoot, url)),
      );

      await callBootstrap(blockDef, {
        actions,
        block,
        data: data || location.state,
        events,
        pageParameters: match.params,
        theme,
        shadowRoot,
        utils,
      });

      ready();
    })();
  }, [
    actionCreators,
    block,
    blockDef,
    data,
    definition,
    emitEvent,
    flowActions,
    history,
    initialized,
    location.state,
    match.params,
    match.path,
    offEvent,
    onEvent,
    ready,
    showDialog,
    showMessage,
  ]);

  if (blockDef == null) {
    return null;
  }

  switch (blockDef.layout) {
    case 'float':
      return ReactDOM.createPortal(
        <div ref={ref} className={classNames(styles.float, className)} />,
        document.body,
      );
    case 'static':
      return <div ref={ref} className={classNames(styles.static, className)} />;
    default:
      return <div ref={ref} className={classNames(styles.grow, className)} />;
  }
}
