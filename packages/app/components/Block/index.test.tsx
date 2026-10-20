import { EventEmitter } from 'node:events';

import { type AppDefinition, type BlockDefinition } from '@appsemble/lang-sdk';
import { type BootstrapParams } from '@appsemble/sdk';
import { type BlockManifest } from '@appsemble/types';
import { MessagesProvider, ModalCard } from '@appsemble/react-components';
import { noop } from '@appsemble/utils';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Block } from './index.js';
import { type AppStorage } from '../../utils/storage.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

let blockRoot: HTMLElement;
let blockVersion = 0;

function loadControls({ shadowRoot, utils }: BootstrapParams): void {
  const button = document.createElement('button');
  button.textContent = utils.isMobile ? 'Move item up' : 'Drag item';
  shadowRoot.append(button);
  blockRoot = shadowRoot as unknown as HTMLElement;
}

let loadBlock = loadControls;

/**
 * Check whether an element is rendered inside a container, following slots into shadow roots.
 *
 * @param container The container to look for.
 * @param element The element to check.
 * @returns Whether the element is a flat tree descendant of the container.
 */
function isRenderedInside(container: Element, element: Element): boolean {
  let node: Node | null = element;
  while (node) {
    if (node === container) {
      return true;
    }
    node =
      (node instanceof Element && node.assignedSlot) ||
      (node instanceof ShadowRoot ? node.host : node.parentNode);
  }
  return false;
}

beforeEach(() => {
  const stylesheet = document.createElement('link');
  stylesheet.id = 'bulma-style-app';
  document.head.append(stylesheet);
  vi.stubGlobal('matchMedia', () => ({ addEventListener: noop, removeEventListener: noop }));
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
    appMemberRoles: [],
    appMemberInfoRef: { current: undefined },
    isLoggedIn: false,
    logout: noop,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    appMessageIds: [],
    getAppMessage: () => ({ format: () => '' }),
    getBlockMessage: () => ({ format: () => '' }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({ getVariable: noop } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: noop,
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue(
    {} as never,
  );

  const bootstrap = (params: BootstrapParams): void => loadBlock(params);
  const appendHead = document.head.append.bind(document.head);
  vi.spyOn(document.head, 'append').mockImplementation((...nodes: (string | Node)[]) => {
    appendHead(...nodes);
    for (const node of nodes) {
      if (node instanceof HTMLScriptElement) {
        queueMicrotask(() => {
          Object.defineProperty(document, 'currentScript', { configurable: true, value: node });
          node.dispatchEvent(
            new CustomEvent('AppsembleBootstrap', { detail: { document, fn: bootstrap } }),
          );
        });
      }
    }
  });
  const appendFragment = DocumentFragment.prototype.append;
  // eslint-disable-next-line prefer-arrow-callback
  vi.spyOn(DocumentFragment.prototype, 'append').mockImplementation(function append(
    this: DocumentFragment,
    ...nodes: (string | Node)[]
  ): void {
    appendFragment.apply(this, nodes);
    for (const node of nodes) {
      if (node instanceof HTMLLinkElement) {
        queueMicrotask(() => node.dispatchEvent(new Event('load')));
      }
    }
  });
});

afterEach(() => {
  cleanup();
  loadBlock = loadControls;
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('block viewport mode', () => {
  it.each([
    [277, 'Move item up'],
    [1024, 'Drag item'],
  ])('should initialize controls for a %ipx viewport', async (width, label) => {
    vi.stubGlobal('innerWidth', width);
    blockVersion += 1;
    const block: BlockDefinition = {
      type: '@test/viewport-controls',
      version: `1.0.${blockVersion}`,
    };
    const pageDefinition = { name: 'Home', blocks: [block] };
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        name: 'Test App',
        defaultPage: 'Home',
        pages: [pageDefinition],
      } as AppDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [
        { name: block.type, version: block.version, files: ['viewport-controls.js'] },
      ] as BlockManifest[],
    });
    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <Block
            appStorage={{} as AppStorage}
            block={block}
            // eslint-disable-next-line unicorn/prefer-event-target
            ee={new EventEmitter()}
            flowActions={{}}
            pageDefinition={pageDefinition}
            pageReady={Promise.resolve()}
            prefix="pages.home.blocks.0"
            prefixIndex="pages.0.blocks.0"
            ready={noop}
            remap={noop}
            showDialog={() => noop}
            showShareDialog={() => Promise.resolve()}
          />
        </MemoryRouter>
      </IntlProvider>,
    );
    await waitFor(() =>
      expect(within(blockRoot).getByRole('button', { name: label })).toBeDefined(),
    );
  });
});

