describe('Survey app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//survey.appsemble.${host}`;
  let cached = false;

  beforeEach(() => {
    if (cached) {
      cy.visitAndWaitForCss(url);
      cached = true;
    } else {
      cy.visit(url);
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
});
