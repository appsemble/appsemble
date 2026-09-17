Support for calling the `asset()` CSS utility inside `url()`, as in `url(asset('logo'))`, and for
calling it with an unquoted reference, as in `asset(logo)`. Use `asset('logo')` on its own. An
unquoted reference is rejected when the app is published; a nested call is left as written.
