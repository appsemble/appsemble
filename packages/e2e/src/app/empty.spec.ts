describe('Empty app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//empty.appsemble.${host}`;

  beforeEach(() => {
    cy.intercept({ method: 'GET', times: 1, url: '*bulma/0.9.3/bulma.min.css' }).as('bulma');
    cy.intercept({ method: 'GET', times: 1, url: '*fa/5.15.3/css/all.min.css' }).as('fa');
    cy.visit(url);
    cy.wait(['@bulma', '@fa']);
    cy.waitForAppLoaded();
  });

  it('should match a screenshot in desktop mode', () => {
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader').should('not.exist');
    cy.matchImageSnapshot();
  });

  it('should navigate to the second page and back', () => {
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader').should('not.exist');
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page B');
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page A');
  });
});
