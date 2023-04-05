import { argv } from '../utils/argv';

export const getHost = (): string => {
  const { host } = argv;
  return host;
};
