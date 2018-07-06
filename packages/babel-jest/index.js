const babel = require('@babel/core');


module.exports = {
  process(src, filename) {
    const result = babel.transformSync(src, {
      envName: 'jest',
      sourceFileName: filename,
      sourceMaps: 'inline',
    });
    return result;
  },
};
