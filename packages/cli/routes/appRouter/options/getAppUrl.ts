export const getAppUrl = (): Promise<URL> => {
  const url = new URL('http://localhost:8080');
  return Promise.resolve(url);
};
