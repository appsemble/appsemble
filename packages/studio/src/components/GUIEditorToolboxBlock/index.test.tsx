import { Loader } from '@appsemble/react-components';
import { shallow } from 'enzyme';
import React from 'react';

import GUIEditorToolboxBlock, { Block } from '.';

const blocks: Block[] = [
  {
    id: 'map',
    description: 'map description',
    iconName: 'map',
  },
  {
    id: 'navigation',
    description: 'navigation description',
    iconName: 'route',
  },
  {
    id: 'markdown',
    description: 'markdown description',
    iconName: 'font',
  },
];

describe('<GUIEditorToolboxBlock /> rendering', () => {
  let wrapper: any;

  describe('with no properties', () => {
    beforeEach(() => {
      wrapper = shallow(<GUIEditorToolboxBlock />);
    });

    it('should render <Loader /> without given blocks', () => {
      expect(<Loader />).toMatchSnapshot();
    });

    it('should not render a div', () => {
      expect(wrapper.find('div')).toHaveLength(0);
    });
  });

  describe('with blocks values', () => {
    const initialProps = {
      blocks,
      initialSelectedBlock: '',
      selectedBlock(): void {},
    };

    beforeEach(() => {
      wrapper = shallow(<GUIEditorToolboxBlock {...initialProps} />);
    });

    it('should render a div with the main class', () => {
      expect(wrapper.find('.main')).toHaveLength(1);
    });

    it('should render a div with blockframe class for every found block', () => {
      expect(wrapper.find('.blockFrame')).toHaveLength(blocks.length);
    });

    it('should render an icon for every block', () => {
      expect(wrapper.find('Icon')).toHaveLength(blocks.length);
    });

    it('should render the title for every block', () => {
      expect(wrapper.find('h2')).toHaveLength(blocks.length);
    });

    it('should change block class to blockFrameSelected when clicked', () => {
      wrapper.find('.blockFrame').last().simulate('click');
      expect(wrapper.find('.blockFrameSelected')).toHaveLength(1);
      expect(wrapper).toMatchSnapshot();
    });
  });
});
