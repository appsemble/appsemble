import { type ActionCreator } from './index.js';

export const scroll: ActionCreator<'scroll'> = ({ definition: { to } }) => [
  (data) => {
    window.scrollTo({
      top: to === 'top' ? 0 : document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
    return data;
  },
];
