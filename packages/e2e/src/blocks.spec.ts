describe('/blocks', () => {
  beforeEach(() => {
    cy.visit('/en/blocks');
  });

  it('should render a list of blocks', () => {
    cy.get('[title="@appsemble/data-loader"]').as('data-loader').should('exist');
    cy.get('@data-loader').contains('data-loader');
    cy.get('@data-loader').contains('@appsemble');
    cy.get('@data-loader').contains('data-loader');
    cy.get('@data-loader').contains('A block that fetches data and emits it using the events API.');
  });

  it('should link to block details', () => {
    cy.get('[title="@appsemble/data-loader"]').as('data-loader').should('exist');
    cy.get('@data-loader').contains('View details').click();
    cy.contains('Parameters').should('exist');
    cy.contains('Actions').should('exist');
    cy.contains('Events').should('exist');
  });
});
