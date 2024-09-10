export async function getCurrentUserAppMembers(): Promise<void> {
  // TODO
}

// OLD
// export async function getAppAccounts(ctx: Context): Promise<void> {
//   const { user } = ctx;
//   const { baseLanguage, language, query } = parseLanguage(ctx, ctx.query?.language);
//
//   const apps = await App.findAll(createAppAccountQuery(user as User, query));
//
//   ctx.body = apps.map((app) => outputAppMember(app, language, baseLanguage));
// }
