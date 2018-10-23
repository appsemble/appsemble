<!--
subject=Welcome to Appsemble
-->

<%= (typeof(Name) !== "undefined") ? `Hello ${Name},` : 'Hello,'%>

Thank you for registering your account.  
Before you can use your account, we need to verify your email address.

Please follow the link below to verify your email address:  
<%= url %>

Kind regards,

<%= (typeof(sender) !== "undefined") ? sender : 'Appsemble' %>
