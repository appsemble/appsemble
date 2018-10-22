import fs from 'fs';

import { template } from 'lodash';
import nodemailer from 'nodemailer';
import { markdown } from 'nodemailer-markdown';
import path from 'path';

/**
 * Extract template variables into an object
 * @param {String} input Markdown to process
 * @return {{params: object, filtered: String}} Object containing params object and filtered input string
 */
function getCommentVariables(input) {
  const regex = /^<!--[\s\S]*?-->/g;
  const comment = input.match(regex)[0];
  const params = {};

  if (comment) {
    comment
      .replace(/<!--(-*)|(-*)-->/g, '')
      .split(/\r?\n/)
      .forEach(line => {
        if (!line) {
          return;
        }

        const [key, value] = line.split('=');
        params[key] = value;
      });
  }

  const filtered = input.replace(regex, '');

  return { params, filtered };
}

async function getTransport() {
  let transport;

  if (process.env.NODE_ENV === 'production') {
    transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: 'appsemble@d-centralize.nl',
        accessToken: '',
      },
    });
  } else {
    const account = await nodemailer.createTestAccount();
    transport = nodemailer.createTransport({
      ...account.smtp,
      auth: { user: account.user, pass: account.pass },
    });
  }

  transport.use('compile', markdown());
  return transport;
}

export async function sendEmail({ to, from, cc, bcc, subject }, message) {
  const transport = await getTransport();
  const result = await transport.sendMail({
    from,
    to,
    subject,
    cc,
    bcc,
    markdown: message,
  });

  if (process.env.NODE_ENV !== 'production' && transport.options.host === 'smtp.ethereal.email') {
    // eslint-disable-next-line no-console
    console.log(`Mail sent: ${nodemailer.getTestMessageUrl(result)}`);
  }

  return result;
}

export async function sendWelcomeEmail({ email, name, url }) {
  const welcome = fs.readFileSync(path.join(__dirname, '../templates/welcome.md'), 'utf8');
  const { params, filtered } = getCommentVariables(welcome);
  const { subject } = params || 'Welcome to Appsemble';

  const replacements = {
    ...params,
    ...(name && { name }),
    url,
  };
  const to = name ? `"${name}" <${email}>` : email;
  const content = template(filtered)(replacements);
  const result = await sendEmail({ to, from: 'appsemble@d-centralize.nl', subject }, content);

  return result;
}
