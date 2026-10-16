import { EventEmitter } from 'node:events';

import { type AppDefinition, type BlockDefinition } from '@appsemble/lang-sdk';
import { ErrorHandler } from '@appsemble/react-components';
import { type BootstrapParams } from '@appsemble/sdk';
import { type BlockManifest } from '@appsemble/types';
import { noop } from '@appsemble/utils';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Block } from './index.js';
import { type AppStorage } from '../../utils/storage.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

let failingFile: string | undefined;
let blockRoot: HTMLElement | undefined;
let blockVersion = 0;

function loadBlock({ shadowRoot }: BootstrapParams): void {
  const button = document.createElement('button');
  button.textContent = 'Loaded block';
  shadowRoot.append(button);
  blockRoot = shadowRoot as unknown as HTMLElement;
}

beforeEach(() => {
  blockRoot = undefined;
  vi.spyOn(console, 'error').mockImplementation(noop);
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

  const appendHead = document.head.append.bind(document.head);
  vi.spyOn(document.head, 'append').mockImplementation((...nodes: (string | Node)[]) => {
    appendHead(...nodes);
    for (const node of nodes) {
      if (node instanceof HTMLScriptElement) {
        const event =
          failingFile && node.src.includes(failingFile)
            ? new Event('error')
            : new CustomEvent('AppsembleBootstrap', { detail: { document, fn: loadBlock } });
        queueMicrotask(() => {
          Object.defineProperty(document, 'currentScript', { configurable: true, value: node });
          node.dispatchEvent(event);
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
        const event = failingFile && node.href.includes(failingFile) ? 'error' : 'load';
        queueMicrotask(() => node.dispatchEvent(new Event(event)));
      }
    }
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('block load failure', () => {
  it.each(['/shared.css', '/load-recovery.js'])(
    'should show native page recovery and allow a retry after %s loads',
    async (file) => {
      failingFile = file;
      blockVersion += 1;
      const block: BlockDefinition = {
        type: '@test/load-recovery',
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
          { name: block.type, version: block.version, files: ['load-recovery.js'] },
        ] as BlockManifest[],
      });
      render(
        <IntlProvider locale="en">
          <MemoryRouter initialEntries={['/page']}>
            <ErrorHandler fallback={ErrorFallback}>
              <Routes>
                <Route element={<Link to="/page">Open page</Link>} path="/" />
                <Route
                  element={
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
                  }
                  path="/page"
                />
              </Routes>
            </ErrorHandler>
          </MemoryRouter>
        </IntlProvider>,
      );
      await waitFor(() =>
        expect(screen.getByText('An unexpected error has occurred.')).toBeDefined(),
      );
      fireEvent.click(screen.getByRole('link', { name: 'Back to home' }));
      failingFile = undefined;
      fireEvent.click(await screen.findByRole('link', { name: 'Open page' }));
      await waitFor(() =>
        expect(within(blockRoot!).getByRole('button', { name: 'Loaded block' })).toBeDefined(),
      );
    },
  );
});
