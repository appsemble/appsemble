import { useMessages } from '@appsemble/react-components';
import type { BlockDefinition } from '@appsemble/types';
import { baseTheme, normalize, normalizeBlockName, remap } from '@appsemble/utils';
import classNames from 'classnames';
import type { EventEmitter } from 'events';
import React from 'react';
import ReactDOM from 'react-dom';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import type { ActionCreators } from '../../utils/actions';
import { callBootstrap } from '../../utils/bootstrapper';
import injectCSS from '../../utils/injectCSS';
import makeActions from '../../utils/makeActions';
import prefixBlockURL from '../../utils/prefixBlockURL';
import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
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
  pageReady,
  prefix,
  ready,
  showDialog,
}: BlockProps): React.ReactElement {
  const history = useHistory();
  const match = useRouteMatch();
  const location = useLocation();
  const push = useMessages();
  const { blockManifests, definition } = useAppDefinition();

  const ref = React.useRef<HTMLDivElement>();
  const cleanups = React.useRef<Function[]>([]);
  const [initialized, setInitialized] = React.useState(false);
  const pushNotifications = useServiceWorkerRegistration();

  const blockName = normalizeBlockName(block.type);
  const manifest = blockManifests.find((m) => m.name === blockName && m.version === block.version);

  React.useEffect(
    () => () => {
      cleanups.current.forEach(async (fn) => fn());
    },
    [],
  );

  React.useEffect(() => {
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
    const { theme: pageTheme } = definition.pages.find(
      (page) => normalize(page.name) === match.path.slice(1).split('/')[0],
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
      remap,
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
        pageParameters: match.params,
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
    match,
    pageReady,
    prefix,
    push,
    pushNotifications,
    ready,
    showDialog,
  ]);

  const header = block.header ? (
    <h6 className={classNames('title is-6', styles.title)}>
      {remap(block.header, { ...data, ...match.params })}
    </h6>
  ) : null;

  switch (manifest.layout) {
    case 'float':
      return ReactDOM.createPortal(
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
