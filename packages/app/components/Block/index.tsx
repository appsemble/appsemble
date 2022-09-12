import { EventEmitter } from 'events';

import { Title, useMessages } from '@appsemble/react-components';
import { Utils } from '@appsemble/sdk';
import { BlockDefinition, PageDefinition, Remapper } from '@appsemble/types';
import { createThemeURL, mergeThemes, normalizeBlockName, prefixBlockURL } from '@appsemble/utils';
import { fa } from '@appsemble/web-utils';
import classNames from 'classnames';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types.js';
import { ActionCreators } from '../../utils/actions/index.js';
import { callBootstrap } from '../../utils/bootstrapper.js';
import { createEvents } from '../../utils/events.js';
import { injectCSS } from '../../utils/injectCSS.js';
import { makeActions } from '../../utils/makeActions.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { usePage } from '../MenuProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';
import styles from './index.module.css';

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
  showShareDialog: ShowShareDialog;
  ready: (block: BlockDefinition) => void;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  pageReady: Promise<void>;
  prefix: string;
  prefixIndex: string;
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
  prefixIndex,
  ready,
  remap,
  showDialog,
  showShareDialog,
}: BlockProps): ReactElement {
  const history = useHistory();
  const params = useParams();
  const location = useLocation();
  const route = useRouteMatch<{ lang: string }>();
  const push = useMessages();
  const { blockManifests, definition } = useAppDefinition();
  const { getBlockMessage } = useAppMessages();
  const { passwordLogin, setUserInfo, teams, updateTeam, userInfo, userInfoRef } = useUser();
  const { setBlockMenu } = usePage();

  const ref = useRef<HTMLDivElement>();
  const cleanups = useRef<(() => void)[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pushNotifications = useServiceWorkerRegistration();

  const blockName = normalizeBlockName(block.type);
  const manifest = blockManifests.find((m) => m.name === blockName && m.version === block.version);

  useEffect(
    () => () => {
      for (const fn of cleanups.current) {
        fn();
      }
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
      app: definition,
      context: block,
      history,
      showDialog,
      showShareDialog,
      extraCreators,
      flowActions,
      pushNotifications,
      pageReady,
      route,
      prefix,
      prefixIndex,
      ee,
      remap,
      showMessage: push,
      teams,
      updateTeam,
      getUserInfo: () => userInfoRef.current,
      passwordLogin,
      setUserInfo,
    });
    const theme = mergeThemes(definition.theme, page.theme, block.theme);

    const bulmaUrl = createThemeURL(theme);

    const utils: Utils = {
      remap,
      showMessage: push,
      addCleanup(fn) {
        cleanups.current.push(fn);
      },
      asset(id) {
        return `${apiUrl}/api/apps/${appId}/assets/${id}`;
      },
      formatMessage(message, args = {}) {
        return getBlockMessage(blockName, block.version, { id: String(message) }, prefix).format(
          args,
        ) as string;
      },
      fa,
      menu(items, header) {
        setBlockMenu({ items, header, path: prefix });
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
        path: prefix,
        pathIndex: prefixIndex,
      });

      ready(block);
    })();
  }, [
    block,
    blockName,
    data,
    definition,
    ee,
    extraCreators,
    flowActions,
    getBlockMessage,
    history,
    initialized,
    location,
    manifest,
    page,
    pageReady,
    params,
    passwordLogin,
    prefix,
    prefixIndex,
    push,
    pushNotifications,
    ready,
    remap,
    route,
    setBlockMenu,
    setUserInfo,
    showDialog,
    showShareDialog,
    teams,
    updateTeam,
    userInfo,
    userInfoRef,
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
    const { navigation = 'left-menu' } = definition.layout || {};

    return createPortal(
      <div
        className={classNames(`is-flex ${styles.root} ${styles.float}`, {
          [styles.top]: position.includes('top'),
          [styles.bottom]: position.includes('bottom'),
          [styles.left]: position.includes('left'),
          [styles.right]: position.includes('right'),
          [styles.hasSideMenu]: navigation === 'left-menu',
          [styles.hasBottomNav]: navigation === 'bottom',
        })}
        data-block={blockName}
        data-path={prefix}
        data-path-index={prefixIndex}
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
      data-path-index={prefixIndex}
    >
      {header}
      <div className={styles.host} ref={ref} />
    </div>
  );
}
