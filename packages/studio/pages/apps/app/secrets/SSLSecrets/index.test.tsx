import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SSLSecrets } from './index.js';

vi.mock('../../index.js', () => ({
  useApp: () => ({ app: { id: 42, domain: 'app.example' } }),
}));

const transport = axios.defaults.adapter;
let updates: Record<string, unknown>[];

beforeEach(() => {
  updates = [];
  axios.defaults.adapter = (config) => {
    if (config.method === 'put') {
      updates.push(JSON.parse(config.data));
    }
    const data = { certificate: 'certificate', incomplete: false };
    return Promise.resolve({ config, data, headers: {}, status: 200, statusText: 'OK' });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderPage(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <SSLSecrets />
    </IntlProvider>,
  );
}

async function submit(certificate: string, key: string): Promise<Record<string, unknown>> {
  renderPage();
  fireEvent.change(await screen.findByLabelText(/SSL certificate/), {
    target: { value: certificate },
  });
  fireEvent.change(screen.getByLabelText(/SSL private key/), { target: { value: key } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  await waitFor(() => expect(updates).toHaveLength(1));
  return updates[0];
}

it('should show that a private key is set without showing it', async () => {
  renderPage();

  expect(await screen.findByLabelText(/SSL private key/)).toHaveProperty('value', '');
  expect(
    screen.getByText(
      'A private key is set. Leave empty to keep it, or enter a new one in PEM format to replace it.',
    ),
  ).toBeDefined();
});

it('should keep the stored private key when the key field is left empty', async () => {
  expect(await submit('new certificate', '')).toStrictEqual({ certificate: 'new certificate' });
});

it('should replace the private key with a new value', async () => {
  expect(await submit('new certificate', 'new key')).toStrictEqual({
    certificate: 'new certificate',
    key: 'new key',
  });
});

it('should clear the private key together with the certificate', async () => {
  expect(await submit('', '')).toStrictEqual({ certificate: '', key: '' });
});
