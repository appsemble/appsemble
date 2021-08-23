describe('Empty', () => {
  let cached = false;

  beforeEach(() => {
    cy.visitApp(cached, 'empty');
    cached = true;
  });

  it('should navigate to the second page and back', () => {
    cy.get('a.button').click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page B');
    cy.get('a.button').click();
    cy.get('h2.navbar-item.title').should('contain.text', 'Example Page A');
  });
});
