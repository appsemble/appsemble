describe('Notes', () => {
  beforeEach(() => {
    const { host, protocol } = new URL(Cypress.config().baseUrl);
    const url = `${protocol}//notes.appsemble.${host}`;

    cy.visit(url, {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
  });

  it('should create a new note and view it', () => {
    const date = Date.now();
    cy.loginApp();
    cy.waitForAppLoaded();
    cy.get('.button.is-rounded').click();
    cy.get('#title').type(`Title ${date}`);
    cy.get('#body').type(`Body ${date}`, { force: true });
    cy.get('button[type="submit"]').click();
    cy.contains(`Title ${date}`).as('hr').should('exist');
    cy.get('@hr').click();
    cy.get('h6.title').should('contain.text', `Title ${date}`);
    cy.get('div.content').should('contain.text', `Body ${date}`);
  });
});
