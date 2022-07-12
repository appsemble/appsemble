import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, parse } from 'path';

import { assetDir } from '../readAsset';
import { renderEmail } from './renderEmail';

const tests = {
  emailAdded: [
    { greeting: 'Hello User', url: 'https://example.com' },
    { greeting: 'Hello', url: 'https://example.com' },
  ],
  organizationInvite: [
    { greeting: 'Hello User', url: 'https://example.com', organization: 'winners' },
    { greeting: 'Hello', url: 'https://example.com', organization: 'winners' },
  ],
  resend: [
    { greeting: 'Hello User', url: 'https://example.com', name: 'The Appsemble Team' },
    { greeting: 'Hello', url: 'https://example.com', name: 'The Appsemble Team' },
  ],
  reset: [
    { greeting: 'Hello User', url: 'https://example.com', name: 'The Appsemble Team' },
    { greeting: 'Hello', url: 'https://example.com', name: 'The Appsemble Team' },
  ],
  welcome: [
    { greeting: 'Hello User', url: 'https://example.com' },
    { greeting: 'Hello', url: 'https://example.com' },
  ],
  welcomeMember: [
    { greeting: 'Hello User', url: 'https://example.com', name: 'Example App' },
    { greeting: 'Hello', url: 'https://example.com', name: 'Example App' },
  ],
  appMemberEmailChange: [
    { greeting: 'Hello User', url: 'https://example.com', name: 'Example App' },
    { greeting: 'Hello', url: 'https://example.com', name: 'Example App' },
  ],
  teamInvite: [{ teamName: 'Test Team', appName: 'Test App', url: 'https://example.com' }],
};

it.each(readdirSync(join(assetDir, 'email')).map((f) => parse(f).name))(
  'should have tests for %s',
  (name) => {
    expect(tests).toHaveProperty(name);
    expect(tests[name as keyof typeof tests].length).toBeGreaterThan(0);
  },
);

describe.each(Object.entries(tests))('%s', (name, testValues: Record<string, any>[]) => {
  it.each(testValues)(`should render ${name} %#`, async (values) => {
    const template = await readFile(join(assetDir, 'email', `${name}.md`), 'utf8');
    const { html, text } = await renderEmail(template, values);
    expect(text).toMatchSnapshot('text');
    expect(html).toMatchSnapshot('html');
  });
});
