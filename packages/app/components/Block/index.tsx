import { type EventEmitter } from 'events';

import { Title, useMessages } from '@appsemble/react-components';
import { type Utils } from '@appsemble/sdk';
import { type BlockDefinition, type PageDefinition, type Remapper } from '@appsemble/types';
import { createThemeURL, mergeThemes, normalizeBlockName, prefixBlockURL } from '@appsemble/utils';
import { fa } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { type ShowDialogAction, type ShowShareDialog } from '../../types.js';
import { type ActionCreators } from '../../utils/actions/index.js';
import { callBootstrap } from '../../utils/bootstrapper.js';
import { createEvents } from '../../utils/events.js';
import { injectCSS } from '../../utils/injectCSS.js';
import { makeActions } from '../../utils/makeActions.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { type AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { usePage } from '../MenuProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

const FA_URL = [...document.styleSheets]
  .map((sheet) => sheet.href)
  .find((href) => href?.startsWith(`${window.location.origin}/fa/`));

interface BlockProps {
  readonly data?: any;
  readonly ee: EventEmitter;

  /**
   * The block to render.
   */
  readonly block: BlockDefinition;
  readonly extraCreators?: ActionCreators;

  /**
   * XXX: Define this type
   */
  readonly flowActions: any;

  /**
   * The page in which the block is rendered.
   */
  readonly page: PageDefinition;
  readonly appStorage: AppStorage;
  readonly showDialog: ShowDialogAction;
  readonly showShareDialog: ShowShareDialog;
  readonly ready: (block: BlockDefinition) => void;
  readonly remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  readonly pageReady: Promise<void>;
  readonly prefix: string;
  readonly prefixIndex: string;
}

/**
 * Render a block on a page.
 *
 * A shadow DOM is created for the block. All CSS files for each block definition are added to the
 * shadow DOM. Then the bootstrap function of the block definition is called.
 */
export function Block({
  appStorage,
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
}: BlockProps): ReactNode {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const push = useMessages();
  const { blockManifests, definition } = useAppDefinition();
  const { getAppMessage, getBlockMessage } = useAppMessages();

  const { logout, passwordLogin, setUserInfo, teams, updateTeam, userInfo, userInfoRef } =
    useUser();
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
      getAppMessage,
      appStorage,
      actions: manifest.actions,
      app: definition,
      context: block,
      navigate,
      showDialog,
      showShareDialog,
      extraCreators,
      flowActions,
      pushNotifications,
      pageReady,
      params,
      prefix,
      prefixIndex,
      ee,
      remap,
      showMessage: push,
      teams,
      updateTeam,
      getUserInfo: () => userInfoRef.current,
      passwordLogin,
      passwordLogout: logout,
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
    appStorage,
    extraCreators,
    flowActions,
    getBlockMessage,
    navigate,
    initialized,
    location,
    manifest,
    page,
    pageReady,
    params,
    passwordLogin,
    logout,
    prefix,
    prefixIndex,
    push,
    pushNotifications,
    ready,
    remap,
    setBlockMenu,
    setUserInfo,
    showDialog,
    showShareDialog,
    teams,
    updateTeam,
    userInfo,
    userInfoRef,
    getAppMessage,
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
      className={`is-flex ${styles.root} ${layout === 'grow' ? styles.grow : styles.static}`}
      data-block={blockName}
      data-path={prefix}
      data-path-index={prefixIndex}
    >
      {header}
      <div className={styles.host} ref={ref} />
    </div>
  );
}
