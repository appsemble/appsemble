import bcrypt from 'bcrypt';
import Boom from 'boom';

export async function registerEmail(ctx) {
  const { body } = ctx.request;
  const { User, EmailAuthorization } = ctx.state.db;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const email = await EmailAuthorization.create({ ...body, password });
    await User.create({ EmailAuthentication: email }, { include: EmailAuthorization });

    ctx.status = 201;
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw Boom.badRequest('User with this email address already exists.');
    } else throw e;
  }
}

export async function auth(ctx) {
  ctx.body = 'ok';
}
