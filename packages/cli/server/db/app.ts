let appDir = '/';

export const getAppDir = (): string => appDir;

export const setAppDir = (appName: string): void => {
  appDir = `/${appName}`;
};
