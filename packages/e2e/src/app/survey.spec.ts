describe('Survey app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//survey.appsemble.${host}`;

  it('should match a screenshot in desktop mode', () => {
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
    cy.matchImageSnapshot();
  });
});
