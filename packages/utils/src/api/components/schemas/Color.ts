export default {
  description: 'A hexadecimal rgb color code without an alpha layer.',
  type: 'string',
  pattern: /^#[a-fA-F\d]{6}$/.source,
  example: '#00a43b',
};
