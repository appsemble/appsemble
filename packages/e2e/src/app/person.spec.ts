describe('Person app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//person.appsemble.${host}`;
  let cached = false;

  beforeEach(() => {
    if (cached) {
      cy.visit(url);
    } else {
      cy.visitAndWaitForCss(url);
      cached = true;
    }
    cy.waitForAppLoaded();
  });

  it('should match a screenshot in desktop mode', () => {
    cy.matchImageSnapshot();
  });

  it('should match a screenshot of the person list in desktop mode', () => {
    cy.intercept(
      { url: '/api/apps/*/resources/person', method: 'GET' },
      { fixture: 'person-list.json' },
    );

    cy.contains('Person List').click();

    cy.waitForAppLoaded();

    cy.contains('John', { includeShadowDom: true }).should('exist');
    cy.contains('Doe', { includeShadowDom: true }).should('exist');

    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.matchImageSnapshot();
  });

  it('should match a screenshot of the person list in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.intercept(
      { url: '/api/apps/*/resources/person', method: 'GET' },
      { fixture: 'person-list.json' },
    );

    cy.get('.navbar-burger').click();
    cy.contains('Person List').click();

    cy.waitForAppLoaded();

    cy.contains('John', { includeShadowDom: true }).should('exist');
    cy.contains('Doe', { includeShadowDom: true }).should('exist');

    cy.matchImageSnapshot();
  });

  it('should submit a new person and view it', () => {
    const date = Date.now();

    const firstName = `First name ${date}`;
    const lastName = `Last name ${date}`;
    const email = `Email${date}@example.com`;
    const description = `Description ${date}`;

    // XXX:  Cypress appears to think these elements are disabled if force is not set to true.
    cy.get('[placeholder="First name"]', { includeShadowDom: true }).type(firstName, {
      force: true,
    });
    cy.get('[placeholder="Last name"]', { includeShadowDom: true }).type(lastName, {
      force: true,
    });
    cy.get('[placeholder="Email"]', { includeShadowDom: true }).type(email, {
      force: true,
    });
    cy.get('[placeholder="Description"]', { includeShadowDom: true }).type(description, {
      force: true,
    });

    cy.get('button[type="submit"]', { includeShadowDom: true }).click();

    cy.contains(firstName, { includeShadowDom: true }).as('td').should('exist');
    cy.contains(lastName, { includeShadowDom: true }).should('exist');
    cy.get('@td').click();

    cy.contains(firstName, { includeShadowDom: true }).should('exist');
    cy.contains(lastName, { includeShadowDom: true }).should('exist');
    cy.contains(email, { includeShadowDom: true }).should('exist');
    cy.contains(description, { includeShadowDom: true }).should('exist');
  });
});
