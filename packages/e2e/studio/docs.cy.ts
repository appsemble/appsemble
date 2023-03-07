describe('/docs', () => {
  beforeEach(() => {
    cy.visit('/en/docs');
  });

  it('should render the reading guide page', () => {
    cy.contains('Reading guide').should('exist');
  });
});
