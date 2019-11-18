export default async function oauth2ConnectHandler(ctx, next) {
  console.dir('connect');
  return next();
}
