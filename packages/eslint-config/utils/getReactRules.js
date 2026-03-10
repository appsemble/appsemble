import rules from '../rules/react.js';

/**
 * Get rules from `eslint-plugin-react` for a given context.
 *
 * @param {string} context One of `'jsx'`, `'preact'`, or `'react'`.
 * @returns {{ rule: string, severity: 'off'|'warn'|'error' }} React rules for the given context
 */
export function getReactRules(context) {
  const contextRules = {};
  for (const [rule, config] of Object.entries(rules)) {
    if (config[context] !== 'off') {
      contextRules[rule] = config[context];
    }
  }
  return contextRules;
}
