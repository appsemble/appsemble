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
    cy.login('/en/organizations/appsemble/members');
    cy.contains('Organization Members').should('exist');
    cy.get('button[class="button"]').should('exist').click();
    cy.contains('Add new members').should('exist');
    cy.get('input[name="email"]').should('exist').type('foo@bar.com');
    cy.get('button[type="submit"]').should('contain.text', 'Add members').click();
    cy.get('table')
      .contains('foo@bar.com')
      .should('exist')
      .parent('tr')
      .within(() => {
        cy.get('button[title="Delete invite"]').should('exist').click();
      });
    cy.contains('Delete invite').should('exist');
    cy.get('button[type=button]')
      .contains('Cancel')
      .should('exist')
      .then(($button) => {
        $button.click();
      });
  });

  it('should delete invite', () => {
    cy.login('/en/organizations/appsemble/members');
    cy.contains('Organization Members').should('exist');
    cy.get('table')
      .contains('foo@bar.com')
      .should('exist')
      .parent('tr')
      .within(() => {
        cy.get('button[title="Delete invite"]').should('exist').click();
      });
    cy.contains('Delete invite').should('exist');
    cy.get('button[type="button"]').contains('Delete invite').should('exist').click();
    cy.get('table').contains('foo@bar.com').should('not.exist');
  });
});
