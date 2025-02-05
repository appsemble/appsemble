import { fireEvent, render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ModalCard } from './index.js';

it('should not render a bulma modal when it is inactive', () => {
  const { container } = render(<ModalCard isActive={false}>test</ModalCard>);
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(<ModalCard isActive>test</ModalCard>);
  expect(container).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = vi.fn();
  const { getByLabelText } = render(
    <ModalCard closeButtonLabel="Test close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  getByLabelText('Test close').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  getByRole('presentation').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal escape is pressed on the background', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  fireEvent.keyDown(getByRole('presentation'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal another key is pressed on the background', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  fireEvent.keyDown(getByRole('presentation'));
  expect(onClose).not.toHaveBeenCalled();
});
