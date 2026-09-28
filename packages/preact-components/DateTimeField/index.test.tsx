import { type BlockProps, Context } from '@appsemble/preact';
import { fa, resolveIcon } from '@appsemble/web-utils';
import { render } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it } from 'vitest';

import { DateTimeField } from './index.js';
import { getDescription } from '../FormComponent/getDescription.js';

const block = {
  utils: { fa, remap: () => '', resolveIcon: (reference: string) => resolveIcon(reference) },
} as unknown as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

it('should mark the alternative input as invalid and describe it by the error', () => {
  const { container, rerender } = render(
    <DateTimeField
      altInput
      help="Pick a date"
      id="date"
      label="Date"
      locale="en"
      name="date"
      value=""
    />,
    { wrapper: Provider },
  );
  const visibleInput = container.querySelector('input:not([type="hidden"])') as HTMLInputElement;
  expect(visibleInput.getAttribute('aria-invalid')).toBeNull();
  expect(getDescription(visibleInput)).toBe('Pick a date');

  rerender(
    <DateTimeField
      altInput
      error="Date is required"
      help="Pick a date"
      id="date"
      label="Date"
      locale="en"
      name="date"
      value=""
    />,
  );
  expect(visibleInput.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(visibleInput)).toBe('Date is required');
});
