import type { EventEmitter } from 'events';

import { useMessages } from '@appsemble/react-components';
import type { BlockDefinition, PageDefinition, Remapper } from '@appsemble/types';
import { baseTheme, normalizeBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import type { ActionCreators } from '../../utils/actions';
import { callBootstrap } from '../../utils/bootstrapper';
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
  className?: string;
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
  remap: (remapper: Remapper, data: any) => any;
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
  className,
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

    const shadowRoot = div?.attachShadow({ mode: 'closed' }) ?? null;

    const events = {
      emit: Object.fromEntries(
        Object.keys(manifest.events?.emit || {}).map((key) => [
          key,
          (d: any, error?: string) =>
            pageReady.then(
              block.events?.emit?.[key]
                ? () => {
                    ee.emit(block.events.emit[key], d, error === '' ? 'Error' : error);
                    return true;
                  }
                : () => false,
            ),
        ]),
      ),
      on: Object.fromEntries(
        Object.keys(manifest.events?.listen || {}).map((key) => [
          key,
          block.events?.listen?.[key]
            ? (callback: (data: any, error?: string) => void) => {
                ee.on(block.events.listen[key], callback);
                return true;
              }
            : () => false,
        ]),
      ),
      off: Object.fromEntries(
        Object.keys(manifest.events?.listen || {}).map((key) => [
          key,
          block.events?.listen?.[key]
            ? (callback: (data: any, error?: string) => void) => {
                ee.off(block.events.listen[key], callback);
                return true;
              }
            : () => false,
        ]),
      ),
    };

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
            '/organization/shared.css',
            `/organization/${manifest.name}.css`,
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
    showDialog,
  ]);

  const header = block.header ? (
    <h6 className={classNames('title is-6', styles.title)}>
      {remap(block.header, { ...data, ...params })}
    </h6>
  ) : null;

  switch (manifest.layout) {
    case 'float':
      return createPortal(
        <div className={className} data-block={blockName} data-path={prefix} ref={ref} />,
        document.body,
      );
    case 'hidden':
      return null;
    default:
      return (
        <div
          className={`${className} ${styles.blockRoot}`}
          data-block={blockName}
          data-path={prefix}
        >
          {header}
          <div ref={ref} />
        </div>
      );
  }
}
