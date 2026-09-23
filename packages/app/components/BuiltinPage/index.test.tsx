import { type AppDefinition, type BuiltinPagesLayoutDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BuiltinPage } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { VerifyBanner } from '../VerifyBanner/index.js';

vi.mock('../TitleBar/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- This mocks a component export.
  AppBar: ({ children }: { readonly children?: ReactNode }) => (
    <div data-testid="app-bar">{children}</div>
  ),
}));

const title = { id: 'test.title', defaultMessage: 'Verify your account' };

const titleAndContent: BuiltinPagesLayoutDefinition = {
  mobile: { layout: { columns: 1, template: ['title', 'content'] } },
};

const contentOnly: BuiltinPagesLayoutDefinition = {
  mobile: { layout: { columns: 1, template: ['content'] } },
};

const withBannerAndNavigation: BuiltinPagesLayoutDefinition = {
  mobile: { layout: { columns: 1, template: ['resend-banner', 'content', 'bottom-navigation'] } },
};

function mockApp(layout: AppDefinition['layout'] = {}, emailVerified = true): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      name: 'Test App',
      defaultPage: 'Home',
      layout,
      pages: [
        { name: 'Home', blocks: [] },
        { name: 'About', blocks: [] },
      ],
    } as AppDefinition,
    demoMode: false,
    revision: 1,
    blockManifests: [],
  });
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    appMemberSelectedGroup: undefined,
    appMemberInfo: emailVerified ? undefined : { email: 'test@example.com', email_verified: false },
    isLoggedIn: !emailVerified,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    appMessageIds: [],
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({
    getVariable: vi.fn(),
  } as never);
}

function renderPage(children: ReactNode): void {
  render(
    <IntlProvider locale="en" messages={{ 'test.title': 'Verify your account' }}>
      <MemoryRouter initialEntries={['/en/Verify']}>
        <MenuProvider>
          <VerifyBanner />
          {children}
        </MenuProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

function generatedCss(): string {
  return [...document.head.querySelectorAll('style[data-page-grid-css]')]
    .map((style) => style.textContent)
    .join('');
}

beforeEach(() => {
  mockApp();
});

afterEach(() => {
  for (const style of document.head.querySelectorAll('style[data-page-grid-css]')) {
    style.remove();
  }
});

describe('BuiltinPage', () => {
  it('should render one page root that names the page and its state', () => {
    renderPage(
      <BuiltinPage page="verify" state="success" title={title}>
        <span>Verified</span>
      </BuiltinPage>,
    );

    const roots = document.querySelectorAll<HTMLElement>('[data-appsemble-page]');
    expect(roots).toHaveLength(1);
    expect(roots[0].tagName).toBe('MAIN');
    expect(roots[0].dataset.appsemblePage).toBe('verify');
    expect(roots[0].dataset.appsemblePageState).toBe('success');
  });

  it('should render the children in the content region', () => {
    renderPage(
      <BuiltinPage page="verify" state="success" title={title}>
        <span>Verified</span>
      </BuiltinPage>,
    );

    const content = document.querySelector('[data-grid-area="content"]')!;
    expect(content.textContent).toBe('Verified');
  });

  it('should render the title bar', () => {
    renderPage(
      <BuiltinPage page="verify" state="loading" title={title}>
        <span>Loading</span>
      </BuiltinPage>,
    );

    expect(screen.getByTestId('app-bar')).not.toBeNull();
  });

  it('should pass the app bar name it is given', () => {
    renderPage(
      <BuiltinPage appBarName="Settings" page="settings" state="default" title={title}>
        <span>Settings</span>
      </BuiltinPage>,
    );

    expect(screen.getByTestId('app-bar').textContent).toBe('Settings');
  });

  describe('without a layout', () => {
    it('should generate no grid css', () => {
      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      expect(generatedCss()).toBe('');
    });

    it('should render no heading', () => {
      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      expect(screen.queryByRole('heading')).toBeNull();
    });
  });

  describe('with a layout', () => {
    it('should render the page name as the only heading of the page', () => {
      mockApp({ builtinPages: titleAndContent });

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toBe('Verify your account');
      expect(heading.dataset.gridArea).toBe('title');
      expect(screen.getAllByRole('heading')).toHaveLength(1);
    });

    it('should place the regions through css scoped to the root', () => {
      mockApp({ builtinPages: titleAndContent });

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      const root = document.querySelector('[data-appsemble-page]')!;
      const className = [...root.classList].find((name) => name.startsWith('builtin-page-grid'))!;
      const css = generatedCss();
      expect(css).toContain(`.${className} > [data-grid-area="title"]`);
      expect(css).toContain(`.${className} > [data-grid-area="content"]`);
      expect(css).toContain('grid-template-areas: "title" "content"');
      expect(css).toContain('grid-template-rows: auto 1fr');
    });

    it('should render no heading for a layout that names content only', () => {
      mockApp({ builtinPages: contentOnly });

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      expect(screen.queryByRole('heading')).toBeNull();
      expect(document.querySelector('[data-grid-area="content"]')).not.toBeNull();
    });

    it('should keep the class the route makes public on the content region', () => {
      mockApp({ builtinPages: contentOnly });

      renderPage(
        <BuiltinPage className="appsemble-login" page="login" state="form" title={title}>
          <span>Login</span>
        </BuiltinPage>,
      );

      const content = document.querySelector('[data-grid-area="content"]')!;
      expect([...content.classList]).toContain('appsemble-login');
    });
  });

  describe('reserved grid areas', () => {
    it('should keep the bottom navigation and the banner outside a grid that does not place them', () => {
      mockApp({ navigation: 'bottom', builtinPages: contentOnly }, false);

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      const root = document.querySelector('[data-appsemble-page]')!;
      expect(root.contains(document.querySelector('nav.bottom-nav'))).toBe(false);
      expect(root.contains(screen.getByText(/verify your email address/))).toBe(false);
      expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
      expect(screen.getAllByText(/verify your email address/)).toHaveLength(1);
    });

    it('should render the bottom navigation and the banner inside a grid that places them', () => {
      mockApp({ navigation: 'bottom', builtinPages: withBannerAndNavigation }, false);

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      const root = document.querySelector('[data-appsemble-page]')!;
      expect(root.contains(document.querySelector('nav.bottom-nav'))).toBe(true);
      expect(root.contains(screen.getByText(/verify your email address/))).toBe(true);
      expect(document.querySelectorAll('nav.bottom-nav')).toHaveLength(1);
      expect(screen.getAllByText(/verify your email address/)).toHaveLength(1);
      expect(generatedCss()).toContain(
        'grid-template-areas: "resend-banner" "content" "bottom-navigation"',
      );
    });

    it('should render no bottom navigation in a grid when the app navigation is not bottom', () => {
      mockApp({ navigation: 'left-menu', builtinPages: withBannerAndNavigation });

      renderPage(
        <BuiltinPage page="verify" state="success" title={title}>
          <span>Verified</span>
        </BuiltinPage>,
      );

      expect(document.querySelector('nav.bottom-nav')).toBeNull();
    });
  });
});
