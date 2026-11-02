import { describe, expect, it } from 'vitest';

import { getNotificationStrategy } from './notifications.js';

describe('getNotificationStrategy', () => {
  it('should disable notifications when the field is omitted', () => {
    expect(getNotificationStrategy(undefined, ['Manager'])).toBe('none');
  });

  it('should apply a plain strategy to every member', () => {
    expect(getNotificationStrategy('login', ['Manager'])).toBe('login');
    expect(getNotificationStrategy('opt-in', [])).toBe('opt-in');
  });

  it('should apply the strategy of a listed role', () => {
    expect(getNotificationStrategy({ roles: { Manager: 'login' } }, ['Manager'])).toBe('login');
  });

  it('should apply none to unlisted roles without a default', () => {
    expect(getNotificationStrategy({ roles: { Manager: 'login' } }, ['Employee'])).toBe('none');
  });

  it('should apply the default to unlisted roles and members without a role', () => {
    const notifications = { default: 'opt-in', roles: { Manager: 'login' } } as const;
    expect(getNotificationStrategy(notifications, ['Employee'])).toBe('opt-in');
    expect(getNotificationStrategy(notifications, [])).toBe('opt-in');
  });

  it('should keep a listed role below the default at its own strategy', () => {
    expect(
      getNotificationStrategy({ default: 'login', roles: { Manager: 'opt-in' } }, ['Manager']),
    ).toBe('opt-in');
  });

  it('should apply the most eager strategy of a member with several roles', () => {
    const notifications = {
      roles: { Employee: 'opt-in', Manager: 'login', Guest: 'none' },
    } as const;
    expect(getNotificationStrategy(notifications, ['Guest', 'Manager', 'Employee'])).toBe('login');
    expect(getNotificationStrategy(notifications, ['Guest', 'Employee'])).toBe('opt-in');
  });

  it('should rank startup above login', () => {
    expect(
      getNotificationStrategy({ default: 'startup', roles: { Manager: 'login' } }, [
        'Manager',
        'Employee',
      ]),
    ).toBe('startup');
  });

  it('should apply the default to unlisted roles named after object properties', () => {
    expect(
      getNotificationStrategy({ default: 'login', roles: { User: 'none' } }, ['constructor']),
    ).toBe('login');
  });
});
