import { EventEmitter } from 'events';

import { Title, useMessages } from '@appsemble/react-components';
import { BlockDefinition, PageDefinition, Remapper } from '@appsemble/types';
import { baseTheme, normalizeBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';

import { ShowDialogAction } from '../../types';
import { ActionCreators } from '../../utils/actions';
import { callBootstrap } from '../../utils/bootstrapper';
import { createEvents } from '../../utils/events';
import { injectCSS } from '../../utils/injectCSS';
import { makeActions } from '../../utils/makeActions';
import { prefixBlockURL } from '../../utils/prefixBlockURL';
import { apiUrl, appId } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import styles from './index.css';

const FA_URL = [...document.styleSheets]
  .map((sheet) => sheet.href)
  .find((href) => href?.startsWith(`${window.location.origin}/fa/`));

interface BlockProps {
  data?: any;
  ee: EventEmitter;

  /**
   * The block to render.
   */
  block: BlockDefinition;
  extraCreators?: ActionCreators;

  /**
   * XXX: Define this type
   */
  flowActions: any;

  /**
   * The page in which the block is rendered.
   */
  page: PageDefinition;

  showDialog: ShowDialogAction;
  ready: (block: BlockDefinition) => void;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  pageReady: Promise<void>;
  prefix: string;
}

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export function Block({
  block,
  data,
  ee,
  extraCreators,
  flowActions,
  page,
  pageReady,
  prefix,
  ready,
  remap,
  showDialog,
}: BlockProps): ReactElement {
  const history = useHistory();
  const params = useParams();
  const location = useLocation();
  const route = useRouteMatch<{ lang: string }>();
  const push = useMessages();
  const { blockManifests, definition } = useAppDefinition();

  const ref = useRef<HTMLDivElement>();
  const cleanups = useRef<(() => void)[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pushNotifications = useServiceWorkerRegistration();

  const blockName = normalizeBlockName(block.type);
  const manifest = blockManifests.find((m) => m.name === blockName && m.version === block.version);

  useEffect(
    () => () => {
      cleanups.current.forEach((fn) => fn());
    },
    [],
  );

  useEffect(() => {
    const div = ref.current;
    if (initialized || (!div && manifest.layout !== 'hidden') || !pageReady) {
      return;
    }
    setInitialized(true);

    const shadowRoot = div?.attachShadow({ mode: 'open' });

    const events = createEvents(ee, pageReady, manifest.events, block.events);

    const actions = makeActions({
      actions: manifest.actions,
      definition,
      context: block,
      history,
      showDialog,
      extraCreators,
      flowActions,
      pushNotifications,
      pageReady,
      route,
      prefix,
      ee,
      remap,
      showMessage: push,
    });
    const BULMA_URL = document.querySelector('#bulma-style-app') as HTMLLinkElement;
    const [bulmaBase] = BULMA_URL.href.split('?');
    const theme = {
      ...baseTheme,
      ...definition.theme,
      ...page.theme,
      ...block.theme,
    };

    const urlParams = new URLSearchParams(theme);
    urlParams.sort();

    const bulmaUrl =
      definition.theme || page.theme || block.theme ? `${bulmaBase}?${urlParams}` : bulmaBase;

    const utils = {
      remap,
      showMessage: push,
      addCleanup(fn: () => void) {
        cleanups.current.push(fn);
      },
      asset(id: string) {
        return `${apiUrl}/api/apps/${appId}/assets/${id}`;
      },
    };

    (async () => {
      if (shadowRoot) {
        await Promise.all(
          [
            bulmaUrl,
            FA_URL,
            ...manifest.files
              .filter((url) => url.endsWith('.css'))
              .map((url) => prefixBlockURL(block, url)),
            '/shared.css',
            `/${manifest.name}.css`,
          ].map((url) => injectCSS(shadowRoot, url)),
        );
      }

      await callBootstrap(manifest, {
        actions,
        parameters: block.parameters || {},
        data: data || location.state,
        events,
        pageParameters: params,
        theme,
        shadowRoot,
        utils,
      });

      ready(block);
    })();
  }, [
    block,
    data,
    definition,
    ee,
    extraCreators,
    flowActions,
    history,
    initialized,
    location,
    manifest,
    page,
    pageReady,
    params,
    prefix,
    push,
    pushNotifications,
    ready,
    remap,
    route,
    showDialog,
  ]);

  const { layout = manifest.layout } = block;

  if (layout === 'hidden') {
    return null;
  }

  const header = block.header ? (
    <Title className={styles.title} level={6}>
      {remap(block.header, { ...data, ...params })}
    </Title>
  ) : null;

  if (layout === 'float') {
    const { position = 'bottom right' } = block;
    return createPortal(
      <div
        className={classNames(`is-flex ${styles.root} ${styles.float}`, {
          [styles.top]: position.includes('top'),
          [styles.bottom]: position.includes('bottom'),
          [styles.left]: position.includes('left'),
          [styles.right]: position.includes('right'),
          [styles.hasBottomNav]: definition?.layout?.navigation === 'bottom',
        })}
        data-block={blockName}
        data-path={prefix}
      >
        {header}
        <div className={styles.host} ref={ref} />
      </div>,
      document.body,
    );
  }

  return (
    <div
      className={`is-flex ${styles.root} ${layout === 'static' ? styles.static : styles.grow}`}
      data-block={blockName}
      data-path={prefix}
    >
      {header}
      <div className={styles.host} ref={ref} />
    </div>
  );
}
