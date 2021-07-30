// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Cypress {
  export interface Chainable {
    /**
     * Perform a login in Appsemble Studio using a user flow.
     *
     * @param redirect - The URL to navigate to after logging in.
     */
    login: (redirect: string) => void;

    /**
     * Intercept and wait for an API call to have finished.
     *
     * @param params - Object containing the method and url of the API method.
     */
    waitForAPICall: (params: { method?: string; url: string }) => void;

    /**
     * Helper function to wait until the app is loaded.
     */
    waitForAppLoaded: () => void;

    /**
     * Helper function to wait until an app’s styling is loaded.
     */
    visitAndWaitForCss: (url: string, options?: Partial<Cypress.VisitOptions>) => void;
  }
}

Cypress.Commands.add('login', (redirect) => {
  cy.visit('/en/login', { qs: { redirect } });
  cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
  cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
  cy.get('[type="submit"]').click();
  cy.location('pathname').should('equal', redirect);
});

Cypress.Commands.add('waitForAPICall', ({ method = 'GET', url }) => {
  cy.intercept({ url, method, times: 1 }).as('waitForAPICall');
  cy.wait('@waitForAPICall');
});

Cypress.Commands.add('waitForAppLoaded', () => {
  cy.get('[data-block]').should('exist');
  cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
});

Cypress.Commands.add(
  'visitAndWaitForCss',
  (url: string, options?: Partial<Cypress.VisitOptions>) => {
    cy.intercept({ method: 'GET', url: '*bulma/0.9.3/bulma.min.css' }).as('bulma');
    cy.intercept({ method: 'GET', url: '*fa/5.15.3/css/all.min.css' }).as('fa');
    cy.visit(url, options);
    cy.wait(['@bulma', '@fa']);
  },
);
