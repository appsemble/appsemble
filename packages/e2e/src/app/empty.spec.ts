describe('Empty app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//empty.appsemble.${host}`;

  it('should match a screenshot in desktop mode', () => {
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader').should('not.exist');
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader').should('not.exist');
    cy.matchImageSnapshot();
  });

  it('should navigate to the second page and back', () => {
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader').should('not.exist');
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page B');
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page A');
  });
});
