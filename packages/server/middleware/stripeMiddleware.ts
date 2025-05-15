import { logger, throwKoaError } from '@appsemble/node-utils';
import { type ParameterizedContext } from 'koa';
import type compose from 'koa-compose';
import getRawBody from 'raw-body';
import Stripe from 'stripe';

import { argv } from '../utils/argv.js';

export function stripeMiddleware(): compose.Middleware<ParameterizedContext> {
  return async (ctx, next) => {
    const stripe = new Stripe(argv.stripeApiKey);
    const rawBody = await getRawBody(ctx.req);
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        ctx.headers['stripe-signature']!,
        argv.stripeSecret,
      );
      ctx.request.body = event;
    } catch (error) {
      logger.error(error);
      throwKoaError(ctx, 400, 'Bad request.');
    }
    return next();
  };
}
