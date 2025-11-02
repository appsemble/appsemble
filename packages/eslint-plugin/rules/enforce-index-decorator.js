import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(() => 'https://gitlab.com/appsemble/appsemble');

export const rule = createRule({
  name: 'enforce-index-decorator',
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
  defaultOptions: [],
  create(context) {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Decorator(node) {
        const { expression } = node;
        const { range } = expression;

        function reportProblemWithFix() {
          context.report({
            node,
            messageId: 'preferIndex',
            fix(fixer) {
              return fixer.replaceTextRange(range, 'Index({ unique: true })');
            },
          });
        }

        // Check for `@Unique` decorator
        if (expression.type === 'Identifier' && expression.name === 'Unique') {
          reportProblemWithFix();
        }

        // Check for `@Unique()` decorator
        if (expression.type === 'CallExpression') {
          const { callee } = expression;
          if (callee.type === 'Identifier' && callee.name === 'Unique') {
            reportProblemWithFix();
          }
        }
      },
    };
  },
});
