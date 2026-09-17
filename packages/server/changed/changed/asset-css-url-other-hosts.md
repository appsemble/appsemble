Only rewrite app asset URLs in custom CSS that address the host the app is published to. A URL such
as `url('https://appsemble.app/api/apps/123/assets/logo')` published to another host keeps
addressing that app on that host, where it previously addressed the app being published. Use
`asset('logo')` to address the app being published on any host.
