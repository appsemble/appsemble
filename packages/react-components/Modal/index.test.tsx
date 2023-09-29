import { fireEvent, render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Modal } from './index.js';

vi.mock('react-intl', async () => {
  const reactIntl = (await vi.importActual('react-intl')) as typeof import('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

it('should not render a bulma modal when it is inactive', () => {
  const { container } = render(<Modal isActive={false}>test</Modal>);
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(<Modal isActive>test</Modal>);
  expect(container).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = vi.fn();
  const { getByLabelText } = render(
    <Modal closeButtonLabel="Test close" isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  getByLabelText('Test close').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <Modal isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  getByRole('presentation').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal escape is pressed on the background', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <Modal isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  fireEvent.keyDown(getByRole('presentation'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal another key is pressed on the background', () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <Modal isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  fireEvent.keyDown(getByRole('presentation'));
  expect(onClose).not.toHaveBeenCalled();
});
