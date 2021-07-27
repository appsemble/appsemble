describe('Empty app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//empty.appsemble.${host}`;
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

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.matchImageSnapshot();
  });

  it('should navigate to the second page and back', () => {
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page B');
    cy.get('a.button', { includeShadowDom: true }).click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page A');
  });
});
