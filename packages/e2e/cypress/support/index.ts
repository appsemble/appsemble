// XXX: Make this cleaner
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to mock the location.
     *
     * @example cy.mockGeolocation(latitude = 51.476_852, longitude = 0)
     */
    mockGeolocation: (latitude?: number, longitude?: number) => Chainable<Element>;
  }
}

Cypress.Commands.add('mockGeolocation', (latitude = 51.476_852, longitude = 0) => {
  cy.window().then(($window) => {
    cy.stub($window.navigator.geolocation, 'getCurrentPosition').callsFake((callback) =>
      callback({ coords: { latitude, longitude, accuracy: 0 } }),
    );
  });
});
