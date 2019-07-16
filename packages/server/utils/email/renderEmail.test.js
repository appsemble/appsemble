import fs from 'fs';
import path from 'path';

import renderEmail, { templateDir } from './renderEmail';

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

it.each(fs.readdirSync(templateDir).map(f => path.parse(f).name))(
  'should have tests for %s',
  name => {
    expect(tests).toHaveProperty(name);
    expect(tests[name].length).toBeGreaterThan(0);
  },
);

describe.each(Object.entries(tests))('%s', (name, testValues) => {
  it.each(testValues)(`should render ${name} %#`, async values => {
    const { text, html } = await renderEmail(name, values);
    expect(text).toMatchSnapshot('text');
    expect(html).toMatchSnapshot('html');
  });
});
