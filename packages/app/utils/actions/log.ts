import { ActionCreator } from './index.js';

export const log: ActionCreator<'log'> = ({ definition: { level = 'info' } }) => [
  (data) => {
    // eslint-disable-next-line no-console
    console[level](data);
    return data;
  },
  { level },
];
