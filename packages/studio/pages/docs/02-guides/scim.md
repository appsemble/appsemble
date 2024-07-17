# SCIM

## What is SCIM?

SCIM (System for Cross-domain Identity Management) is an open standard that allows for the
automation of user provisioning between your system and a target application. This means that you
can connect your identity management service with an Appsemble application to have your users
synchronized.

## How to set up SCIM (in Azure)

Here is a guide on how to set up SCIM for your application. To follow this guide, it is assumed you
have an Azure Active Directory already set up and filled with users.

### 1. Azure setup

1. Within your Active Directory overview screen, navigate to **Manage** -> **Enterprise
   applications** on the left side of the page. This should navigate you to an overview of all
   connected external applications.

2. Click on **New application**. This sends you to the Azure AD Gallery.

3. Click on **Create your own application**. A new menu should open up where you can fill in the
   app’s information.

   Under **What’s the name of your app?** you can put anything you want as the name of the
   application you’re connecting. To make it easier to identify what the app is for, you can call it
   something like `Appsemble - Notes App`.

   Below that, under **What are you looking to do with your application?**, choose the option that
   says: “Integrate any other application you don’t find in the gallery (Non-gallery)”

   After this, press the “Create” button to create the application.

4. Once the application has been created, make sure the users assigned to this application are
   correct. You can find this under **Manage** -> **Users and groups**. If this is not correct, you
   can add these users manually by pressing the **Add user/group** button.

   When you’ve set up the application correctly within your Azure Active Directory, you can move to
   setting up the SCIM configuration within the Appsemble application.

### 2. Appsemble setup

1. Firstly, to configure your Appsemble application so that individual users can log in, your app
   definition needs to contain a basic
   [security definition](/docs/03-guide/security#security-definition).

   **(Optional)** If your application wants to use the [Teams](/docs/03-guide/teams) functionality,
   this security definition also has to contain a [teams definition](/docs/03-guide/security#teams).

2. In your application, go to **Secrets** -> **SCIM**.

   Check the **Enable SCIM** box, and press the **Regenerate SCIM token** button. Your app’s
   credentials should be ready to put in Azure.

### 3. Azure provisioning setup

1. Navigate back to the Azure Active Directory’s Enterprise application you set up before, and go to
   the **Provisioning** page. On this page, click on the **Provisioning** tab. Under **Provisioning
   Mode**, select `Automatic`. A new section should appear called “Admin Credentials”. In this
   section, fill in the following information which can be found in the **Secrets** tab you just
   filled in:

- **Tenant URL**: Tenant URL from the Appsemble application.
- **Secret token**: Secret token from the Appsemble application.

  Once these are filled in, click on “Test connection” to validate the connection to Appsemble.

2. Under **Mappings**, set up the desired attribute mappings you need for your application. The
   supported attributes can be found at
   [Supported attribute mappings](/docs/03-development/03-SCIM-development#supported-attribute-mappings).

   **Note:** As of now, “Group” mappings are not supported. Turn these off to prevent provisioning
   issues.

3. Save your changes, and go to the **Overview** page. There, click on **Start provisioning**. The
   SCIM connection should now be in place, and Azure should automatically provision your users to
   the application.
