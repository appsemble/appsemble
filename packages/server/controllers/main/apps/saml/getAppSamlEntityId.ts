import { assertKoaCondition } from '@appsemble/node-utils';
import { stripPem } from '@appsemble/utils';
import { type Context } from 'koa';
import { toXml } from 'xast-util-to-xml';
import { x as h } from 'xastscript';

import { App, getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { NS } from '../../../../utils/saml.js';

export async function getAppSamlEntityId(ctx: Context): Promise<void> {
  const {
    path,
    pathParams: { appId, appSamlSecretId },
  } = ctx;
  const app = await App.findOne({
    where: { id: appId },
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppSamlSecret } = await getAppDB(appId);
  const secret = await AppSamlSecret.findOne({
    attributes: ['spCertificate'],
    where: { id: appSamlSecretId },
  });

  assertKoaCondition(secret != null, ctx, 404, 'SAML secret not found');

  ctx.body = toXml(
    {
      type: 'root',
      children: [
        {
          type: 'instruction',
          name: 'xml',
          value: 'version="1.0" encoding="utf-8"',
        },
        h(
          'md:EntityDescriptor',
          { entityID: String(new URL(path, argv.host)), 'xmlns:md': NS.md },
          h(
            'md:SPSSODescriptor',
            {
              AuthnRequestsSigned: 'true',
              protocolSupportEnumeration: NS.samlp,
              WantAssertionsSigned: 'true',
            },
            h(
              'md:KeyDescriptor',
              { use: 'signing' },
              h(
                'ds:KeyInfo',
                { 'xmlns:ds': NS.ds },
                h(
                  'ds:X509Data',
                  {},
                  h('ds:X509Certificate', {}, stripPem(secret.spCertificate, true)),
                ),
              ),
            ),
            h(
              'md:KeyDescriptor',
              { use: 'encryption' },
              h(
                'ds:KeyInfo',
                { 'xmlns:ds': NS.ds },
                h(
                  'ds:X509Data',
                  {},
                  h('ds:X509Certificate', {}, stripPem(secret.spCertificate, true)),
                ),
              ),
            ),
            h('md:AssertionConsumerService', {
              Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
              Location: String(
                new URL(`/api/apps/${appId}/saml/${appSamlSecretId}/acs`, argv.host),
              ),
            }),
          ),
        ),
      ],
    },
    { closeEmptyElements: true, tightClose: true },
  );
}
