/**
 * Perform a login in Appsemble Studio using a user flow.
 *
 * @param redirect - The URL to navigate to after logging in.
 */
export function login(redirect: string): void {
  cy.visit('/en/login', { qs: { redirect } });
  cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
  cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
  cy.get('[type="submit"]').click();
  cy.location('pathname').should('equal', redirect);
}

/**
 * Intercept and wait for an API call to have finished.
 *
 * @param params - Object containing the method and url of the API method.
 */
export function waitForAPICall({ method = 'GET', url }: { method?: string; url: string }): void {
  cy.intercept({ url, method, times: 1 }).as('waitForAPICall');
  cy.wait('@waitForAPICall');
}
