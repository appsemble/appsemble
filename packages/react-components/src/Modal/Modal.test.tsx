import { shallow } from 'enzyme';
import React from 'react';
import { createIntl, IntlShape } from 'react-intl';

import Modal from './Modal';

let intl: IntlShape;

beforeEach(() => {
  intl = createIntl({ locale: 'en' });
});

it('should not render a bulma modal when it is inactive', () => {
  const wrapper = shallow(
    <Modal intl={intl} isActive={false} onClose={() => {}}>
      test
    </Modal>,
  );
  expect(wrapper).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={() => {}}>
      test
    </Modal>,
  );
  expect(wrapper).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.delete').simulate('click');
  expect(onClose).toHaveBeenCalled();
});

it('should close the modal when the background is clicked', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('click');
  expect(onClose).toHaveBeenCalled();
});

it('should close the modal escape is pressed on the background', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});

it('should not close the modal another key is pressed on the background', () => {
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Space' });
  expect(onClose).not.toHaveBeenCalled();
});
