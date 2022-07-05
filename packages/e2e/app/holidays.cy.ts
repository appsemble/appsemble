describe('Holidays', () => {
  let cached = false;

  beforeEach(() => {
    cy.intercept(
      { method: 'GET', url: '/api/apps/*/action/pages.0.tabs.0.blocks.0.actions.onLoad*' },
      { fixture: 'holidays-nl.json' },
    );
    cy.intercept(
      { method: 'GET', url: '/api/apps/*/action/pages.0.tabs.1.blocks.0.actions.onLoad*' },
      { fixture: 'holidays-de.json' },
    );
    cy.intercept(
      { method: 'GET', url: '/api/apps/*/action/pages.1.tabs.0.blocks.0.actions.onLoad*' },
      { fixture: 'holidays-us.json' },
    );

    cy.visitApp(cached, 'holidays');
    cached = true;
  });

  it('should navigate to the second tab', () => {
    cy.contains('Eerste Kerstdag').should('exist');
    cy.contains('Germany').click();
    cy.contains('Mariä Himmelfahrt').should('exist');
  });

  it('should navigate to the American holidays page', () => {
    cy.contains('Eerste Kerstdag').should('exist');
    cy.contains('Holidays in America').click();
    cy.contains('Independence Day').should('exist');
  });
});
