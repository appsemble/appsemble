describe('/apps', () => {
  beforeEach(() => {
    cy.visit('/en/apps');
  });

  it('should show the page header', () => {
    cy.contains('All Apps').should('exist');
    cy.contains('My Apps').should('not.exist');
  });

  it('should display “My Apps” when logged in', () => {
    cy.login('/en/apps');
    cy.contains('My Apps').should('exist');
  });

  it('should render a list of apps', () => {
    cy.waitForAPICall({ url: '/api/apps*' });
    cy.contains('Empty App').should('exist');
    cy.contains('Holidays').should('exist');
    cy.contains('Notes').should('exist');
    cy.contains('Person').should('exist');
    cy.contains('Survey').should('exist');
    cy.contains('Unlittered').should('exist');
  });

  it('should link to app details', () => {
    cy.contains('Empty App').click();
    cy.contains(
      'Empty App is a bare-bones app with two pages and buttons switching between them.',
    ).should('exist');
  });
});
