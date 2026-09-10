import { type AppDefinition, type PageDefinition } from '@appsemble/lang-sdk';
import { type BootstrapParams } from '@appsemble/sdk';
import { type BlockManifest } from '@appsemble/types';
import { noop } from '@appsemble/utils';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Page } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

let mock: MockAdapter;
let blockRoots: HTMLElement[];
let blockVersion = 0;

function loadBlock({ data, shadowRoot }: BootstrapParams): void {
  const output = document.createElement('output');
  output.textContent = (data as { person?: { name: string } })?.person?.name ?? 'No page data';
  shadowRoot.append(output);
  blockRoots.push(shadowRoot as unknown as HTMLElement);
}

function renderPage(pageDefinition?: Partial<PageDefinition>): void {
  blockVersion += 1;
  const block = { type: '@test/page-data', version: `1.0.${blockVersion}` };
  const definition = {
    name: 'Test App',
    defaultPage: 'Home',
    layout: { hideTitleBar: true, navigation: 'hidden' },
    pages: [
      {
        name: 'Home',
        actions: { onLoad: { type: 'request', url: 'https://example.com/home', proxy: false } },
        blocks: [block],
        ...pageDefinition,
      },
      {
        name: 'Other',
        actions: { onLoad: { type: 'request', url: 'https://example.com/other', proxy: false } },
        blocks: [block],
      },
    ],
  } as AppDefinition;
  if (definition.pages[0].type === 'tabs') {
    definition.pages[0].tabs = [{ name: 'Details', blocks: [block] }];
  }
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    demoMode: false,
    revision: 1,
    blockManifests: [
      { name: block.type, version: block.version, files: ['page-data.js'] },
    ] as BlockManifest[],
    pageManifests: { events: { listen: { data: {} } } },
  });
  render(
    <IntlProvider locale="en">
      <MemoryRouter initialEntries={['/en/home']}>
        <Link to="/en/other">Other page</Link>
        <Routes>
          <Route element={<Page />} path="/:lang/:pageId/*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

function queryPageData(name: string): HTMLElement | undefined {
  return blockRoots
    .map((root) => within(root).queryByText(name))
    .find((element) => element != null);
}

beforeEach(() => {
  blockRoots = [];
  mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
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
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
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
        queueMicrotask(() => {
          Object.defineProperty(document, 'currentScript', { configurable: true, value: node });
          node.dispatchEvent(
            new CustomEvent('AppsembleBootstrap', { detail: { document, fn: loadBlock } }),
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
  mock.restore();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('page initial data', () => {
  it('should initialize blocks with the completed asynchronous onLoad result', async () => {
    let respond!: () => void;
    mock.onGet('https://example.com/home').reply(
      () =>
        new Promise((resolve) => {
          respond = () => resolve([200, { person: { name: 'Ada' } }]);
        }),
    );
    renderPage();
    await waitFor(() => expect(respond).toBeDefined());
    respond();
    await waitFor(() => expect(queryPageData('Ada')).toBeDefined());
  });

  it('should pass the page onLoad result to a static tab', async () => {
    mock.onGet('https://example.com/home').reply(200, { person: { name: 'Grace' } });
    renderPage({ type: 'tabs', tabs: [] });
    await waitFor(() => expect(queryPageData('Grace')).toBeDefined());
  });

  it('should initialize the next page with its own result when a previous request finishes late', async () => {
    let respondHome!: () => void;
    mock.onGet('https://example.com/home').reply(
      () =>
        new Promise((resolve) => {
          respondHome = () => resolve([200, { person: { name: 'Ada' } }]);
        }),
    );
    mock.onGet('https://example.com/other').reply(200, { person: { name: 'Grace' } });
    renderPage();
    await waitFor(() => expect(respondHome).toBeDefined());
    fireEvent.click(screen.getByRole('link', { name: 'Other page' }));
    await waitFor(() => expect(queryPageData('Grace')).toBeDefined());
    await act(async () => {
      respondHome();
      await Promise.resolve();
    });
    expect(queryPageData('Grace')).toBeDefined();
    expect(blockRoots.some((root) => within(root).queryByText('Ada'))).toBe(false);
  });

  it('should initialize blocks on a page without an onLoad action', async () => {
    renderPage({ actions: undefined });
    await waitFor(() => expect(queryPageData('No page data')).toBeDefined());
  });
});
