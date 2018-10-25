<!--
subject=Welcome to Appsemble
-->

<%= greeting %>,

Thank you for registering your account.  
Before you can use your account, we need to verify your email address.

Please follow the link below to verify your email address:  
<%= url %>

Kind regards,

<%= (typeof(sender) !== "undefined") ? sender : '_The Appsemble Team_' %>
