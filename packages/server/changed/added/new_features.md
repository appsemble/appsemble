Add `user.properties` parsing and validation to app member endpoints. Add reseed demo app endpoint.
Add demo app logic for resources endpoints. Add demo app logic for assets endpoints. Add `AppMember`
`BeforeCreate` and `BeforeUpdate` hooks for `user.properties` validation. Add `Resource`
`BeforeDelete` hook for `user.properties` update. Add logic for demo apps to get the user who seeded
the resource on action permission validation instead of the logged in one.
