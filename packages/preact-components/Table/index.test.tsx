import { render, screen } from '@testing-library/preact';
import { type VNode } from 'preact';
import { expect, it } from 'vitest';

import { Table } from './index.js';

function Rows(): VNode {
  return (
    <tbody>
      <tr>
        <td>Cell</td>
      </tr>
    </tbody>
  );
}

it('should render a full width, hoverable, striped table by default', () => {
  render(
    <Table className="foo">
      <Rows />
    </Table>,
  );
  const table = screen.getByRole('table');
  expect(table.className).toBe('table is-fullwidth is-hoverable is-striped');
  expect(table.parentElement!.className).toBe('table-container foo');
  expect(screen.getByRole('cell').textContent).toBe('Cell');
});

it('should apply the table modifiers', () => {
  render(
    <Table bordered fullwidth={false} hoverable={false} narrow striped={false}>
      <Rows />
    </Table>,
  );
  expect(screen.getByRole('table').className).toBe('table is-bordered is-narrow');
});
