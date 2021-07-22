describe('/organizations', () => {
  beforeEach(() => {
    cy.visit('/en/organizations');
  });

  it('should render a list of organizations', () => {
    cy.get('[href="/en/organizations/appsemble"]').as('appsemble').should('exist');
    cy.get('@appsemble').contains('Appsemble').should('exist');
    cy.get('@appsemble').contains('appsemble').should('exist');
  });

  it('should link to organization details', () => {
    cy.get('[href="/en/organizations/appsemble"]').click();
    cy.contains('The open source low-code app building platform').should('exist');
    cy.contains('Apps').should('exist');
    cy.contains('Blocks').should('exist');
    cy.contains('Unlittered').should('exist');
    cy.contains('action-button').should('exist');
  });
});
