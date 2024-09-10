export async function getCurrentUserAppMember(): Promise<void> {
  // TODO
}

// OLD
// export async function getAppAccount(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId },
//     user,
//   } = ctx;
//   const { baseLanguage, language, query } = parseLanguage(ctx, ctx.query?.language);
//
//   const app = await App.findOne({
//     where: { id: appId },
//     ...createAppAccountQuery(user as User, query),
//   });
//
//   assertKoaError(!app, ctx, 404, 'App account not found');
//
//   ctx.body = outputAppMember(app, language, baseLanguage);
// }
