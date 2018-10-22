<!--
subject=Confirm account registration
-->

<%= (typeof(name) !== "undefined") ? `Hello ${name},` : 'Hello,'%>

Someone has requested to resend the verification key for your account.  
Before you can use your account, we need to verify your email address.

Please follow the link below to verify your email address:  
<%= url %>

**Didn’t request this email?**  
No worries! Your address may have been entered by mistake. If you ignore or delete this email,
nothing further will happen.

Kind regards,

<%= (typeof(sender) !== "undefined") ? sender : 'Appsemble' %>
