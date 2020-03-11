export default {
  name: 'endpoint',
  in: 'query',
  description: 'The URL of the endpoint associated with the subscription.',
  required: true,
  schema: { type: 'string', format: 'uri' },
};
