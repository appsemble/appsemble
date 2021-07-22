describe('/docs', () => {
  beforeEach(() => {
    cy.visit('/en/docs');
  });

  it('should render the getting started page', () => {
    cy.contains('Getting Started').should('exist');
  });
});
