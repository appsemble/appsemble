import { type RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { type ESLint } from 'eslint';
import { rules } from './rules/index.js';

type RuleKey = keyof typeof rules;

interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, RuleModule<any, any, any>>;
}

const plugin: Plugin = {
  meta: {
    name: '@appsemble/eslint-plugin',
    version: '0.0.1',
  },
  rules,
};

export default plugin;
