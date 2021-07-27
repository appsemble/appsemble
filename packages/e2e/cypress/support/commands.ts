import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

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

Cypress.Commands.add('waitForAppLoaded', (redirect) => {
  cy.visit('/en/login', { qs: { redirect } });
  cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
  cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
  cy.get('[type="submit"]').click();
  cy.location('pathname').should('equal', redirect);
});

addMatchImageSnapshotCommand({
  capture: 'viewport',
  failureThreshold: 0,
  failureThresholdType: 'percent',
  customDiffConfig: { threshold: 0 },
});
