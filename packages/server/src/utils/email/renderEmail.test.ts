import { promises as fs, readdirSync } from 'fs';
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
    { greeting: 'Hello User', url: 'https://example.com' },
    { greeting: 'Hello', url: 'https://example.com' },
  ],
  reset: [
    { greeting: 'Hello User', url: 'https://example.com' },
    { greeting: 'Hello', url: 'https://example.com' },
  ],
  welcome: [
    { greeting: 'Hello User', url: 'https://example.com' },
    { greeting: 'Hello', url: 'https://example.com' },
  ],
};

it.each(readdirSync(join(assetDir, 'email')).map((f) => parse(f).name))(
  'should have tests for %s',
  (name) => {
    expect(tests).toHaveProperty(name);
    expect(tests[name as keyof typeof tests].length).toBeGreaterThan(0);
  },
);

describe.each(Object.entries(tests))('%s', (name, testValues) => {
  it.each(testValues)(`should render ${name} %#`, async (values) => {
    const template = await fs.readFile(join(assetDir, 'email', `${name}.md`), 'utf8');
    const { html, text } = await renderEmail(template, values);
    expect(text).toMatchSnapshot('text');
    expect(html).toMatchSnapshot('html');
  });
});
