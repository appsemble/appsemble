describe('Notes app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//notes.appsemble.${host}`;
  const cached = false;

  function login(): void {
    cy.get('.appsemble-loader').should('not.exist');
    cy.get('.appsemble-login > button').click();
    cy.get('#email').type(Cypress.env('BOT_ACCOUNT_EMAIL'));
    cy.get('#password').type(Cypress.env('BOT_ACCOUNT_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.get('.has-text-centered > .button.is-primary').click();
    cy.waitForAppLoaded();
  }

  const clearLocalStorage = {
    onBeforeLoad: (window: Window) => {
      window.localStorage.clear();
    },
  };

  function visitCached(): void {
    if (cached) {
      cy.visit(url, clearLocalStorage);
    } else {
      cy.visitAndWaitForCss(url, clearLocalStorage);
    }
  }

  it('should match a screenshot in desktop mode', () => {
    cy.intercept({ url: '/api/apps/*/resources/note', method: 'GET' }, { body: [] });
    visitCached();
    login();
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.intercept({ url: '/api/apps/*/resources/note', method: 'GET' }, { body: [] });
    cy.viewport('iphone-x');
    visitCached();
    login();
    cy.matchImageSnapshot();
  });

  it('should create a new note and view it', () => {
    const date = Date.now();
    visitCached();
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
