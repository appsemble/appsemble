import fa from '@fortawesome/fontawesome-free/package.json';
import bulma from 'bulma/package.json';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    export interface Chainable {
      /**
       * Perform a login in Appsemble Studio using a user flow.
       *
       * @param redirect The URL to navigate to after logging in.
       */
      login: (redirect: string) => void;

      /**
       * Intercept and wait for an API call to have finished.
       *
       * @param params Object containing the method and url of the API method.
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

      /**
       * Visit an app and wait for it to have been cached.
       */
      visitApp: (cached: boolean, appPath: string, options?: Partial<Cypress.VisitOptions>) => void;

      /**
       * Login to an Appsemble app.
       */
      loginApp: () => void;
    }
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
  cy.get('.appsemble-loader', { includeShadowDom: true, timeout: 8e3 }).should('not.exist');
});

Cypress.Commands.add('visitAndWaitForCss', (url, options) => {
  cy.intercept({ method: 'GET', pathname: `/bulma/${bulma.version}/bulma.min.css` }).as('bulma');
  cy.intercept({ method: 'GET', pathname: `/fa/${fa.version}/css/all.min.css` }).as('fa');
  cy.visit(url, options);
  cy.wait(['@bulma', '@fa']);
});

Cypress.Commands.add('visitApp', (cached, appPath) => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//${appPath}.appsemble.${host}`;

  if (cached) {
    cy.visit(url);
  } else {
    cy.visitAndWaitForCss(url);
  }
  cy.waitForAppLoaded();
});

Cypress.Commands.add('loginApp', () => {
  cy.get('.appsemble-loader').should('not.exist');
  cy.get('.appsemble-login > button').click();
  cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
  cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
  cy.get('button[type="submit"]').click();
  cy.get('.has-text-centered > .button.is-primary').click();
  cy.waitForAppLoaded();
});
