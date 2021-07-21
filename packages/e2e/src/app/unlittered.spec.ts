describe('Unlittered app', () => {
  const { host, protocol } = new URL(Cypress.config().baseUrl);
  const url = `${protocol}//unlittered.appsemble.${host}`;

  it('should match a screenshot in desktop mode', () => {
    cy.visit(url, {
      onBeforeLoad(win) {
        // E.g., force Barcelona geolocation
        const latitude = 41.388_79;
        const longitude = 2.158_99;
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) =>
          cb({ coords: { latitude, longitude } }),
        );
      },
    });
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
    cy.mockGeolocation();
    cy.matchImageSnapshot();
  });

  it('should match a screenshot in mobile mode', () => {
    cy.viewport('iphone-x');
    cy.visit(url);
    cy.get('[data-block]').should('exist');
    cy.get('.appsemble-loader', { includeShadowDom: true }).should('not.exist');
    cy.mockGeolocation();
    cy.matchImageSnapshot();
  });
});
