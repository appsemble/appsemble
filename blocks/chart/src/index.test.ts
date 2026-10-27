// @vitest-environment jsdom

import { type BootstrapParams, type Remapper } from '@appsemble/sdk';
import { screen, within } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

// Jsdom can't draw on a canvas, so the chart keeps its data without rendering it.
vi.mock('chart.js', () => ({
  BarController: {},
  BarElement: {},
  CategoryScale: {},
  Chart: class {
    static register(): void {
      // Nothing to register without rendering.
    }

    data: unknown;

    constructor(context: unknown, config: { data: unknown }) {
      this.data = config.data;
    }

    update(): void {
      // Nothing to draw.
    }
  },
  Legend: {},
  LinearScale: {},
  LineController: {},
  LineElement: {},
  PointElement: {},
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => void;

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => document.body.replaceChildren());

interface SetupOptions {
  description?: Remapper;
  onClick?: (data: unknown) => void;
}

function renderChart({ description, onClick }: SetupOptions = {}): (data: unknown) => void {
  const host = document.createElement('div');
  document.body.append(host);
  let replace: (data: unknown) => void = () => null;
  mount({
    actions: {
      onClick: Object.assign(onClick ?? (() => null), { type: onClick ? 'dialog' : 'noop' }),
    },
    events: {
      on: {
        add: () => true,
        replace(callback: (data: unknown) => void) {
          replace = callback;
          return true;
        },
      },
    },
    parameters: { description, labels: ['Monday', 'Tuesday'], type: 'bar', yAxis: {} },
    shadowRoot: host,
    theme: { primaryColor: '#123456' },
    utils: {
      formatMessage: (message: string) => message,
      remap: (remapper: Remapper) => remapper,
    },
  } as unknown as BootstrapParams);
  return replace;
}

it('names the chart image after its description', () => {
  renderChart({ description: 'Visitors per day' });

  expect(screen.getByRole('img', { name: 'Visitors per day' })).toBeDefined();
});

it('gives the chart image a generic name without a description', () => {
  renderChart();

  expect(screen.getByRole('img', { name: 'chart' })).toBeDefined();
});

it('offers the chart data as a table', () => {
  renderChart({ description: 'Visitors per day' })([
    { label: 'Adults', data: [3, 5] },
    { label: 'Children', data: [1, 2] },
  ]);

  const table = screen.getByRole('table', { name: 'Visitors per day' });
  const tuesday = within(table).getByRole('row', { name: /Tuesday/ });

  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent),
  ).toStrictEqual(['Adults', 'Children']);
  expect(
    within(tuesday)
      .getAllByRole('cell')
      .map((cell) => cell.textContent),
  ).toStrictEqual(['5', '2']);
  expect(within(table).queryByRole('button')).toBeNull();
});

it('launches the click action for a value from the keyboard', async () => {
  const onClick = vi.fn();
  renderChart({ onClick })([{ label: 'Adults', data: [3, 5] }]);

  await userEvent.tab();
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');

  expect(onClick).toHaveBeenCalledWith({ label: 'Tuesday', value: 5 });
});
