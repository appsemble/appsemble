import commandDirOptions from './commandDirOptions';

it('should handle ts files', () => {
  const [dir, options] = commandDirOptions('/usr/lib/node_modules/example/module.ts');
  expect(dir).toBe('/usr/lib/node_modules/example/module');
  expect(options).toStrictEqual({ extensions: ['ts'] });
});

it('should handle js files', () => {
  const [dir, options] = commandDirOptions('/usr/share/lib/node_modules/compiled/index.js');
  expect(dir).toBe('/usr/share/lib/node_modules/compiled/index');
  expect(options).toStrictEqual({ extensions: ['js'] });
});
