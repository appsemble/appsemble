import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Tab } from '../Tab/index.js';
import { Tabs } from './index.js';

it('should mark the tab matching the value as active', () => {
  render(
    <Tabs onChange={vi.fn()} value="b">
      <Tab value="a">A</Tab>
      <Tab value="b">B</Tab>
    </Tabs>,
  );
  expect(screen.getByText('A').parentElement!.classList.contains('is-active')).toBe(false);
  expect(screen.getByText('B').parentElement!.classList.contains('is-active')).toBe(true);
});

it('should emit the value of a clicked tab without following its link', () => {
  const onChange = vi.fn();
  render(
    <Tabs onChange={onChange} value="a">
      <Tab href="/a" value="a">
        A
      </Tab>
      <Tab href="/b" value="b">
        B
      </Tab>
    </Tabs>,
  );
  const link = screen.getByRole('link', { name: 'B' });
  expect(link.getAttribute('href')).toBe('/b');

  const notCancelled = fireEvent.click(link);
  expect(notCancelled).toBe(false);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'b');
});

it('should apply the tab modifiers', () => {
  const { container } = render(
    <Tabs boxed centered className="foo" id="tabs" onChange={vi.fn()} size="medium" value="a">
      <Tab value="a">A</Tab>
    </Tabs>,
  );
  const root = container.querySelector('#tabs')!;
  for (const name of ['tabs', 'foo', 'is-boxed', 'is-centered', 'is-medium']) {
    expect(root.classList.contains(name)).toBe(true);
  }
});
