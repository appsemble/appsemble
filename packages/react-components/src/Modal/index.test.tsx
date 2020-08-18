import { shallow } from 'enzyme';
import React from 'react';

import { Modal } from '.';

jest.mock('react-intl', () => {
  const reactIntl = jest.requireActual('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

it('should not render a bulma modal when it is inactive', () => {
  const wrapper = shallow(<Modal isActive={false}>test</Modal>);
  expect(wrapper).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const wrapper = shallow(<Modal isActive>test</Modal>);
  expect(wrapper).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.delete').simulate('click');
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('click');
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal escape is pressed on the background', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith(expect.any(Object));
});

it('should not close the modal another key is pressed on the background', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Space' });
  expect(onClose).not.toHaveBeenCalled();
});
