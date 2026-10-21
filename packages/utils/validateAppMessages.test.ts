import { type AppDefinition } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { AppMessageValidationError, validateMessageSlugs } from './validateAppMessages.js';

const app = {
  name: 'Test App',
  defaultPage: 'Home',
  pages: [
    { name: 'Home', blocks: [] },
    { name: 'Tasks', blocks: [] },
    {
      name: 'Reports',
      type: 'container',
      pages: [{ name: 'Daily Report', blocks: [] }],
    },
  ],
} as AppDefinition;

function layer(messages: Record<string, string>): { app: Record<string, string> } {
  return { app: messages };
}

describe('validateMessageSlugs', () => {
  it('should accept an app without stored messages', () => {
    expect(() => validateMessageSlugs(app, 'nl', [])).not.toThrow();
  });

  it('should treat empty values as untranslated', () => {
    const messages = layer({ 'pages.home': '', 'pages.tasks': '', 'routes.Login': '' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).not.toThrow();
  });

  it('should accept distinct translated page names and route segments', () => {
    const messages = layer({
      'pages.home': 'Thuis',
      'pages.tasks': 'Taken',
      'pages.daily-report': 'Dagrapport',
      'routes.Login': 'InLoggen',
      'routes.Settings': 'Instellingen',
    });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).not.toThrow();
  });

  it('should keep the canonical URL segment for a translated page name without Latin characters', () => {
    const messages = layer({ 'pages.home': 'Главная', 'pages.tasks': 'Задачи' });

    expect(() => validateMessageSlugs(app, 'ru', [messages])).not.toThrow();
  });

  it('should reject a translated page name whose canonical fallback collides with another page', () => {
    const messages = layer({ 'pages.home': 'Главная', 'pages.tasks': 'Home' });

    expect(() => validateMessageSlugs(app, 'ru', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “ru”: pages “Home” and “Tasks” share the URL segment “home”',
      ),
    );
  });

  it('should reject a translated page name with the debug URL segment', () => {
    const messages = layer({ 'pages.home': 'Debug' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: the translated name of page “Home” has the reserved URL segment “debug”',
      ),
    );
  });

  it('should reject two pages with the same translated URL segment', () => {
    const messages = layer({ 'pages.home': 'Work', 'pages.tasks': 'Work' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: pages “Home” and “Tasks” share the URL segment “work”',
      ),
    );
  });

  it('should reject a translated URL segment equal to the canonical segment of another page', () => {
    const messages = layer({ 'pages.tasks': 'Home' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: pages “Home” and “Tasks” share the URL segment “home”',
      ),
    );
  });

  it('should check pages inside containers', () => {
    const messages = layer({ 'pages.daily-report': 'Tasks' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: pages “Tasks” and “Daily Report” share the URL segment “tasks”',
      ),
    );
  });

  it('should ignore stale page keys that no longer map to a page', () => {
    const messages = layer({ 'pages.old-page': 'Home' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).not.toThrow();
  });

  it('should reject a route segment that does not start with an uppercase letter', () => {
    const messages = layer({ 'routes.Login': 'inloggen' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: the URL segment “inloggen” of route “Login” must start with an uppercase letter and may only contain letters, digits and hyphens',
      ),
    );
  });

  it('should reject a route segment with characters outside letters, digits and hyphens', () => {
    const messages = layer({ 'routes.Login': 'In Loggen' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(AppMessageValidationError);
  });

  it('should reject the Callback segment for a route', () => {
    const messages = layer({ 'routes.Login': 'Callback' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: the URL segment “Callback” of route “Login” is reserved',
      ),
    );
  });

  it('should reject the debug segment for a route in any case', () => {
    const messages = layer({ 'routes.Login': 'Debug' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: the URL segment “Debug” of route “Login” is reserved',
      ),
    );
  });

  it('should reject a route segment equal to the English name of another route', () => {
    const messages = layer({ 'routes.Login': 'Settings' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: routes “Login” and “Settings” share the URL segment “Settings”',
      ),
    );
  });

  it('should reject a route segment equal to the translated segment of another route', () => {
    const messages = layer({ 'routes.Login': 'Account', 'routes.Settings': 'Account' });

    expect(() => validateMessageSlugs(app, 'nl', [messages])).toThrow(
      new AppMessageValidationError(
        'Language “nl”: routes “Login” and “Settings” share the URL segment “Account”',
      ),
    );
  });

  it('should resolve the segments from all layers in order', () => {
    const base = layer({ 'pages.home': 'Work' });
    const regional = layer({ 'pages.tasks': 'Work' });

    expect(() => validateMessageSlugs(app, 'nl', [base])).not.toThrow();
    expect(() => validateMessageSlugs(app, 'nl-be', [regional])).not.toThrow();
    expect(() => validateMessageSlugs(app, 'nl-be', [base, regional])).toThrow(
      new AppMessageValidationError(
        'Language “nl-be”: pages “Home” and “Tasks” share the URL segment “work”',
      ),
    );
  });

  it('should let a regional layer override the base layer', () => {
    const base = layer({ 'pages.home': 'Work', 'pages.tasks': 'Taken' });
    const regional = layer({ 'pages.home': 'Thuis', 'pages.tasks': 'Work' });

    expect(() => validateMessageSlugs(app, 'nl-be', [base, regional])).not.toThrow();
  });
});
