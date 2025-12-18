import { type EventEmitter } from 'events';

import {
  ActionError,
  type BlockDefinition,
  normalizeBlockName,
  type PageDefinition,
  prefixBlockURL,
  type Remapper,
} from '@appsemble/lang-sdk';
import { Title, useMessages } from '@appsemble/react-components';
import { type BlockUtils } from '@appsemble/sdk';
import { createThemeURL, mergeThemes } from '@appsemble/utils';
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
import { apiUrl, appId, appUpdated } from '../../utils/settings.js';
import { type AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { usePage } from '../MenuProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

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
  readonly pageDefinition: PageDefinition;
  readonly appStorage: AppStorage;
  readonly showDialog: ShowDialogAction;
  readonly showShareDialog: ShowShareDialog;
  readonly ready: (block: BlockDefinition) => void;
  readonly remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  readonly pageReady: Promise<void>;
  readonly prefix: string;
  readonly prefixIndex: string;
}

const MOBILE_BREAKPOINT = 768;

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
  pageDefinition,
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
  const { blockManifests, definition: appDefinition } = useAppDefinition();
  const { getAppMessage, getBlockMessage } = useAppMessages();
  const { getVariable } = useAppVariables();

  const {
    addAppMemberGroup,
    appMemberGroups,
    appMemberInfoRef,
    appMemberSelectedGroup,
    logout,
    passwordLogin,
    setAppMemberInfo,
  } = useAppMember();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const { setBlockMenu } = usePage();

  const ref = useRef<HTMLDivElement>();
  const cleanups = useRef<(() => void)[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pushNotifications = useServiceWorkerRegistration();

  const blockName = normalizeBlockName(block.type);
  const manifest = blockManifests.find((m) => m.name === blockName && m.version === block.version);

  const [isMobile, setIsMobile] = useState<boolean | undefined>();

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

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
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    if (initialized || (!div && manifest.layout !== 'hidden') || !pageReady) {
      return;
    }
    setInitialized(true);

    const shadowRoot = div?.attachShadow({ mode: 'open' });

    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    const events = createEvents(ee, pageReady, manifest.events, block.events);

    const actions = makeActions({
      getAppMessage,
      getAppVariable: getVariable,
      appStorage,
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      actions: manifest.actions,
      appDefinition,
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
      appMemberGroups,
      // @ts-expect-error TODO: this shouldn't be an error
      addAppMemberGroup,
      getAppMemberInfo: () => appMemberInfoRef.current,
      passwordLogin,
      passwordLogout: logout,
      setAppMemberInfo,
      refetchDemoAppMembers,
      getAppMemberSelectedGroup: () => appMemberSelectedGroup,
    });
    const theme = mergeThemes(
      appDefinition.theme ?? {},
      pageDefinition.theme ?? {},
      block.theme ?? {},
    );

    const bulmaUrl = createThemeURL(theme);

    const utils: BlockUtils = {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
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
      isActionError(input): input is ActionError {
        return input instanceof ActionError;
      },
      menu(items, header) {
        setBlockMenu({ items, header, path: prefix });
      },
      isMobile: Boolean(isMobile),
    };

    (async () => {
      if (shadowRoot) {
        await Promise.all(
          [
            bulmaUrl,
            FA_URL,
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            ...manifest.files
              .filter((url) => url.endsWith('.css'))
              .map((url) => prefixBlockURL(block, url)),
            `/shared.css?updated=${appUpdated}`,
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            `/${manifest.name}.css?updated=${appUpdated}`,
            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks)
          ].map((url) => injectCSS(shadowRoot, url)),
        );
      }

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
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
    appDefinition,
    ee,
    appStorage,
    extraCreators,
    flowActions,
    getBlockMessage,
    navigate,
    initialized,
    location,
    manifest,
    pageDefinition,
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
    showDialog,
    showShareDialog,
    getAppMessage,
    refetchDemoAppMembers,
    getVariable,
    appMemberGroups,
    addAppMemberGroup,
    setAppMemberInfo,
    appMemberInfoRef,
    appMemberSelectedGroup,
    isMobile,
  ]);

  // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
  const { layout = manifest.layout } = block;

  const hide = block.hide ? remap(block.hide, { ...data, ...params }) : false;
  useEffect(() => {
    if (hide) {
      ready(block);
    }
  });

  if (layout === 'hidden') {
    return null;
  }

  const header = block.header ? (
    <Title className={styles.title} level={6}>
      {remap(block.header, { ...data, ...params })}
    </Title>
  ) : null;

  if (!hide) {
    if (layout === 'float') {
      const { position = 'bottom right' } = block;
      const { navigation = 'left-menu' } = appDefinition.layout || {};

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
          {/* @ts-expect-error 2322 null is not assignable to type (strictNullChecks) */}
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
        // eslint-disable-next-line react/forbid-dom-props
        style={{ gridArea: block.gridArea }}
      >
        {header}
        {/* @ts-expect-error 2322 null is not assignable to type (strictNullChecks) */}
        <div className={styles.host} ref={ref} />
      </div>
    );
  }
  return null;
}
