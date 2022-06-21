describe('/apps/:appId', () => {
  beforeEach(() => {
    cy.login('/en/apps');
    cy.contains('Person').click();
    cy.contains('Clone App');
  });

  it('should link to the asset viewer', () => {
    cy.contains('Assets').click();
    cy.contains('Upload new asset').should('exist');
  });

  it('should link to resources', () => {
    cy.contains('Resources').click();
    cy.contains('This app has the following resources').should('exist');
  });

  it('should link to a specific resource', () => {
    cy.contains('Resources').click();
    cy.contains('person').click();
    cy.contains('Resource person').should('exist');
  });

  it('should link to the translator tool', () => {
    cy.contains('Translations').click();
    cy.contains('Selected language').should('exist');
  });

  it('should link to the notification sender', () => {
    cy.contains('Notifications').click();
    cy.contains('Push notifications are currently not enabled in this app.').should('exist');
  });

  it('should link to the snapshots page', () => {
    cy.contains('Snapshots').click();
    cy.contains('Snapshots').should('exist');
    cy.get('ul').last().children().should('have.length.gte', 1);
  });

  it('should link to the app settings', () => {
    cy.get('.menu > .menu-list').last().contains('Settings').click();
    cy.contains('App lock').should('exist');
    cy.contains('Dangerous actions').should('exist');
  });

  it('should link to the app secrets', () => {
    cy.contains('Secrets').click();
    cy.contains('Appsemble Login').should('exist');
  });
});
