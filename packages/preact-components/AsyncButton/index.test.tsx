import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { AsyncButton } from './index.js';

it('should be busy while the action is pending', async () => {
  let finish!: () => void;
  render(
    <AsyncButton
      onClick={() =>
        new Promise((resolve) => {
          finish = resolve;
        })
      }
    >
      Save
    </AsyncButton>,
  );
  const button = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;

  fireEvent.click(button);
  await waitFor(() => expect(button.disabled).toBe(true));
  expect(button.classList.contains('is-loading')).toBe(true);

  finish();
  await waitFor(() => expect(button.disabled).toBe(false));
  expect(button.classList.contains('is-loading')).toBe(false);
});

it('should stay disabled when disabled by the caller', () => {
  render(
    <AsyncButton disabled onClick={() => Promise.resolve()}>
      Save
    </AsyncButton>,
  );
  expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
});
