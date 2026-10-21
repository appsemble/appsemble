import { type AppDefinition } from '@appsemble/lang-sdk';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode, useEffect } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppMessagesProvider, useAppMessages } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return { ...actual, default: { ...actual.default, get: axiosGet } };
});

type Resolve = (response: { data: { messages: { app: Record<string, string> } } }) => void;

let pending: Map<string, Resolve>;
let mounts: number;

function resolveLanguage(language: string, name: string): Promise<void> {
  const resolve = pending.get(`https://appsemble.app/api/apps/42/messages/${language}`)!;
  return act(async () => {
    resolve({ data: { messages: { app: { name } } } });
    await Promise.resolve();
  });
}

function Probe(): ReactNode {
  const { getAppMessage, messagesReady } = useAppMessages();

  useEffect(() => {
    mounts += 1;
  }, []);

  return (
    <>
      <p>{messagesReady ? 'ready' : 'loading'}</p>
      <p>{getAppMessage({ id: 'name' }).format() as string}</p>
    </>
  );
}

function LocationProbe(): ReactNode {
  const { hash, pathname, search } = useLocation();
  return <p>{`${pathname}${search}${hash}`}</p>;
}

function renderProvider(initialEntry = '/en'): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Link to="/nl">switch to nl</Link>
      <LocationProbe />
      <Routes>
        <Route
          element={
            <AppMessagesProvider>
              <Probe />
            </AppMessagesProvider>
          }
          path="/:lang/*"
        />
        <Route
          element={
            <AppMessagesProvider>
              <Probe />
            </AppMessagesProvider>
          }
          path="/*"
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  pending = new Map();
  mounts = 0;
  axiosGet.mockImplementation(
    (url: string) =>
      new Promise((resolve) => {
        pending.set(url, resolve as Resolve);
      }),
  );
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: { name: 'Test App', defaultPage: 'Home', pages: [] } as unknown as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
});

describe('AppMessagesProvider', () => {
  it('should keep its children mounted while the messages of a new language load', async () => {
    renderProvider();
    expect(screen.queryByText('ready')).toBeNull();

    await resolveLanguage('en', 'English name');
    await waitFor(() => expect(screen.getByText('ready')).not.toBeNull());
    expect(screen.getByText('English name')).not.toBeNull();

    fireEvent.click(screen.getByText('switch to nl'));
    await waitFor(() => expect(screen.getByText('loading')).not.toBeNull());
    expect(screen.getByText('English name')).not.toBeNull();

    await resolveLanguage('nl', 'Dutch name');
    await waitFor(() => expect(screen.getByText('ready')).not.toBeNull());
    expect(screen.getByText('Dutch name')).not.toBeNull();
    expect(mounts).toBe(1);
  });

  it('should discard a late response for the previous language', async () => {
    renderProvider();
    fireEvent.click(screen.getByText('switch to nl'));
    await waitFor(() =>
      expect(pending.has('https://appsemble.app/api/apps/42/messages/nl')).toBe(true),
    );

    await resolveLanguage('nl', 'Dutch name');
    await waitFor(() => expect(screen.getByText('ready')).not.toBeNull());
    expect(screen.getByText('Dutch name')).not.toBeNull();

    await resolveLanguage('en', 'English name');
    expect(screen.getByText('ready')).not.toBeNull();
    expect(screen.getByText('Dutch name')).not.toBeNull();
  });

  it('should keep the path when adding the language to a page URL in any language', async () => {
    renderProvider('/available-lots/detail?id=1#top');
    await waitFor(() =>
      expect(screen.getByText('/en/available-lots/detail?id=1#top')).not.toBeNull(),
    );
  });

  it('should go to the detected language without a path', async () => {
    renderProvider('/');
    await waitFor(() => expect(screen.getByText('/en')).not.toBeNull());
  });
});
