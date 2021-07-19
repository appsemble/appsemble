describe('/', () => {
  it('should allow to switch languages', () => {
    cy.visit('/en/apps');
    cy.contains('Login').as('loginButton');
    cy.contains('EN').click();
    cy.contains('Dutch (Nederlands)').click();
    cy.get('@loginButton').should('contain.text', 'Inloggen');
  });
});
