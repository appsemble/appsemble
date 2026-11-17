import { type AppDefinition } from '@appsemble/lang-sdk';
import { type AppMemberInfo } from '@appsemble/types';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DemoLogin } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';
import { IconTestWrapper } from '../../utils/test-utils.js';

const definition = {
  name: 'Test App',
  defaultPage: 'Home',
  security: { default: { role: 'Employee' }, roles: { Employee: {}, Manager: {} } },
  pages: [{ name: 'Home', blocks: [] }],
} as AppDefinition;

function mockDemoAppMembers(demoAppMembers: AppMemberInfo[]): void {
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    demoAppMembers,
    refetchDemoAppMembers: vi.fn(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DemoLogin', () => {
  it('should select the first demo member when the demo members load after the form', () => {
    vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({ definition } as never);
    vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({ demoLogin: vi.fn() } as never);
    vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
      getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
        format: () => defaultMessage,
      }),
    } as never);
    mockDemoAppMembers([]);
    const { rerender } = render(
      <IntlProvider locale="en">
        <DemoLogin />
      </IntlProvider>,
      { wrapper: IconTestWrapper },
    );

    mockDemoAppMembers([
      { sub: 'alice', name: 'Alice', roles: ['Employee'] },
      { sub: 'bob', name: 'Bob', roles: ['Manager'] },
    ] as AppMemberInfo[]);
    rerender(
      <IntlProvider locale="en">
        <DemoLogin />
      </IntlProvider>,
    );

    expect(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Select an app member to login as' })
        .selectedOptions[0].textContent,
    ).toBe('Alice');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Login' }).disabled).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Create account' }).disabled).toBe(
      false,
    );
  });
});