describe('float layout', () => {
  it('should render a float block in a dialog inside the dialog, so it is not blocked', async () => {
    blockVersion += 1;
    const block: BlockDefinition = {
      type: '@test/float-controls',
      version: `1.0.${blockVersion}`,
      layout: 'float',
    };
    const pageDefinition = { name: 'Home', blocks: [] };
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        name: 'Test App',
        defaultPage: 'Home',
        pages: [pageDefinition],
      } as AppDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [
        { name: block.type, version: block.version, files: ['float-controls.js'] },
      ] as BlockManifest[],
    });
    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <ModalCard isActive>
            <Block
              appStorage={{} as AppStorage}
              block={block}
              // eslint-disable-next-line unicorn/prefer-event-target
              ee={new EventEmitter()}
              flowActions={{}}
              pageDefinition={pageDefinition}
              pageReady={Promise.resolve()}
              prefix="pages.home.blocks.0.actions.onClick.blocks.0"
              prefixIndex="pages.0.blocks.0.actions.onClick.blocks.0"
              ready={noop}
              remap={noop}
              showDialog={() => noop}
              showShareDialog={() => Promise.resolve()}
            />
          </ModalCard>
        </MemoryRouter>
      </IntlProvider>,
    );

    await waitFor(() => within(blockRoot).getByRole('button'));
    expect(screen.getByRole('dialog').contains((blockRoot as unknown as ShadowRoot).host)).toBe(
      true,
    );
  });
});

describe('modal dialogs', () => {
  it('should show messages inside the modal dialog of a block', async () => {
    let dialog: HTMLDialogElement;
    loadBlock = ({ shadowRoot, utils }) => {
      // This mirrors how the modals of @appsemble/preact-components tell the app they are shown.
      dialog = document.createElement('dialog');
      dialog.innerHTML = '<slot name="messages"></slot>';
      shadowRoot.append(dialog);
      dialog.showModal();
      dialog.dispatchEvent(
        new CustomEvent('AppsembleModalDialogShow', {
          bubbles: true,
          composed: true,
          detail: { slot: 'messages' },
        }),
      );
      utils.showMessage('Saving failed');
    };
    blockVersion += 1;
    const block: BlockDefinition = { type: '@test/dialog', version: `1.0.${blockVersion}` };
    const pageDefinition = { name: 'Home', blocks: [block] };
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
      definition: {
        name: 'Test App',
        defaultPage: 'Home',
        pages: [pageDefinition],
      } as AppDefinition,
      demoMode: false,
      revision: 1,
      blockManifests: [
        { name: block.type, version: block.version, files: ['dialog.js'] },
      ] as BlockManifest[],
    });
    render(
      <IntlProvider locale="en">
        <MessagesProvider>
          <MemoryRouter>
            <Block
              appStorage={{} as AppStorage}
              block={block}
              // eslint-disable-next-line unicorn/prefer-event-target
              ee={new EventEmitter()}
              flowActions={{}}
              pageDefinition={pageDefinition}
              pageReady={Promise.resolve()}
              prefix="pages.home.blocks.0"
              prefixIndex="pages.0.blocks.0"
              ready={noop}
              remap={noop}
              showDialog={() => noop}
              showShareDialog={() => Promise.resolve()}
            />
          </MemoryRouter>
        </MessagesProvider>
      </IntlProvider>,
    );

    const message = await screen.findByRole('alert');
    expect(isRenderedInside(dialog!, message)).toBe(true);
  });
});
