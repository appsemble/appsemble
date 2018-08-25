/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param {string[]} scopes The scopes to check against.
 * @param {Object} user The user to verify.
 * @returns {boolean} Wether or not the user has access to any of the given scopes.
 */
export default function checkScope(scopes, user) {
  if (!scopes) {
    return true;
  }
  if (scopes.includes('*')) {
    return !!user;
  }
  // XXX implement scope based authentication.
  return false;
}
