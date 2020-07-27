import { useMessages } from '@appsemble/react-components';
import type { BlockDefinition, PageDefinition, Remapper } from '@appsemble/types';
import { baseTheme, normalizeBlockName, remap } from '@appsemble/utils';
import classNames from 'classnames';
import type { EventEmitter } from 'events';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import type { ActionCreators } from '../../utils/actions';
import { callBootstrap } from '../../utils/bootstrapper';
import injectCSS from '../../utils/injectCSS';
import makeActions from '../../utils/makeActions';
import prefixBlockURL from '../../utils/prefixBlockURL';
import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import styles from './index.css';

const FA_URL = Array.from(document.styleSheets, (sheet) => sheet.href).find((href) =>
  href?.startsWith(`${window.location.origin}/fa/`),
);

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
  ready(block: BlockDefinition): void;
  pageReady: Promise<void>;
  prefix: string;
}

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export default function Block({
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
  showDialog,
}: BlockProps): ReactElement {
  const history = useHistory();
  const params = useParams();
  const location = useLocation();
  const push = useMessages();
  const { blockManifests, definition } = useAppDefinition();
  const getMessage = useAppMessages();

  const ref = useRef<HTMLDivElement>();
  const cleanups = useRef<Function[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pushNotifications = useServiceWorkerRegistration();

  const blockName = normalizeBlockName(block.type);
  const manifest = blockManifests.find((m) => m.name === blockName && m.version === block.version);

  useEffect(
    () => () => {
      cleanups.current.forEach(async (fn) => fn());
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
      remap: (mappers: Remapper, input: any) => remap(mappers, input, { getMessage }),
      showMessage: push,
      addCleanup(fn: Function) {
        cleanups.current.push(fn);
      },
      asset(id: string) {
        return `${settings.apiUrl}/api/apps/${settings.id}/assets/${id}`;
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
    getMessage,
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
    showDialog,
  ]);

  const header = block.header ? (
    <h6 className={classNames('title is-6', styles.title)}>
      {remap(block.header, { ...data, ...params }, { getMessage })}
    </h6>
  ) : null;

  switch (manifest.layout) {
    case 'float':
      return createPortal(
        <div ref={ref} className={className} data-block={blockName} data-path={prefix} />,
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
