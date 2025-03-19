import { assertKoaCondition } from '@appsemble/node-utils';
import { stripPem } from '@appsemble/utils';
import { type Context } from 'koa';
import { toXml } from 'xast-util-to-xml';
import { x as h } from 'xastscript';

import { AppSamlSecret } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { NS } from '../../../../utils/saml.js';

export async function getAppSamlEntityId(ctx: Context): Promise<void> {
  const {
    path,
    pathParams: { appId, appSamlSecretId },
  } = ctx;

  const secret = await AppSamlSecret.findOne({
    attributes: ['spCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  assertKoaCondition(secret != null, ctx, 404, 'SAML secret not found');

  ctx.body = toXml(
    <>
      {{
        type: 'instruction',
        name: 'xml',
        value: 'version="1.0" encoding="utf-8"',
      }}
      <md:EntityDescriptor entityID={String(new URL(path, argv.host))} xmlns:md={NS.md}>
        <md:SPSSODescriptor
          AuthnRequestsSigned="true"
          protocolSupportEnumeration={NS.samlp}
          WantAssertionsSigned="true"
        >
          <md:KeyDescriptor use="signing">
            <ds:KeyInfo xmlns:ds={NS.ds}>
              <ds:X509Data>
                <ds:X509Certificate>{stripPem(secret.spCertificate, true)}</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
          </md:KeyDescriptor>
          <md:KeyDescriptor use="encryption">
            <ds:KeyInfo xmlns:ds={NS.ds}>
              <ds:X509Data>
                <ds:X509Certificate>{stripPem(secret.spCertificate, true)}</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
          </md:KeyDescriptor>
          <md:AssertionConsumerService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location={String(new URL(`/api/apps/${appId}/saml/${appSamlSecretId}/acs`, argv.host))}
          />
        </md:SPSSODescriptor>
      </md:EntityDescriptor>
    </>,
    { closeEmptyElements: true, tightClose: true },
  );
}
