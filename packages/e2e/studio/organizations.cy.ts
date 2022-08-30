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

  it('should cancel the deletion of invite', () => {
    cy.get('[href="/en/organizations/appsemble/members]').click();
    cy.contains('Organization Members').should('exist');
    cy.get('button[class="button"]').should('exist').click();
    cy.contains('Add new members').should('exist');
    cy.get('input[class="input"]').should('exist').type('foo@bar.com');
    cy.get('button[class="button"]').should('exist').click();
    cy.get('table').contains('foo@bar.com').should('exist');
    cy.get('button[class="button is-danger", title="Delete invite"]').should('exist').click();
    cy.contains('Delete invite').should('exist');
    cy.get('button[class="button is-white"]').contains('Cancel').should('exist').click();
    cy.get('table').contains('foo@bar.com').should('exist');
  });

  it('should delete invite', () => {
    cy.get('[href="/en/organizations/appsemble/members]').click();
    cy.contains('Organization Members').should('exist');
    cy.get('button[class="button"]').should('exist').click();
    cy.contains('Add new members').should('exist');
    cy.get('input[class="input"]').should('exist').type('foodelete@bar.com');
    cy.get('button[class="button"]').should('exist').click();
    cy.get('table').contains('foodelete@bar.com').should('exist');
    cy.get('button[class="button is-danger", title="Delete invite"]').should('exist').click();
    cy.contains('Delete invite').should('exist');
    cy.get('button[class="button is-danger"]').contains('Delete invite').should('exist').click();
    cy.get('table').contains('foodelete@bar.com').should('not.exist');
  });
});
