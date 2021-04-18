const { DUMPIO = 'false', HEADLESS = 'true' } = process.env;

module.exports = {
  browserContext: 'incognito',
  launch: {
    dumpio: DUMPIO === 'true',
    headless: HEADLESS === 'true',
  },
};
