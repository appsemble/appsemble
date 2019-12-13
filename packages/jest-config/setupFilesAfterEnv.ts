import { setLogLevel } from '@appsemble/node-utils';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

configure({ adapter: new Adapter() });

jest.setTimeout(10000);
