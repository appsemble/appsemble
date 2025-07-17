type Methods = 'delete' | 'get' | 'patch' | 'post' | 'put';

/**
 * Common HTTP methods, but either all upper case or all lower case.
 */
export type HTTPMethods = Methods | Uppercase<Methods>;
