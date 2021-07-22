describe('Notes app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//notes.appsemble.${host}`;

  function login(): void {
    cy.get('.appsemble-loader').should('not.exist');
    cy.get('.appsemble-login > button').click();
    cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
    cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.get('.has-text-centered > .button.is-primary').click();
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
  }

  it('should match a screenshot in desktop mode', () => {
    cy.intercept({ url: '/api/apps/*/resources/note', method: 'GET' }, { body: [] });
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    login();
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.intercept({ url: '/api/apps/*/resources/note', method: 'GET' }, { body: [] });
    cy.viewport('iphone-x');
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    login();
    cy.matchImageSnapshot();
  });

  it('should create a new note and view it', () => {
    const date = Date.now();

    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    login();
    cy.get('.button.is-rounded', { includeShadowDom: true }).click();
    cy.get('#title', { includeShadowDom: true }).type(`Title ${date}`);
    cy.get('#body', { includeShadowDom: true }).type(`Body ${date}`, { force: true });
    cy.get('button[type="submit"]', { includeShadowDom: true }).click();
    cy.contains(`Title ${date}`, { includeShadowDom: true }).as('hr').should('exist');
    cy.get('@hr').click();
    cy.get('h6.title', { includeShadowDom: true }).should('contain.text', `Title ${date}`);
    cy.get('div.content', { includeShadowDom: true }).should('contain.text', `Body ${date}`);
  });
});
