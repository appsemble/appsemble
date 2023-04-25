import { argv } from '../utils/argv.js';

export const getHost = (): string => {
  const { host } = argv;
  return host;
};
