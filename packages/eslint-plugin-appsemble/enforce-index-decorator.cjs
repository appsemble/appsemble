module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce usage of `@Index` decorator over `@Unique` decorator',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferIndex:
        'Usage of `@Unique` decorator is not allowed. Use `@Index` decorator instead with unique true.',
    },
  },
  create(context) {
    return {
      Decorator(node) {
        // Check for `@Unique` decorator
        if (node.expression && node.expression.name === 'Unique') {
          context.report({
            node,
            messageId: 'preferIndex',
          });
        }
      },
    };
  },
};
