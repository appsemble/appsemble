describe('Notes', () => {
  let cached = false;

  beforeEach(() => {
    cy.visitApp(cached, 'notes', {
      onBeforeLoad: (window) => {
        window.localStorage.clear();
      },
    });
    cached = true;
  });

  it('should create a new note and view it', () => {
    const date = Date.now();
    cy.loginApp();
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
