import { logger, throwKoaError } from '@appsemble/node-utils';
import { type ParameterizedContext } from 'koa';
import type compose from 'koa-compose';
import getRawBody from 'raw-body';
import Stripe from 'stripe';

import { App } from '../models/App.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';

export function stripeMiddleware(): compose.Middleware<ParameterizedContext> {
  return async (ctx, next) => {
    const rawBody = await getRawBody(ctx.req);
    const appId = ctx.path.split('/')[ctx.path.split('/').length - 2];
    let secret;
    let apiKey;
    if (appId === '-1') {
      secret = argv.stripeSecret;
      apiKey = argv.stripeApiKey;
    } else {
      const app = await App.findByPk(Number(appId), {
        attributes: ['stripeSecret', 'stripeApiKey'],
      });
      secret = app ? decrypt(app.stripeSecret!, argv.aesSecret) : undefined;
      apiKey = app ? decrypt(app.stripeApiKey!, argv.aesSecret) : undefined;
    }
    if (!apiKey || !secret) {
      throwKoaError(ctx, 401, 'Missing Stripe credentials.');
    }
    const stripe = new Stripe(apiKey);
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        ctx.headers['stripe-signature']!,
        secret,
      );
      ctx.request.body = event;
    } catch (error) {
      logger.error(error);
      throwKoaError(ctx, 400, 'Bad request.');
    }
    return next();
  };
}
