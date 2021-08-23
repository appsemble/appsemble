describe('Person', () => {
  let cached = false;

  beforeEach(() => {
    cy.visitApp(cached, 'person');
    cached = true;
  });

  it('should submit a new person and view it', () => {
    const date = Date.now();

    const firstName = `First name ${date}`;
    const lastName = `Last name ${date}`;
    const email = `Email${date}@example.com`;
    const description = `Description ${date}`;

    // XXX:  Cypress appears to think these elements are disabled if force is not set to true.
    cy.get('[placeholder="First name"]').type(firstName, {
      force: true,
    });
    cy.get('[placeholder="Last name"]').type(lastName, {
      force: true,
    });
    cy.get('[placeholder="Email"]').type(email, {
      force: true,
    });
    cy.get('[placeholder="Description"]').type(description, {
      force: true,
    });

    cy.get('button[type="submit"]').click();

    cy.contains(firstName).as('td').should('exist');
    cy.contains(lastName).should('exist');
    cy.get('@td').click();

    cy.contains(firstName).should('exist');
    cy.contains(lastName).should('exist');
    cy.contains(email).should('exist');
    cy.contains(description).should('exist');
  });
});
