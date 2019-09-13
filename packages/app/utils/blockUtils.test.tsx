import { blockToString, normalizeBlockName, prefixURL } from './blockUtils';

describe('normalizeBlockName', () => {
  it('should prepend @appsemble if no organization is prepended', () => {
    const blockName = 'form';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(`@appsemble/${blockName}`);
  });

  it('should leave block name intact if organization is prepended', () => {
    const blockName = '@example/test';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(blockName);
  });
});

describe('blockToString', () => {
  it('should append the version to the block name', () => {
    const input = { type: '@appsemble/test', version: '1.0.0' };
    const result = blockToString(input);

    expect(result).toBe(`${input.type}@${input.version}`);
  });
});

describe('prefixURL', () => {
  it('should populate the API url with block properties', () => {
    const block = { type: '@appsemble/test', version: '1.0.0' };
    const url = 'test.css';

    const result = prefixURL(block, url);
    expect(result).toBe(`/api/blocks/${block.type}/versions/${block.version}/${url}`);
  });
});
