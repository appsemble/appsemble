// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { type FunctionComponent } from 'preact';
import { expect, it, vi } from 'vitest';

const preact = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/preact', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/preact')>()),
  bootstrap: preact.bootstrap,
}));

await import('./index.js');

const BarcodeScan = preact.bootstrap.mock.calls[0][0] as FunctionComponent<BlockProps>;

it('should label the selects and announce the scanned barcode', () => {
  const props = {
    ...getDefaultBootstrapParams(),
    parameters: { barcodeType: 'multiple', patchSize: 'multiple', showBarcode: true },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <BarcodeScan {...props} />
    </Context.Provider>,
  );

  expect(screen.getByRole('combobox', { name: 'barcodeType' })).toBeDefined();
  expect(screen.getByRole('combobox', { name: 'patchSize' })).toBeDefined();
  expect(screen.getByRole('status').textContent).toContain('Barcode');
});
